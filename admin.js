document.addEventListener("DOMContentLoaded", function () {
    const formCadastrar = document.getElementById("form-cadastrar");
    const formRenovar = document.getElementById("form-renovar");
    const listaUsuarios = document.getElementById("lista-usuarios");

    // Função para exibir todas as chaves cadastradas
    async function carregarUsuarios() {
        try {
            const response = await fetch("/get-usuarios"); // URL para carregar os usuários cadastrados

            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }

            const usuarios = await response.json();
            const tabelaUsuarios = document.getElementById("usersTable").getElementsByTagName("tbody")[0];

            tabelaUsuarios.innerHTML = ""; // Limpar tabela antes de adicionar os dados

            Object.keys(usuarios).forEach(numero => {
                const userData = usuarios[numero];
                const row = tabelaUsuarios.insertRow();

                row.insertCell(0).textContent = numero;
                row.insertCell(1).textContent = userData.empresa;
                row.insertCell(2).textContent = userData.accessKey;
                row.insertCell(3).textContent = formatarData(userData.expiresAt);
                row.insertCell(4).innerHTML = `
                    <button class="btn-renovar" onclick="renovarChave('${numero}')">🔄 Renovar</button>
                    <button class="btn-desligar-bot" onclick="desligarBot('${numero}')">⚡ Desligar Bot</button>
                `;
            });
        } catch (error) {
            console.error("Erro ao carregar usuários:", error);
            alert(error.message);
        }
    }

    // Formulário de cadastro de usuário
    formCadastrar.addEventListener("submit", async (e) => {
        e.preventDefault();
        const numero = document.getElementById("numero-cadastro").value;
        const senha = document.getElementById("senha-cadastro").value;
        const empresa = document.getElementById("empresa-cadastro").value;

        try {
            const response = await fetch("/cadastrar-usuario", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ numero, senha, empresa })
            });

            const data = await response.json();
            if (response.ok) {
                alert(`Usuário cadastrado com sucesso! Chave de Acesso: ${data.accessKey}`);
                carregarUsuarios(); // Atualizar a lista
            } else {
                alert("Erro ao cadastrar usuário: " + data.error);
            }
        } catch (error) {
            alert("Erro ao cadastrar usuário: " + error.message);
        }
    });

    // Renovar chave de acesso
    formRenovar.addEventListener("submit", function (e) {
        e.preventDefault();
        const numero = document.getElementById("numero-renovar").value;

        fetch("/renovar-chave", {
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

    // Função de formatação de data
    function formatarData(isoString) {
        if (!isoString) return "Data inválida";

        const data = new Date(isoString);
        const dia = String(data.getDate()).padStart(2, "0");
        const mes = String(data.getMonth() + 1).padStart(2, "0");
        const ano = data.getFullYear();

        return `${dia}-${mes}-${ano}`;
    }

    // Chamar a função ao carregar a página
    carregarUsuarios();
});
