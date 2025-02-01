document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const phoneNumber = document.getElementById('phoneNumber').value;
    const password = document.getElementById('password').value;

    const loginData = {
        phoneNumber,
        password
    };

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
            // Redirecionar ou fazer algo com o resultado
            window.location.href = "/index.html"; // Ao invés de "/admin"
        } else {
            alert(result.error);  // Se houver erro, mostrar a mensagem
        }
    } catch (error) {
        console.error("Erro de login:", error);
        alert("Ocorreu um erro ao tentar fazer login.");
    }
});

// Função para exibir mensagem abaixo do botão
function showMessage(elementId, message, type) {
    const messageElement = document.getElementById(elementId);
    messageElement.textContent = message;
    messageElement.className = 'message'; // Remove qualquer classe anterior
    messageElement.classList.add(type); // Adiciona 'success' ou 'error'
}

document.getElementById("login-form").addEventListener("submit", async function(event) {
    event.preventDefault();
    const phoneNumber = document.getElementById("phoneNumber").value;
    const password = document.getElementById("password").value;

    const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, password })
    });

    if (response.ok) {
        const data = await response.json();
        showMessage("login-message", data.message, 'success'); // Exibe mensagem de sucesso
        window.location.href = "/admin"; // Redireciona para a página de admin
    } else {
        const error = await response.json();
        showMessage("login-message", error.error, 'error'); // Exibe mensagem de erro
    }
});
