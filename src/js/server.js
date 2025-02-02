const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const { Client, LocalAuth } = require('whatsapp-web.js'); // Autenticação local para evitar escaneamento contínuo do QR
const qrcode = require('qrcode');

const app = express();
const port = 3000;

// Middleware para parsear JSON
app.use(bodyParser.json());

// Serve arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, '../../public')));

// Serve a página inicial
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// Caminho para o arquivo de dados
const dataFilePath = path.join(__dirname, '../../data/data.json');

// Função para carregar dados de usuários
function loadData() {
    if (!fs.existsSync(dataFilePath)) return [];
    const rawData = fs.readFileSync(dataFilePath);
    return JSON.parse(rawData);
}

// Função para salvar os dados de usuários
function saveData(data) {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 4));
}

// 🔹 Rota para cadastro de usuário
app.post('/cadastro', (req, res) => {
    try {
        const { usuario, telefone, empresa, senha } = req.body;
        if (!usuario || !telefone || !empresa || !senha) {
            return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios' });
        }

        const data = loadData();
        if (data.find(user => user.usuario === usuario)) {
            return res.status(400).json({ success: false, message: 'Usuário já existe' });
        }

        const chave = Math.random().toString(36).substr(2, 10);
        const newUser = {
            usuario,
            telefone,
            empresa,
            senha,
            chave,
            chave_expiracao: new Date().setDate(new Date().getDate() + 30)
        };
        data.push(newUser);
        saveData(data);

        res.json({ success: true });
    } catch (error) {
        console.error('Erro no cadastro:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// 🔹 Rota para login
app.post('/login', (req, res) => {
    const { login, senha } = req.body;
    const data = loadData();
    const user = data.find(user => user.usuario === login && user.senha === senha);
    
    if (!user) {
        return res.status(400).json({ success: false, message: 'Usuário ou senha inválidos' });
    }

    if (new Date() > new Date(user.chave_expiracao)) {
        return res.status(400).json({ success: false, message: 'Chave expirada' });
    }

    res.json({ success: true });
});

// 🔹 Rota para validar chave de acesso
app.get('/validate-key', (req, res) => {
    const { accessKey } = req.query;
    const data = loadData();
    const user = data.find(user => user.chave === accessKey);
    
    if (!user) {
        return res.status(400).json({ success: false, message: 'Chave de acesso inválida' });
    }

    if (new Date() > new Date(user.chave_expiracao)) {
        return res.status(400).json({ success: false, message: 'Chave expirada' });
    }

    res.json({ success: true, telefone: user.telefone });
});

// 🔹 Rota para gerar o QR Code (via API)
app.get('/generate-qr', (req, res) => {
    if (global.qrCodeUrl) {
        res.json({ success: true, qr: global.qrCodeUrl });
    } else {
        res.json({ success: false, message: "QR Code não disponível no momento." });
    }
});

// 🔹 Configuração do servidor HTTP e WebSocket
const server = http.createServer(app);
const io = socketIo(server);

// 🔹 Inicialização do WhatsApp Web Client
const client = new Client({
    authStrategy: new LocalAuth(),  // Autenticação local para evitar escaneamentos repetidos
    puppeteer: { headless: true }
});

// 🔹 Evento para gerar e enviar o QR Code pelo WebSocket
client.on('qr', (qr) => {
    qrcode.toDataURL(qr, (err, url) => {
        if (err) {
            console.error("Erro ao converter QR Code:", err);
        } else {
            global.qrCodeUrl = url; // Armazena o QR Code globalmente
            io.emit('qr', url); // Envia para os clientes via WebSocket
            console.log("QR Code gerado e enviado para os clientes.");
        }
    });
});

// 🔹 Evento quando o WhatsApp Web estiver pronto
client.on('ready', () => {
    console.log("✅ Cliente WhatsApp Web conectado com sucesso!");
});

// 🔹 Evento para capturar mensagens recebidas
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

// 🔹 Inicializar o WhatsApp Web
client.initialize().catch(error => {
    console.error("❌ Erro ao inicializar o WhatsApp Web:", error);
});

// 🔹 Iniciar o servidor
server.listen(port, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});
