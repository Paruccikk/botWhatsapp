document.addEventListener("DOMContentLoaded", function () {
    const activationForm = document.getElementById("activationForm");
    const toggleBotButton = document.getElementById("toggleBotButton");
    const qrCodeSection = document.getElementById("qrCodeSection");
    const qrCodeImage = document.getElementById("qrCodeImage");
    const empresaInfo = document.getElementById("empresaInfo");
    const expirationTime = document.getElementById("expirationTime");

    // Função para ativar o bot
    activationForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const accessKey = document.getElementById("accessKey").value;
        const phoneNumber = document.getElementById("phoneNumber").value;

        // Verifica a validade da chave de acesso
        const isKeyValid = await fetch(`/validate-key?accessKey=${accessKey}&phoneNumber=${phoneNumber}`)
            .then(res => res.json())
            .then(data => data.isValid);

        if (isKeyValid) {
            // Chave válida, agora exibe o QR code
            const response = await fetch('/generate-qr');
            const data = await response.json();

            // Exibe o QR Code na tela
            qrCodeSection.style.display = 'block';
            qrCodeImage.src = data.qrCodeUrl;

            // Mostrar informações da empresa e validade da chave
            const empresa = data.empresa;
            const expiresAt = new Date(data.expiresAt);
            const timeRemaining = formatTimeRemaining(expiresAt);

            empresaInfo.textContent = `Empresa: ${empresa}`;
            expirationTime.textContent = `Chave expira em: ${timeRemaining}`;
        } else {
            alert("Chave inválida ou expirada! Entre em contato com o administrador.");
        }
    });

    // Função para ligar/desligar o bot
    toggleBotButton.addEventListener("click", async function () {
        const phoneNumber = document.getElementById("phoneNumber").value;

        if (!phoneNumber) {
            alert("Digite seu número de telefone primeiro!");
            return;
        }

        const botStatus = await fetch(`/get-bot-status?phoneNumber=${phoneNumber}`)
            .then(res => res.json())
            .then(data => data.status);

        const action = botStatus === 'ativo' ? 'desligar-bot' : 'ligar-bot';

        // Envia a solicitação para o servidor para mudar o estado do bot
        const response = await fetch(`/toggle-bot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber })
        });

        if (response.ok) {
            const newStatus = action === 'desligar-bot' ? 'desligado' : 'ativo';
            toggleBotButton.style.backgroundColor = newStatus === 'ativo' ? 'green' : 'red';
            toggleBotButton.textContent = newStatus === 'ativo' ? 'Desligar Bot' : 'Ligar Bot';
        } else {
            alert("Erro ao atualizar o estado do bot. Tente novamente mais tarde.");
        }
    });

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
