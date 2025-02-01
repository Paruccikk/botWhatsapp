const express = require('express');
const fs = require('fs');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const { obterRespostaIA } = require('./aiService'); // Importa IA
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

// 🟢 Login atualizado usando usuarios.json
app.post("/login", (req, res) => {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
        return res.status(400).json({ error: "Número de telefone e senha são obrigatórios." });
    }

    const users = loadUsers(); // Carrega os usuários do arquivo usuarios.json

    if (!users[phoneNumber]) {
        return res.status(401).json({ error: "Usuário não encontrado." });
    }

    if (users[phoneNumber].password !== password) {
        return res.status(401).json({ error: "Senha incorreta." });
    }

    res.json({ message: "Login bem-sucedido!", empresa: users[phoneNumber].empresa });
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

// Funções auxiliares para manipular keys.json
const loadKeys = () => {
    try {
        return JSON.parse(fs.readFileSync('keys.json', 'utf8'));
    } catch (error) {
        return {};
    }
};

const saveKeys = (keys) => {
    fs.writeFileSync('keys.json', JSON.stringify(keys, null, 2), 'utf8');
};

// Funções auxiliares para botStatus.json
const loadBotStatus = () => {
    try {
        return JSON.parse(fs.readFileSync('botStatus.json', 'utf8'));
    } catch (error) {
        return {};
    }
};

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

// Permite todas as origens
app.use(cors());

// Iniciando o servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
