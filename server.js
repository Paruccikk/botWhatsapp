// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Importando as funções de login, cadastro, e bot
const { login, cadastrarUsuario } = require('./src/auth'); // Atualizar o caminho para 'src/auth'
const { interagirComBot } = require('./src/botService');  // Atualizar o caminho para 'src/botService'

const app = express();  // Inicializa o app aqui
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

// Serve os arquivos estáticos (como index.html, admin.html) da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Carregar dados dos usuários a partir do arquivo (exemplo em JSON)
const carregarUsuarios = () => {
    try {
        return JSON.parse(fs.readFileSync('usuarios.json', 'utf8'));
    } catch (error) {
        return {}; // Retorna um objeto vazio se o arquivo não existir
    }
};

// Função para carregar usuários do arquivo
const loadUsers = () => {
    try {
        return JSON.parse(fs.readFileSync('usuarios.json', 'utf8'));
    } catch (error) {
        console.error("Erro ao carregar os usuários:", error);
        return {};
    }
};


// Salvar dados dos usuários no arquivo JSON
const salvarUsuarios = (usuarios) => {
    fs.writeFileSync('usuarios.json', JSON.stringify(usuarios, null, 2));
};

// Rotas de login e cadastro
app.post("/login", login);
app.post("/cadastrar-usuario", cadastrarUsuario);

// Rota para interação com o bot
app.post("/interagir-bot", interagirComBot);

// Rota para obter a lista de usuários registrados
app.get("/get-usuarios", (req, res) => {
    const usuarios = carregarUsuarios();
    res.json(usuarios);
});

// Rota para cadastrar um novo usuário
app.post("/cadastrar-usuario", (req, res) => {
    const { numero, senha, empresa } = req.body;

    const usuarios = carregarUsuarios();
    if (usuarios[numero]) {
        return res.status(400).json({ error: "Usuário já existe!" });
    }

    const novaChave = gerarChaveAcesso(); // Gerar uma nova chave de acesso
    usuarios[numero] = {
        senha,
        empresa,
        accessKey: novaChave,
        expiresAt: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() // Chave expira em 7 dias
    };
    salvarUsuarios(usuarios);

    res.json({ message: "Usuário cadastrado com sucesso!" });
});

// Validação de chave de acesso
app.get('/validate-key', (req, res) => {
    const { accessKey, phoneNumber } = req.query;

    const users = loadUsers(); // Carrega os dados dos usuários do arquivo JSON
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
    const usuario = usuarios[numero];
    if (!usuario) {
        return res.status(404).json({ error: "Usuário não encontrado!" });
    }

    usuario.accessKey = gerarChaveAcesso(); // Gerar uma nova chave de acesso
    usuario.expiresAt = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // Nova data de expiração

    salvarUsuarios(usuarios);

    res.json({ message: "Chave de acesso renovada com sucesso!" });
});

// Função para gerar uma chave de acesso aleatória
const gerarChaveAcesso = () => {
    return Math.random().toString(36).substring(2, 15);
};

// Rota para ligar/desligar o bot
app.post('/ligar-bot', (req, res) => {
    // Lógica para ligar o bot
    res.json({ message: "Bot ligado com sucesso!" });
});

app.post('/desligar-bot', (req, res) => {
    // Lógica para desligar o bot
    res.json({ message: "Bot desligado com sucesso!" });
});

// Serve os arquivos estáticos (como index.html, admin.html)
app.use(express.static(__dirname));

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
