document.addEventListener("DOMContentLoaded", async function() {
    const activationForm = document.getElementById("activationForm");
    const toggleBotButton = document.getElementById("toggleBotButton");
    const qrCodeSection = document.getElementById("qrCodeSection");
    const qrCodeImage = document.getElementById("qrCodeImage");
    const empresaInfo = document.getElementById("empresaInfo");
    const expirationTime = document.getElementById("expirationTime");

    // Verifica se o usuário está logado
    const phoneNumber = localStorage.getItem("phoneNumber");

    if (!phoneNumber) {
        alert("Usuário não está logado.");
        window.location.href = "login.html"; // Redireciona para o login se não estiver logado
        return;
    }

    // Função para carregar informações do usuário
    const response = await fetch(`/usuario/${phoneNumber}`);
    const userData = await response.json();

    if (!response.ok) {
        alert("Erro ao carregar dados do usuário.");
        return;
    }

    // Exibe as informações da empresa e a validade da chave
    document.getElementById('empresaInfo').textContent = `Empresa: ${userData.empresa}`;
    updateActivationStatus(userData);

    // Função para ativar o bot
    activationForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const accessKey = document.getElementById("accessKey").value;
        const phoneNumber = document.getElementById("phoneNumber").value;

        // Valida a chave de acesso
        const isKeyValid = await validateAccessKey(accessKey, phoneNumber);

        if (isKeyValid) {
            // Chave válida, agora exibe o QR code
            const qrResponse = await fetch('https://botwhatsapp-oxct.onrender.com/generate-qr');
            const qrData = await qrResponse.json();

            if (qrResponse.ok) {
                qrCodeSection.style.display = 'block';
                qrCodeImage.src = qrData.qrCodeUrl;

                // Mostrar tempo restante e empresa
                const empresa = qrData.empresa;
                const expiresAt = new Date(qrData.expiresAt);
                const timeRemaining = formatTimeRemaining(expiresAt);

                empresaInfo.textContent = `Empresa: ${empresa}`;
                expirationTime.textContent = `Chave expira em: ${timeRemaining}`;
            } else {
                alert("Erro ao gerar QR Code. Tente novamente.");
            }
        } else {
            alert("Chave inválida ou expirada! Entre em contato com o administrador.");
        }
    });

    // Função para alternar o estado do bot (ligar/desligar)
    toggleBotButton.addEventListener("click", async function() {
        const botStatus = await getBotStatus(phoneNumber);

        const action = botStatus === 'ativo' ? 'desligar-bot' : 'ligar-bot';

        const response = await fetch(`https://botwhatsapp-oxct.onrender.com/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ numero: phoneNumber })
        });

        if (response.ok) {
            const newStatus = action === 'desligar-bot' ? 'desligado' : 'ativo';
            toggleBotButton.style.backgroundColor = newStatus === 'ativo' ? 'green' : 'red';
            toggleBotButton.textContent = newStatus === 'ativo' ? 'Desligar Bot' : 'Ligar Bot';
        } else {
            alert("Erro ao atualizar o estado do bot. Tente novamente mais tarde.");
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

    // Função para atualizar o status de ativação
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

    // Função para formatar o tempo restante até a expiração
    function formatTimeRemaining(expiresAt) {
        const now = new Date();
        const diff = expiresAt - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return `${days} dias, ${hours} horas, ${minutes} minutos`;
    }
});
