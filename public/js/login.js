document.getElementById("login-form").addEventListener("submit", function (e) {
    e.preventDefault();

    const phoneNumber = document.getElementById("phoneNumber").value;
    const password = document.getElementById("password").value;

    fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, password })
    })
    .then(response => response.json())
    .then(data => alert(data.message))
    .catch(error => console.error("Erro:", error));
});
