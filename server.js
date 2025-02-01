const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// Função para carregar usuários do arquivo
const carregarUsuarios = () => {
    try {
        return JSON.parse(fs.readFileSync('usuarios.json', 'utf8'));
    } catch (error) {
        console.error("Erro ao carregar os usuários:", error);
        return {}; // Retorna um objeto vazio caso haja erro ao carregar
    }
};

// Função para salvar usuários no arquivo
const salvarUsuarios = (users) => {
    fs.writeFileSync('usuarios.json', JSON.stringify(users, null, 2), 'utf8');
};

// Função de login
const login = (req, res) => {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
        return res.status(400).json({ error: "Número de telefone e senha são obrigatórios." });
    }

    const users = carregarUsuarios();

    if (!users[phoneNumber]) {
        return res.status(401).json({ error: "Usuário não encontrado." });
    }

    if (users[phoneNumber].password !== password) {
        return res.status(401).json({ error: "Senha incorreta." });
    }

    res.json({ message: "Login bem-sucedido!", empresa: users[phoneNumber].empresa });
};

// Função de cadastro de novo usuário
const cadastrarUsuario = (req, res) => {
    const { numero, senha, empresa } = req.body;

    if (!numero || !senha || !empresa) {
        return res.status(400).json({ error: "Número, senha e empresa são obrigatórios." });
    }

    const users = carregarUsuarios();

    if (users[numero]) {
        return res.status(400).json({ error: "Número já cadastrado." });
    }

    const accessKey = crypto.randomBytes(16).toString("hex");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    users[numero] = {
        password: senha,
        accessKey,
        expiresAt: expiresAt.toISOString(),
        empresa
    };

    salvarUsuarios(users);
    res.status(200).json({ message: "Usuário cadastrado com sucesso!", accessKey });
};

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

// Rota de login
app.post("/login", login);

// Rota para cadastro de novo usuário
app.post("/cadastrar-usuario", cadastrarUsuario);

// Rota para interação com o bot
app.post("/interagir-bot", (req, res) => {
    // Exemplo simples de interação com o bot
    res.json({ message: "Bot interagindo com sucesso!" });
});

// Rota para obter a lista de usuários registrados
app.get("/get-usuarios", (req, res) => {
    const usuarios = carregarUsuarios();
    res.json(usuarios);
});

// Validação de chave de acesso
app.get('/validate-key', (req, res) => {
    const { accessKey, phoneNumber } = req.query;

    if (!accessKey || !phoneNumber) {
        return res.status(400).json({ isValid: false, error: 'Parâmetros ausentes (accessKey ou phoneNumber)' });
    }

    const users = carregarUsuarios();
    const user = users[phoneNumber];

    if (!user || user.accessKey !== accessKey || new Date(user.expiresAt) < new Date()) {
        return res.status(400).json({ isValid: false, error: 'Chave inválida ou expirada' });
    }

    res.json({ isValid: true });
});

// Função para renovar a chave de acesso
app.post("/renovar-chave", (req, res) => {
    const { numero } = req.body;
    const usuarios = carregarUsuarios();

    if (!usuarios[numero]) {
        return res.status(404).json({ error: "Usuário não encontrado!" });
    }

    usuarios[numero].accessKey = gerarChaveAcesso();
    usuarios[numero].expiresAt = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    salvarUsuarios(usuarios);

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
