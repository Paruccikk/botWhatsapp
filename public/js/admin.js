document.addEventListener("DOMContentLoaded", function () {
    const formCadastrar = document.getElementById("form-cadastrar");
    const tabelaUsuarios = document.getElementById("usersTable").getElementsByTagName("tbody")[0];

    async function carregarUsuarios() {
        try {
            const response = await fetch("/get-usuarios");
            if (!response.ok) throw new Error(`Erro ${response.status}: ${response.statusText}`);
            
            const usuarios = await response.json();
            tabelaUsuarios.innerHTML = "";
            
            usuarios.forEach(userData => {
                const row = tabelaUsuarios.insertRow();
                row.insertCell(0).textContent = userData.telefone;  // Alterado para telefone
                row.insertCell(1).textContent = userData.empresa;
                row.insertCell(2).textContent = userData.chave;
                row.insertCell(3).textContent = formatarData(userData.chave_expiracao);
                row.insertCell(4).innerHTML = `<button class="btn-renovar" onclick="renovarChave('${userData.telefone}')">🔄 Renovar</button>`; // Alterado para telefone
            });
        } catch (error) {
            console.error("Erro ao carregar usuários:", error);
            alert(error.message);
        }
    }

    function formatarData(dataString) {
        const data = new Date(Number(dataString)); // Certifique-se de que é um número
        if (isNaN(data)) {
            return "Data inválida";
        }
        return data.toLocaleDateString("pt-BR"); // Formata a data como 'dd/mm/aaaa'
    }

    formCadastrar.addEventListener("submit", async (e) => {
        e.preventDefault();
        const telefone = document.getElementById("telefone-cadastro").value;  // Alterado para telefone
        const senha = document.getElementById("senha-cadastro").value;
        const empresa = document.getElementById("empresa-cadastro").value;

        try {
            const response = await fetch("/cadastrar-usuario", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ telefone, senha, empresa })  // Alterado para telefone
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

    window.renovarChave = async function(telefone) {  // Alterado para telefone
        try {
            const response = await fetch(`/renovar-chave?numero=${telefone}`, { method: "POST" });  // Alterado para telefone
            if (!response.ok) throw new Error("Erro ao renovar chave");
            alert("Chave renovada com sucesso!");
            carregarUsuarios();
        } catch (error) {
            alert("Erro ao renovar chave: " + error.message);
        }
    };

    carregarUsuarios();
});
