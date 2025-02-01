const express = require("express");
const { loadUsers, saveUsers } = require("./db");
const { obterRespostaIA } = require("./aiService");
const crypto = require("crypto");

const router = express.Router();

// 🟢 Cadastro de usuário
router.post("/cadastrar-usuario", (req, res) => {
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

    // Salvar usuário
    users[numero] = { password: senha, accessKey, expiresAt: expiresAt.toISOString(), empresa };
    saveUsers(users);

    res.status(200).json({ message: "Usuário cadastrado com sucesso!", accessKey });
});

// 🟢 Login de usuário
router.post("/login", (req, res) => {
    const { phoneNumber, password } = req.body;
    const users = loadUsers();

    if (!users[phoneNumber]) return res.status(401).json({ error: "Usuário não encontrado." });
    if (users[phoneNumber].password !== password) return res.status(401).json({ error: "Senha incorreta." });

    res.json({ message: "Login bem-sucedido!", empresa: users[phoneNumber].empresa });
});

// 🟢 Listar usuários cadastrados
router.get("/get-usuarios", (req, res) => {
    res.json(loadUsers());
});

// 🟢 IA - Processamento de mensagens do bot
router.post("/ia", async (req, res) => {
    const { mensagem } = req.body;
    const resposta = await obterRespostaIA(mensagem);
    res.json({ resposta });
});

module.exports = router;
