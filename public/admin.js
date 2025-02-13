document.addEventListener("DOMContentLoaded", function () {
    const formCadastrar = document.getElementById("form-cadastrar");
    const tabelaUsuarios = document.getElementById("usersTable").getElementsByTagName("tbody")[0];

    async function carregarUsuarios() {
        try {
            const response = await fetch("/get-usuarios");
            if (!response.ok) throw new Error(`Erro ${response.status}: ${response.statusText}`);
            
            const usuarios = await response.json();
            tabelaUsuarios.innerHTML = "";
            
            Object.keys(usuarios).forEach(numero => {
                const userData = usuarios[numero];
                const row = tabelaUsuarios.insertRow();
                row.insertCell(0).textContent = numero;
                row.insertCell(1).textContent = userData.empresa;
                row.insertCell(2).textContent = userData.accessKey;
                row.insertCell(3).textContent = formatarData(userData.expiresAt);
                row.insertCell(4).innerHTML = `<button class="btn-renovar" onclick="renovarChave('${numero}')">🔄 Renovar</button>`;
            });
        } catch (error) {
            console.error("Erro ao carregar usuários:", error);
            alert(error.message);
        }
    }

    function formatarData(dataString) {
        const data = new Date(dataString);
        return data.toLocaleDateString("pt-BR");
    }

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
                carregarUsuarios();
            } else {
                alert("Erro ao cadastrar usuário: " + data.error);
            }
        } catch (error) {
            alert("Erro ao cadastrar usuário: " + error.message);
        }
    });

    window.renovarChave = async function(numero) {
        try {
            const response = await fetch(`/renovar-chave?numero=${numero}`, { method: "POST" });
            if (!response.ok) throw new Error("Erro ao renovar chave");
            alert("Chave renovada com sucesso!");
            carregarUsuarios();
        } catch (error) {
            alert("Erro ao renovar chave: " + error.message);
        }
    };

    carregarUsuarios();
});
