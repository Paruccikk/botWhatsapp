document.getElementById("cadastro-form").addEventListener("submit", function (e) {
    e.preventDefault();

    const numero = document.getElementById("numero").value;
    const senha = document.getElementById("senha").value;
    const empresa = document.getElementById("empresa").value;

    fetch("/api/cadastrar-usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero, senha, empresa })
    })
    .then(response => response.json())
    .then(data => alert(data.message))
    .catch(error => console.error("Erro:", error));
});
