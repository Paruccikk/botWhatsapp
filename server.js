const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const { Client, LocalAuth } = require('whatsapp-web.js'); // Autenticação local para evitar escaneamento contínuo do QR
const qrcode = require('qrcode');

const app = express();
const port = process.env.PORT || 3000;

// Inicializa o cliente do WhatsApp Web
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true }
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
    const { telefone } = req.body;  // Número de telefone

    try {
        const data = loadData();

        // Verifica se o usuário existe
        const usuario = data[telefone];

        if (!usuario) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Adiciona 30 dias à data de expiração da chave
        const dataAtual = new Date();
        const novaDataExpiracao = new Date(dataAtual.setDate(dataAtual.getDate() + 30));

        // Atualiza a chave de expiração
        usuario.chave_expiracao = novaDataExpiracao.getTime();  // Salva como timestamp

        // Salva os dados atualizados no arquivo
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

        // Verifica se todos os campos obrigatórios estão presentes
        if (!usuario || !telefone || !empresa || !senha) {
            return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios' });
        }

        // Valida o formato do telefone (deve ter 11 dígitos numéricos)
        const telefoneFormatado = telefone.replace(/[^\d]/g, '');
        if (telefoneFormatado.length !== 11) {
            return res.status(400).json({ success: false, message: 'Telefone inválido. Certifique-se de incluir 11 dígitos.' });
        }

        // Carregar dados de usuários do arquivo JSON
        const data = loadData();

        // Verifica se o telefone já está cadastrado
        if (data[telefoneFormatado]) {
            return res.status(400).json({ success: false, message: 'Telefone já cadastrado' });
        }

        // Gera a chave de acesso
        const chave = Math.random().toString(36).substr(2, 10);
        const chaveExpiracao = new Date().setDate(new Date().getDate() + 30); // Chave expira em 30 dias

        // Cria um novo usuário
        const newUser = {
            usuario,
            telefone: telefoneFormatado,
            empresa,
            senha, // Adiciona a senha
            chave,
            chave_expiracao: chaveExpiracao
        };

        // Adiciona o novo usuário no objeto de dados
        data[telefoneFormatado] = newUser;

        // Salva os dados de volta no arquivo JSON
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

    // Carregar os dados dos usuários
    const data = loadData();

    // Verifica se o usuário existe e a senha está correta
    const user = Object.values(data).find(user => user.usuario === login && user.senha === senha);

    // Se o usuário não for encontrado ou a senha estiver errada
    if (!user) {
        return res.status(400).json({ success: false, message: 'Usuário ou senha inválidos' });
    }

    // Verifica se a chave de acesso expirou
    if (new Date() > new Date(user.chave_expiracao)) {
        return res.status(400).json({ success: false, message: 'Chave expirada' });
    }

    // Login bem-sucedido
    res.json({ success: true, message: 'Login realizado com sucesso!' });
});

// 🔹 Rota para validar chave de acesso
app.get('/validate-key', (req, res) => {
    const chave = req.query.chave;  // Aqui estamos pegando o valor da chave na URL

    // Carregar o arquivo JSON
    fs.readFile('data/data.json', 'utf8', (err, data) => {
        if (err) {
            console.error("Erro ao ler o arquivo:", err);
            return res.status(500).json({ success: false, message: "Erro no servidor." });
        }

        const usuarios = JSON.parse(data);  // Parseia o conteúdo do arquivo JSON
        let chaveValida = false;

        // Verificar se a chave existe no arquivo JSON
        for (let usuario in usuarios) {
            if (usuarios[usuario].chave === chave) {
                chaveValida = true;
                break; // Se encontrar a chave, não precisa continuar verificando
            }
        }

        if (chaveValida) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Chave inválida' });
        }
    });
});

// 🔹 Rota para gerar o QR Code sob demanda (via botão)
app.get('/generate-qr', (req, res) => {
    // Caso o QR Code já tenha sido gerado anteriormente
    if (global.qrCodeUrl) {
        return res.json({ success: true, qr: global.qrCodeUrl });
    }

    // Se o QR Code ainda não foi gerado, aguardamos o evento 'qr' para gerar
    client.on('qr', (qr) => {
        qrcode.toDataURL(qr, (err, url) => {
            if (err) {
                console.error("Erro ao converter QR Code:", err);
                return res.status(500).json({ success: false, message: "Erro ao gerar o QR Code." });
            }

            global.qrCodeUrl = url;  // Armazenamos o QR Code gerado
            return res.json({ success: true, qr: global.qrCodeUrl });  // Retorna o QR Code gerado
        });
    });

    // Caso o QR Code ainda não tenha sido gerado e não tenha ocorrido o evento `qr`
    // Não enviaremos a resposta até o evento ser disparado.
});

// 🔹 Evento para gerar e enviar o QR Code pelo WebSocket
client.on('qr', (qr) => {
    qrcode.toDataURL(qr, (err, url) => {
        if (err) {
            console.error("Erro ao converter QR Code:", err);
        } else {
            global.qrCodeUrl = url;
            io.emit('qr', url);  // Envia o QR Code para o cliente via WebSocket (se necessário)
            console.log("QR Code gerado e enviado para os clientes.");
        }
    });
});

client.on('ready', () => {
    console.log("✅ Cliente WhatsApp Web conectado com sucesso!");
});

client.on('message', async (message) => {
    console.log(`📩 Mensagem de ${message.from}: ${message.body}`);
    if (!message.from.includes("@g.us")) {
        try {
            await client.sendMessage(message.from, "Recebemos sua mensagem!");
            console.log(`✅ Resposta enviada para ${message.from}`);
        } catch (error) {
            console.error("❌ Erro ao responder mensagem:", error);
        }
    }
});

client.initialize().catch(error => {
    console.error("❌ Erro ao inicializar o WhatsApp Web:", error);
});

server.listen(port, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});
