document.addEventListener("DOMContentLoaded", async function() {
    // Recupera o número de telefone do localStorage
    const phoneNumber = localStorage.getItem("phoneNumber");

    // Se não encontrar o número de telefone no localStorage, redireciona para a página de login
    if (!phoneNumber) {
        alert("Usuário não está logado.");
        window.location.href = "login.html"; // Redireciona para o login se não estiver logado
        return;
    }

    try {
        // Faz a requisição para obter os dados do usuário logado
        const response = await fetch(`/usuario/${phoneNumber}`);
        const userData = await response.json();

        if (!response.ok) {
            alert("Erro ao carregar dados do usuário.");
            return;
        }

        // Exibe as informações da empresa e a validade da chave
        document.getElementById('empresaName').textContent = userData.empresa;
        updateActivationStatus(userData);

        // Função para ativar o bot e gerar o QR code
        document.getElementById('activationForm').addEventListener('submit', async function(event) {
            event.preventDefault();

            const accessKey = document.getElementById('accessKey').value;
            const phoneNumber = document.getElementById('phoneNumber').value;

            const isKeyValid = await validateAccessKey(accessKey, phoneNumber);

            if (isKeyValid) {
                // Chave válida, agora exibe o QR code
                const qrResponse = await fetch('https://botwhatsapp-oxct.onrender.com/generate-qr');
                const qrData = await qrResponse.json();

                document.getElementById('qrCodeSection').style.display = 'block';
                document.getElementById('qrCodeImage').src = qrData.qrCodeUrl;
            } else {
                alert("Chave inválida ou expirada! Entre em contato com o administrador.");
            }
        });

        // Função para alternar o status do bot (ligar/desligar)
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
        alert("Ocorreu um erro ao carregar os dados do usuário.");
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
