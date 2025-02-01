const fs = require('fs');
const crypto = require('crypto');

// Função para salvar usuários no arquivo
const saveUsers = (users) => {
    fs.writeFileSync('usuarios.json', JSON.stringify(users, null, 2), 'utf8');
};

// Função para carregar usuários do arquivo
const loadUsers = () => {
    try {
        return JSON.parse(fs.readFileSync('usuarios.json', 'utf8'));
    } catch (error) {
        console.error("Erro ao carregar os usuários:", error);
        return {}; // Retorna um objeto vazio se houver erro
    }
};

// Função de login
const login = (req, res) => {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
        return res.status(400).json({ error: "Número de telefone e senha são obrigatórios." });
    }

    const users = loadUsers();

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

    const users = loadUsers();

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

    saveUsers(users);
    res.status(200).json({ message: "Usuário cadastrado com sucesso!", accessKey });
};

// Exporte as funções corretamente
module.exports = { login, cadastrarUsuario };
