const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

const app = express();
const port = process.env.PORT || 3000;

// Inicializa o cliente do WhatsApp Web
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: '/usr/bin/chromium-browser'  // O caminho pode variar dependendo do ambiente
    }
});


// 🔹 Configuração do servidor HTTP e WebSocket
const server = http.createServer(app);
const io = socketIo(server);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Caminho para o arquivo de dados
const dataFilePath = path.join(__dirname, 'data', 'data.json');

// Função para carregar os dados do arquivo JSON
function loadData() {
    if (!fs.existsSync(dataFilePath)) return {};
    const rawData = fs.readFileSync(dataFilePath);
    return JSON.parse(rawData);
}

// Função para salvar os dados no arquivo JSON
function saveData(data) {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 4));
}

// 🔹 Rota para obter todos os usuários (Admin)
app.get('/get-usuarios', (req, res) => {
    try {
        const usuarios = loadData();
        res.json(usuarios);
    } catch (error) {
        console.error("Erro ao carregar usuários:", error);
        res.status(500).json({ error: "Erro ao buscar usuários" });
    }
});

// 🔹 Rota para renovar chave de acesso (+30 dias)
app.post('/renovar-chave', (req, res) => {
    const { telefone } = req.body;

    try {
        const data = loadData();

        const usuario = data[telefone];

        if (!usuario) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const dataAtual = new Date();
        const novaDataExpiracao = new Date(dataAtual.setDate(dataAtual.getDate() + 30));

        usuario.chave_expiracao = novaDataExpiracao.getTime();

        saveData(data);

        res.json({ success: true, message: 'Chave renovada com sucesso!' });
    } catch (error) {
        console.error("Erro ao renovar chave:", error);
        res.status(500).json({ error: 'Erro ao renovar chave' });
    }
});

// 🔹 Rota para cadastrar usuário
app.post('/cadastro', (req, res) => {
    try {
        const { usuario, telefone, empresa, senha } = req.body;

        if (!usuario || !telefone || !empresa || !senha) {
            return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios' });
        }

        const telefoneFormatado = telefone.replace(/[^\d]/g, '');
        if (telefoneFormatado.length !== 11) {
            return res.status(400).json({ success: false, message: 'Telefone inválido. Certifique-se de incluir 11 dígitos.' });
        }

        const data = loadData();

        if (data[telefoneFormatado]) {
            return res.status(400).json({ success: false, message: 'Telefone já cadastrado' });
        }

        const chave = Math.random().toString(36).substr(2, 10);
        const chaveExpiracao = new Date().setDate(new Date().getDate() + 30); 

        const newUser = {
            usuario,
            telefone: telefoneFormatado,
            empresa,
            senha,
            chave,
            chave_expiracao: chaveExpiracao
        };

        data[telefoneFormatado] = newUser;

        saveData(data);

        res.json({ success: true, message: 'Cadastro realizado com sucesso!' });
    } catch (error) {
        console.error('Erro no cadastro:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// 🔹 Rota para login
app.post('/login', (req, res) => {
    const { login, senha } = req.body;

    const data = loadData();

    const user = Object.values(data).find(user => user.usuario === login && user.senha === senha);

    if (!user) {
        return res.status(400).json({ success: false, message: 'Usuário ou senha inválidos' });
    }

    if (new Date() > new Date(user.chave_expiracao)) {
        return res.status(400).json({ success: false, message: 'Chave expirada' });
    }

    res.json({ success: true, message: 'Login realizado com sucesso!' });
});

// 🔹 Rota para gerar o QR Code sob demanda (via botão)
app.get('/generate-qr', (req, res) => {
    const telefone = req.query.telefone;
    const data = loadData();
    
    if (!data[telefone]) {
        return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    if (global.qrCodeUrl) {
        return res.json({ success: true, qr: global.qrCodeUrl });
    }

    client.on('qr', (qr) => {
        qrcode.toDataURL(qr, (err, url) => {
            if (err) {
                console.error("Erro ao converter QR Code:", err);
                return res.status(500).json({ success: false, message: "Erro ao gerar o QR Code." });
            }

            global.qrCodeUrl = url;
            return res.json({ success: true, qr: global.qrCodeUrl });
        });
    });

    client.initialize();
});

// 🔹 Rota para ativar/desativar o bot para um usuário específico
app.post('/toggle-bot', (req, res) => {
    const { telefone } = req.query;
    
    const data = loadData();
    
    if (!data[telefone]) {
        return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    const usuario = data[telefone];
    usuario.ativo = !usuario.ativo;

    saveData(data);

    res.json({
        success: true,
        message: usuario.ativo ? 'ativado' : 'desativado'
    });

    if (usuario.ativo) {
        iniciarBotParaUsuario(telefone);
    }
});

// Função para iniciar o bot para um usuário
function iniciarBotParaUsuario(telefone) {
    const usuario = loadData()[telefone];

    const client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: { headless: true },
    });

    client.on('message', async (message) => {
        console.log(`Mensagem recebida de ${message.from}: ${message.body}`);

        if (!message.from.includes('@g.us')) {
            const resposta = await getMistralResponse(message.body);
            await client.sendMessage(message.from, resposta);
        }
    });

    client.initialize().catch((error) => {
        console.error(`Erro ao inicializar o cliente para ${telefone}:`, error);
    });
}

// Função de resposta da IA Mistral
async function getMistralResponse(prompt) {
    return "Resposta da IA para: " + prompt;
}

client.initialize().catch(error => {
    console.error("❌ Erro ao inicializar o WhatsApp Web:", error);
});

server.listen(port, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});
