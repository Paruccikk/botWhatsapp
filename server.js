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
        return {};
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

// Função para exibir mensagens abaixo dos botões
function showMessage(elementId, message, type) {
    const messageElement = document.getElementById(elementId);
    messageElement.textContent = message;
    messageElement.className = 'message'; // Remove qualquer classe anterior
    messageElement.classList.add(type); // Adiciona 'success' ou 'error'
}

// Manipula o envio do formulário de cadastro
document.getElementById("registration-form")?.addEventListener("submit", async function(event) {
    event.preventDefault();
    const phoneNumber = document.getElementById("newPhoneNumber").value;
    const password = document.getElementById("newPassword").value;

    const response = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, password })
    });

    if (response.ok) {
        const data = await response.json();
        showMessage("registration-message", data.message, 'success'); // Exibe mensagem de sucesso
    } else {
        const error = await response.json();
        showMessage("registration-message", error.error, 'error'); // Exibe mensagem de erro
    }
});

// Manipula a ativação do bot
document.getElementById("activationForm")?.addEventListener("submit", async function(event) {
    event.preventDefault();
    const accessKey = document.getElementById('accessKey').value;
    const phoneNumber = document.getElementById('phoneNumber').value;

    const isKeyValid = await fetch(`/validate-key?accessKey=${accessKey}&phoneNumber=${phoneNumber}`)
        .then(res => res.json())
        .then(data => data.isValid);

    if (isKeyValid) {
        const response = await fetch('/generate-qr');
        const data = await response.json();

        if (data.qrCodeUrl) {
            document.getElementById('qrCodeSection').style.display = 'block';
            document.getElementById('qrCodeImage').src = data.qrCodeUrl;
            showMessage("activation-message", "Bot ativado com sucesso!", 'success'); // Exibe mensagem de sucesso
        } else {
            showMessage("activation-message", "QR Code ainda não gerado. Tente novamente mais tarde.", 'error'); // Exibe mensagem de erro
        }
    } else {
        showMessage("activation-message", "Chave inválida ou expirada!", 'error'); // Exibe mensagem de erro
    }
});

// Rotas de login e cadastro
app.post("/login", login);
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
