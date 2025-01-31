document.addEventListener("DOMContentLoaded", function () {
    const formCadastrar = document.getElementById("form-cadastrar");
    const formRenovar = document.getElementById("form-renovar");
    const listaUsuarios = document.getElementById("lista-usuarios");

    // Função para exibir todas as chaves cadastradas
    function carregarUsuarios() {
        // Altere a URL para apontar para o servidor backend correto
        fetch("http://localhost:3000/get-keys")  // Alterado para 3000
            .then(response => response.json())
            .then(keys => {
                listaUsuarios.innerHTML = "";
                Object.keys(keys).forEach(numero => {
                    const item = document.createElement("li");
                    item.textContent = `Número: ${numero} | Chave: ${keys[numero].accessKey} | Expira em: ${keys[numero].expiresAt}`;
                    listaUsuarios.appendChild(item);
                });
            })
            .catch(error => console.error("Erro ao carregar usuários:", error));
    }

    // Cadastro de novo usuário
    formCadastrar.addEventListener("submit", function (e) {
        e.preventDefault();
        const numero = document.getElementById("numero-cadastro").value;
        const chave = document.getElementById("chave-cadastro").value;

        // Envia os dados para o backend
        fetch("http://localhost:3000/cadastrar-usuario", {  // Alterado para 3000
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ numero, chave })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            carregarUsuarios();  // Atualiza a lista de usuários
        })
        .catch(error => console.error("Erro ao cadastrar usuário:", error));
    });

    // Renovar chave de acesso
    formRenovar.addEventListener("submit", function (e) {
        e.preventDefault();
        const numero = document.getElementById("numero-renovar").value;

        // Envia a solicitação para renovar a chave
        fetch("http://localhost:3000/renovar-chave", {  // Alterado para 3000
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ numero })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            carregarUsuarios();  // Atualiza a lista de usuários
        })
        .catch(error => console.error("Erro ao renovar chave:", error));
    });

    // Carregar usuários ao iniciar a página
    carregarUsuarios();
});
