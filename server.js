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

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const dataFilePath = path.join(__dirname, 'data', 'data.json');

function loadData() {
    if (!fs.existsSync(dataFilePath)) return [];
    const rawData = fs.readFileSync(dataFilePath);
    return JSON.parse(rawData);
}

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
    const { numero } = req.body;
    let data = loadData();
    const userIndex = data.findIndex(user => user.telefone === numero);

    if (userIndex === -1) {
        return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    data[userIndex].chave_expiracao = new Date().setDate(new Date().getDate() + 30);
    saveData(data);
    
    res.json({ success: true, message: 'Chave renovada com sucesso!' });
});

// 🔹 Rota para cadastrar usuário
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
    const { chave } = req.query;
    const data = loadData();
    const user = data.find(user => user.chave === chave);
    
    if (!user) {
        return res.status(400).json({ success: false, message: 'Chave de acesso inválida' });
    }

    if (new Date() > new Date(user.chave_expiracao)) {
        return res.status(400).json({ success: false, message: 'Chave expirada' });
    }

    res.json({ success: true, telefone: user.telefone });
});

// 🔹 Rota para gerar o QR Code sob demanda (via botão)
app.get('/generate-qr', (req, res) => {
    if (global.qrCodeUrl) {
        return res.json({ success: true, qr: global.qrCodeUrl });
    }

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

    // Caso o WhatsApp Web ainda não tenha gerado um QR Code
    res.json({ success: false, message: "QR Code ainda não gerado." });
});


// 🔹 Configuração do servidor HTTP e WebSocket
const server = http.createServer(app);
const io = socketIo(server);

// 🔹 Inicialização do WhatsApp Web Client
const client = new Client({
    authStrategy: new LocalAuth(),  
    puppeteer: { headless: true }
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
