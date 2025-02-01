const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Importações corrigidas
const { login, cadastrarUsuario } = require('./src/auth');  // Verifique se o caminho está correto 
const { interagirComBot } = require('./src/botService');  
const client = require('./src/whatsappClient');  // Importando o WhatsApp Client

const app = express();  
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// Serve arquivos estáticos (como index.html, admin.html) da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Função auxiliar para gerar chave de acesso
const gerarChaveAcesso = () => Math.random().toString(36).substring(2, 15);

// Rota para gerar o QR Code
app.get('/generate-qr', (req, res) => {
    if (global.qrCodeUrl) {
        res.json({ qrCodeUrl: global.qrCodeUrl });  // Retorna a URL do QR Code gerado
    } else {
        res.status(404).json({ error: "QR Code não gerado ainda." });  // Retorna erro se o QR Code ainda não foi gerado
    }
});

// Rotas de login e cadastro
app.post("/login", login);
app.post("/cadastrar-usuario", cadastrarUsuario);

// Rota para interação com o bot
app.post("/interagir-bot", interagirComBot);

// Rota para obter a lista de usuários registrados
app.get("/get-usuarios", (req, res) => {
    const usuarios = carregarUsuarios(); // Se você não está usando fs diretamente aqui, considere revisar a função carregarUsuarios()
    res.json(usuarios);
});

// Validação de chave de acesso
app.get('/validate-key', (req, res) => {
    const { accessKey, phoneNumber } = req.query;

    const users = carregarUsuarios(); // Aqui também, se você estiver manipulando arquivos, considere uma alternativa sem fs
    const user = users[phoneNumber];

    if (!user || user.accessKey !== accessKey || new Date(user.expiresAt) < new Date()) {
        return res.status(400).json({ isValid: false, error: 'Chave inválida ou expirada' });
    }

    res.json({ isValid: true });
});

// Função para renovar a chave de acesso
app.post("/renovar-chave", (req, res) => {
    const { numero } = req.body;
    const usuarios = carregarUsuarios(); // Idem, revisar se usa fs aqui

    if (!usuarios[numero]) {
        return res.status(404).json({ error: "Usuário não encontrado!" });
    }

    usuarios[numero].accessKey = gerarChaveAcesso();
    usuarios[numero].expiresAt = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Considerar uma solução para salvar os dados sem fs (ou movê-lo para um banco de dados)
    res.json({ message: "Chave de acesso renovada com sucesso!" });
});

// Rota para ligar/desligar o bot
app.post('/ligar-bot', (req, res) => {
    res.json({ message: "Bot ligado com sucesso!" });
});

app.post('/desligar-bot', (req, res) => {
    res.json({ message: "Bot desligado com sucesso!" });
});

// Rota para admin.html
app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "public/admin.html"));
});

// Rota principal para index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

// Iniciando o servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
