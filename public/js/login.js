document.getElementById("login-form").addEventListener("submit", async function (event) {
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
        alert(data.message); // Exibe a mensagem de sucesso
        window.location.href = "/admin"; // Redireciona para o painel de admin após login bem-sucedido
    } else {
        const error = await response.json();
        alert(error.error); // Exibe o erro se o login falhar
    }
});
