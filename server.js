const express = require('express');
const fs = require('fs');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

// Função para carregar usuários do arquivo usuarios.json
const loadUsers = () => {
    try {
        return JSON.parse(fs.readFileSync('usuarios.json', 'utf8'));
    } catch (error) {
        return {};
    }
};

// Função para salvar usuários no arquivo usuarios.json
const saveUsers = (users) => {
    fs.writeFileSync('usuarios.json', JSON.stringify(users, null, 2), 'utf8');
};

// Função para carregar chaves
const loadKeys = () => {
    try {
        return JSON.parse(fs.readFileSync('keys.json', 'utf8'));
    } catch (error) {
        return {};
    }
};

// Função para salvar chaves
const saveKeys = (keys) => {
    fs.writeFileSync('keys.json', JSON.stringify(keys, null, 2), 'utf8');
};

// Função para carregar botStatus
const loadBotStatus = () => {
    try {
        return JSON.parse(fs.readFileSync('botStatus.json', 'utf8'));
    } catch (error) {
        return {};
    }
};

// Função para salvar botStatus
const saveBotStatus = (status) => {
    fs.writeFileSync('botStatus.json', JSON.stringify(status, null, 2), 'utf8');
};

// Rota para gerar o QR Code (exemplo)
app.get('/generate-qr', (req, res) => {
    // Aqui você pode gerar o QR Code real usando alguma biblioteca
    res.json({ qrCodeUrl: 'https://example.com/qrcode.png' });
});

// Rota para obter a lista de usuários cadastrados
app.get("/get-usuarios", (req, res) => {
    const users = loadUsers();
    res.json(users);
});

// Cadastro de novo usuário
app.post("/cadastrar-usuario", (req, res) => {
    const { numero, senha, empresa } = req.body;

    if (!numero || !senha || !empresa) {
        return res.status(400).json({ error: "Número, senha e empresa são obrigatórios." });
    }

    const users = loadUsers();

    if (users[numero]) {
        return res.status(400).json({ error: "Número já cadastrado." });
    }

    // Gerar uma chave de acesso única
    const accessKey = crypto.randomBytes(16).toString("hex");

    // Definir expiração para 30 dias
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Adicionar usuário ao banco de dados (usuarios.json)
    users[numero] = {
        password: senha,
        accessKey,
        expiresAt: expiresAt.toISOString(),
        empresa
    };

    saveUsers(users);
    res.status(200).json({ message: "Usuário cadastrado com sucesso!", accessKey });
});

// Serve todos os arquivos estáticos
app.use(express.static(__dirname));

// Rota para admin.html
app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "admin.html"));
});

// Rota principal servindo index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Iniciando o servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
