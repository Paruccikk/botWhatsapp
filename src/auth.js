const fs = require('fs');
const crypto = require('crypto');

// Função para carregar usuários do arquivo
const loadUsers = () => {
    try {
        return JSON.parse(fs.readFileSync('usuarios.json', 'utf8'));
    } catch (error) {
        return {}; // Retorna um objeto vazio se houver erro
    }
};

// Função para salvar usuários no arquivo
const saveUsers = (users) => {
    fs.writeFileSync('usuarios.json', JSON.stringify(users, null, 2), 'utf8');
};

// Função de login
const login = (req, res) => {
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
};


// Função para exibir mensagem abaixo do botão
function showMessage(elementId, message, type) {
    const messageElement = document.getElementById(elementId);
    messageElement.textContent = message;
    messageElement.className = 'message'; // Remove qualquer classe anterior
    messageElement.classList.add(type); // Adiciona 'success' ou 'error'
}

document.getElementById("registration-form").addEventListener("submit", async function(event) {
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

module.exports = { login, cadastrarUsuario };

// Função para exibir mensagem abaixo do botão
function showMessage(elementId, message, type) {
    const messageElement = document.getElementById(elementId);
    messageElement.textContent = message;
    messageElement.className = 'message'; // Remove qualquer classe anterior
    messageElement.classList.add(type); // Adiciona 'success' ou 'error'
}

document.getElementById("activationForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    const accessKey = document.getElementById('accessKey').value;
    const phoneNumber = document.getElementById('phoneNumber').value;

    const isKeyValid = await fetch(`https://botwhatsapp-oxct.onrender.com/validate-key?accessKey=${accessKey}&phoneNumber=${phoneNumber}`)
        .then(res => res.json())
        .then(data => data.isValid);

    if (isKeyValid) {
        const response = await fetch('https://botwhatsapp-oxct.onrender.com/generate-qr');
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

// Verifique se está no navegador antes de acessar o DOM
if (typeof document !== 'undefined') {
    // Código que manipula o DOM
    document.getElementById("formulário-de-registro").addEventListener("submit", async (evento) => {
        evento.preventDefault();
        // Lógica de envio do formulário
    });
}

