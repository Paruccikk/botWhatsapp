document.addEventListener("DOMContentLoaded", function () {
    const formCadastrar = document.getElementById("form-cadastrar");
    const formRenovar = document.getElementById("form-renovar");
    const listaUsuarios = document.getElementById("lista-usuarios");

    // Função para exibir todas as chaves cadastradas
    function carregarUsuarios() {
        // Altere a URL para apontar para o servidor backend correto
        fetch("https://meu-app.onrender.com/get-keys")  // Alterado para 3000
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

    // Carregar Usuários Cadastrados no Painel

    async function carregarUsuarios() {
        try {
            const response = await fetch("/get-usuarios");
            
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
    
    // Chamar a função ao carregar a página
    document.addEventListener("DOMContentLoaded", carregarUsuarios);

    
    // Cadastro de novo usuário
    document.getElementById("form-cadastrar").addEventListener("submit", async (e) => {
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

        // Envia a solicitação para renovar a chave
        fetch("https://meu-app.onrender.com/renovar-chave", {  // Alterado para 3000
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