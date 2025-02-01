document.addEventListener("DOMContentLoaded", async function() {
    // Função de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const phoneNumber = document.getElementById('phoneNumber').value;
            const password = document.getElementById('password').value;

            const loginData = { phoneNumber, password };

            try {
                const response = await fetch('https://botwhatsapp-oxct.onrender.com/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(loginData)
                });

                const result = await response.json();

                if (response.ok) {
                    alert(result.message);  // Login bem-sucedido
                    localStorage.setItem("phoneNumber", phoneNumber); // Salva o número do telefone
                    window.location.href = "index.html"; // Redireciona para a página principal
                } else {
                    alert(result.error);  // Se houver erro, mostrar a mensagem
                }
            } catch (error) {
                console.error("Erro de login:", error);
                alert("Ocorreu um erro ao tentar fazer login.");
            }
        });
    }

    // Lógica de exibição de dados do usuário após login
    const phoneNumber = localStorage.getItem("phoneNumber");

    if (!phoneNumber) {
        alert("Usuário não está logado.");
        window.location.href = "login.html"; // Redireciona para o login se não estiver logado
        return;
    }

    try {
        const response = await fetch(`https://botwhatsapp-oxct.onrender.com/usuario/${phoneNumber}`);
        
        if (!response.ok) {
            throw new Error("Erro ao carregar dados do usuário: " + response.statusText);
        }

        const userData = await response.json();

        document.getElementById('empresaName').textContent = userData.empresa;
        updateActivationStatus(userData);

        // Função para ativar o bot e gerar o QR code
        document.getElementById('activationForm').addEventListener('submit', async function(event) {
            event.preventDefault();

            const accessKey = document.getElementById('accessKey').value;
            const phoneNumber = document.getElementById('phoneNumber').value;

            const isKeyValid = await validateAccessKey(accessKey, phoneNumber);

            if (isKeyValid) {
                const qrResponse = await fetch('https://botwhatsapp-oxct.onrender.com/generate-qr');
                const qrData = await qrResponse.json();
                document.getElementById('qrCodeSection').style.display = 'block';
                document.getElementById('qrCodeImage').src = qrData.qrCodeUrl;
            } else {
                alert("Chave inválida ou expirada! Entre em contato com o administrador.");
            }
        });

        // Alternar o estado do bot (ligar/desligar)
        document.getElementById('toggleBotButton').addEventListener('click', async function() {
            const botStatus = await getBotStatus(phoneNumber);

            const action = botStatus === 'ativo' ? 'desligar-bot' : 'ligar-bot';

            const response = await fetch(`https://botwhatsapp-oxct.onrender.com/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ numero: phoneNumber })
            });

            if (response.ok) {
                const newStatus = action === 'desligar-bot' ? 'desligado' : 'ativo';
                document.getElementById('toggleBotButton').style.backgroundColor = newStatus === 'ativo' ? 'green' : 'red';
                document.getElementById('toggleBotButton').textContent = newStatus === 'ativo' ? 'Desligar Bot' : 'Ligar Bot';
            } else {
                alert("Erro ao atualizar o estado do bot. Tente novamente mais tarde.");
            }
        });
    } catch (error) {
        console.error("Erro ao obter dados do usuário:", error);
        alert("Ocorreu um erro ao carregar os dados do usuário. " + error.message);
    }
});

// Função para validar a chave de acesso
async function validateAccessKey(accessKey, phoneNumber) {
    const response = await fetch(`/validate-key?accessKey=${accessKey}&phoneNumber=${phoneNumber}`);
    const data = await response.json();
    return data.isValid;
}

// Função para obter o status do bot
async function getBotStatus(phoneNumber) {
    const response = await fetch(`https://botwhatsapp-oxct.onrender.com/get-bot-status?phoneNumber=${phoneNumber}`);
    const data = await response.json();
    return data.status;
}

// Função para atualizar o status de ativação (incluindo a expiração da chave)
function updateActivationStatus(userData) {
    const expirationTime = new Date(userData.keyExpiration);
    const now = new Date();
    const timeDiff = expirationTime - now;

    if (timeDiff <= 0) {
        document.getElementById('activationStatus').textContent = "Chave expirada!";
        document.getElementById('expirationTime').textContent = "A chave expirou, você precisa renová-la.";
    } else {
        const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
        document.getElementById('activationStatus').textContent = "Chave ativa!";
        document.getElementById('expirationTime').textContent = `Tempo restante: ${daysRemaining} dias`;
    }
}
