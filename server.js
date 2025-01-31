const express = require('express');
const fs = require('fs');
const cors = require('cors');
const crypto = require('crypto');
const { obterRespostaIA } = require('./aiService'); // Importa IA
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;


// Função para carregar usuários
const loadUsers = () => {
    try {
        return JSON.parse(fs.readFileSync('keys.json', 'utf8'));
    } catch (error) {
        return {};
    }
};

// Função para salvar usuários
const saveUsers = (users) => {
    fs.writeFileSync('keys.json', JSON.stringify(users, null, 2), 'utf8');
};

// 🟢 Cadastro de Usuário e Empresa
app.post('/cadastrar-usuario', (req, res) => {
    const { numero, senha, empresa } = req.body;

    if (!numero || !senha || !empresa) {
        return res.status(400).json({ error: 'Número, senha e empresa são obrigatórios.' });
    }

    const users = loadUsers();

    if (users[numero]) {
        return res.status(400).json({ error: 'Número já cadastrado.' });
    }

    // Criar chave de acesso e definir expiração (30 dias)
    const accessKey = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    users[numero] = {
        password: senha,
        accessKey,
        expiresAt: expiresAt.toISOString(),
        empresa
    };

    saveUsers(users);
    res.status(200).json({ message: 'Usuário cadastrado com sucesso!', accessKey });
});

// 🟢 Login
app.post('/login', (req, res) => {
    const { numero, senha } = req.body;

    if (!numero || !senha) {
        return res.status(400).json({ error: 'Número e senha são obrigatórios.' });
    }

    const users = loadUsers();

    if (!users[numero] || users[numero].password !== senha) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    res.json({ message: 'Login realizado com sucesso!', userData: users[numero] });
});

// 🟢 Gerar Resposta da IA
app.post('/perguntar-ia', async (req, res) => {
    const { numero, mensagem } = req.body;

    if (!numero || !mensagem) {
        return res.status(400).json({ error: 'Número e mensagem são obrigatórios.' });
    }

    const resposta = await obterRespostaIA(mensagem, numero);
    res.json({ resposta });
});

// Serve todos os arquivos da pasta botWhatsapp
app.use(express.static(path.join(__dirname))); // Serve todos os arquivos da pasta botWhatsapp

// Rota para admin.html
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

// Rota principal servindo index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Função auxiliar para carregar as chaves do arquivo
const loadKeys = () => {
    try {
        return JSON.parse(fs.readFileSync('keys.json', 'utf8')); // Certifique-se de que 'keys.json' existe ou crie-o
    } catch (error) {
        return {};
    }
};

// Função auxiliar para salvar as chaves no arquivo
const saveKeys = (keys) => {
    fs.writeFileSync('keys.json', JSON.stringify(keys, null, 2), 'utf8');
};

// Função auxiliar para carregar o status do bot dos usuários
const loadBotStatus = () => {
    try {
        return JSON.parse(fs.readFileSync('botStatus.json', 'utf8')); // Certifique-se de que 'botStatus.json' existe ou crie-o
    } catch (error) {
        return {};
    }
};

// Função auxiliar para salvar o status do bot
const saveBotStatus = (status) => {
    fs.writeFileSync('botStatus.json', JSON.stringify(status, null, 2), 'utf8');
};

// Endpoint para carregar todas as chaves registradas
app.get('/get-keys', (req, res) => {
    try {
        const keys = loadKeys();
        res.json(keys);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao carregar as chaves.' });
    }
});

// Endpoint para validar a chave de acesso
app.get('/validate-key', (req, res) => {
    try {
        const { accessKey, phoneNumber } = req.query;
        const keys = loadKeys();

        if (keys[phoneNumber]) {
            const storedKey = keys[phoneNumber].accessKey;
            const expirationDate = new Date(keys[phoneNumber].expiresAt);

            if (storedKey === accessKey && expirationDate > new Date()) {
                return res.json({ isValid: true, phoneNumber });
            }
        }
        res.json({ isValid: false });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao validar a chave.' });
    }
});

// Endpoint para cadastrar um novo usuário
app.post('/cadastrar-usuario', express.json(), (req, res) => { // Express JSON middleware adicionado
    try {
        const { numero, chave } = req.body;
        if (!numero || !chave) {
            return res.status(400).json({ error: 'Número e chave são obrigatórios.' });
        }

        const keys = loadKeys();
        if (keys[numero]) {
            return res.status(400).json({ error: 'Número já cadastrado.' });
        }

        keys[numero] = { accessKey: chave, expiresAt: new Date().toISOString() };
        saveKeys(keys);

        res.status(200).json({ message: 'Usuário cadastrado com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

// Endpoint para renovar a chave de acesso de um usuário
app.post('/renovar-chave', (req, res) => {
    try {
        const { numero } = req.body;

        if (!numero) {
            return res.status(400).json({ error: 'Número de telefone é obrigatório.' });
        }

        const keys = loadKeys();

        if (!keys[numero]) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        // Gerar nova chave e atualizar a data de expiração
        const newAccessKey = crypto.randomBytes(16).toString('hex');
        const newExpiresAt = new Date();
        newExpiresAt.setDate(newExpiresAt.getDate() + 30);  // Alteração aqui para adicionar 30 dias

        keys[numero] = { accessKey: newAccessKey, expiresAt: newExpiresAt.toISOString() };
        saveKeys(keys);

        res.json({ message: 'Chave renovada com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao renovar chave.' });
    }
});


// Endpoint para obter o QR Code
app.get('/generate-qr', (req, res) => {
    if (global.qrCodeUrl) {
        res.json({ qrCodeUrl: global.qrCodeUrl });
    } else {
        res.status(500).json({ error: 'QR Code ainda não gerado. Aguarde alguns instantes e tente novamente.' });
    }
});

// Endpoint para ligar/desligar o bot de um usuário específico
app.post('/desligar-bot', express.json(), (req, res) => { // Express JSON middleware adicionado
    const { numero } = req.body;

    if (!numero) {
        return res.status(400).json({ error: 'Número de telefone é obrigatório.' });
    }

    const botStatus = loadBotStatus();

    // Verifica se o bot já está desligado
    if (botStatus[numero] && botStatus[numero] === 'desligado') {
        return res.status(400).json({ error: 'Bot já está desligado para este número.' });
    }

    // Desliga o bot para o número
    botStatus[numero] = 'desligado';
    saveBotStatus(botStatus);

    res.json({ message: `Bot desligado para o número ${numero}.` });
});

app.post('/ligar-bot', express.json(), (req, res) => { // Express JSON middleware adicionado
    const { numero } = req.body;

    if (!numero) {
        return res.status(400).json({ error: 'Número de telefone é obrigatório.' });
    }

    const botStatus = loadBotStatus();

    // Verifica se o bot já está ligado
    if (botStatus[numero] && botStatus[numero] === 'ativo') {
        return res.status(400).json({ error: 'Bot já está ligado para este número.' });
    }

    // Liga o bot para o número
    botStatus[numero] = 'ativo';
    saveBotStatus(botStatus);

    res.json({ message: `Bot ligado para o número ${numero}.` });
});

// Permite todas as origens (você pode especificar apenas as origens que deseja)
app.use(cors());

// Iniciando o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
