document.addEventListener("DOMContentLoaded", function () {
    const formCadastrar = document.getElementById("form-cadastrar");
    const tabelaUsuarios = document.getElementById("usersTable").getElementsByTagName("tbody")[0];

    // Função para carregar os usuários
    async function carregarUsuarios() {
        try {
            const response = await fetch("/get-usuarios");
            if (!response.ok) throw new Error(`Erro ${response.status}: ${response.statusText}`);
            
            const usuarios = await response.json();
            tabelaUsuarios.innerHTML = "";  // Limpar a tabela antes de preencher

            // Iterar sobre os usuários (a chave do objeto é o telefone)
            Object.keys(usuarios).forEach(telefone => {
                const userData = usuarios[telefone];  // Acessa os dados do usuário pela chave (telefone)
                
                const row = tabelaUsuarios.insertRow();
                row.insertCell(0).textContent = userData.telefone;  // Número do telefone
                row.insertCell(1).textContent = userData.empresa;   // Nome da empresa
                row.insertCell(2).textContent = userData.chave;     // Chave de acesso
                row.insertCell(3).textContent = formatarData(userData.chave_expiracao);  // Expiração da chave
                row.insertCell(4).innerHTML = `<button class="btn-renovar" onclick="renovarChave('${telefone}')">🔄 Renovar</button>`;  // Ação de renovação
            });
        } catch (error) {
            console.error("Erro ao carregar usuários:", error);
            alert(error.message);
        }
    }

    // Função para formatar a data de expiração da chave
    function formatarData(dataString) {
        const data = new Date(Number(dataString));  // Converte o valor para número
        if (isNaN(data)) {
            return "Data inválida";
        }
        return data.toLocaleDateString("pt-BR");  // Formata como 'dd/mm/aaaa'
    }

    // Envio do formulário de cadastro
    formCadastrar.addEventListener("submit", async (e) => {
        e.preventDefault();
        const telefone = document.getElementById("numero-cadastro").value;  // Telefone para cadastro
        const senha = document.getElementById("senha-cadastro").value;       // Senha
        const empresa = document.getElementById("empresa-cadastro").value;   // Nome da empresa

        try {
            const response = await fetch("/cadastrar-usuario", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ telefone, senha, empresa })  // Enviando os dados para o backend
            });
            const data = await response.json();
            if (response.ok) {
                alert(`Usuário cadastrado com sucesso! Chave de Acesso: ${data.chave}`);
                carregarUsuarios();  // Atualiza a lista de usuários
            } else {
                alert("Erro ao cadastrar usuário: " + data.error);
            }
        } catch (error) {
            alert("Erro ao cadastrar usuário: " + error.message);
        }
    });

    // Função para renovar a chave de um usuário
    window.renovarChave = async function(telefone) {  
        try {
            const response = await fetch("/renovar-chave", { 
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ numero: telefone })  // Passando o número no corpo da requisição
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro desconhecido ao renovar chave');
            }
    
            alert("Chave renovada com sucesso!");
            carregarUsuarios();  // Atualiza a lista de usuários
        } catch (error) {
            alert("Erro ao renovar chave: " + error.message);
        }
    };
    

    // Carregar os usuários assim que a página for carregada
    carregarUsuarios();

    
});


