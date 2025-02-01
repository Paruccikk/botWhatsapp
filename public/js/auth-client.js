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
