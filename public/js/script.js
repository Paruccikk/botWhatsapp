document.addEventListener('DOMContentLoaded', function () {
    // Valida se estamos na página de ativação (dashboard.html)
    const activationForm = document.getElementById('activationForm');
    if (activationForm) {
        activationForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const chave = document.getElementById('chave').value;
            const phoneNumber = document.getElementById('phoneNumber').value;
            const messageElement = document.getElementById('message');

            if (!chave || !phoneNumber) {
                messageElement.innerText = "Por favor, insira a chave de acesso e o número de telefone.";
                return;
            }

            try {
                const response = await fetch(`/validate-key?chave=${chave}`);
                const result = await response.json();

                if (result.success) {
                    const qrResponse = await fetch(`/generate-qr?phoneNumber=${phoneNumber}`);
                    const qrResult = await qrResponse.json();

                    if (qrResult.success) {
                        document.getElementById('qrCodeImage').src = qrResult.qr;
                        document.getElementById('qrCodeSection').style.display = 'block';
                    } else {
                        messageElement.innerText = qrResult.message;
                    }
                } else {
                    messageElement.innerText = result.message;
                }
            } catch (error) {
                console.error('Erro ao gerar QR Code:', error);
                messageElement.innerText = "Erro ao gerar QR Code, tente novamente mais tarde.";
            }
        });
    }

    // Valida se estamos na página de login (index.html)
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const login = document.getElementById('login');
            const senha = document.getElementById('senha');
            const messageElement = document.getElementById('login-message');

            if (!login || !senha) {
                messageElement.innerText = "Por favor, preencha todos os campos.";
                return;
            }

            try {
                // Certifique-se de que o URL do backend está correto aqui
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ login: login.value, senha: senha.value }),
                });

                const result = await response.json();

                if (result.success) {
                    window.location.href = 'dashboard.html';
                } else {
                    messageElement.innerText = result.message || "Erro ao realizar login.";
                }
            } catch (error) {
                console.error('Erro no login:', error);
                messageElement.innerText = "Erro ao realizar login, tente novamente mais tarde.";
            }
        });
    }

    // Cadastro
    document.getElementById('cadastro-form')?.addEventListener('submit', async function (event) {
        event.preventDefault(); // Impede o envio tradicional do formulário

        const usuario = document.getElementById('usuario');
        const telefone = document.getElementById('telefone');
        const empresa = document.getElementById('empresa');
        const senha = document.getElementById('senha');

        // Valida os campos antes de enviar
        if (!validateForm([usuario, telefone, empresa, senha])) return;

        const userData = {
            usuario: usuario.value,
            telefone: telefone.value,
            empresa: empresa.value,
            senha: senha.value
        };

        try {
            const response = await fetch('/cadastro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });

            const result = await response.json();

            if (response.ok) {
                alert('Cadastro realizado com sucesso!');
                window.location.href = 'index.html';
            } else {
                alert(result.message || 'Erro no cadastro');
            }
        } catch (error) {
            console.error('Erro no envio do cadastro:', error);
            alert('Erro ao realizar cadastro, tente novamente mais tarde.');
        }
    });

    // Função para validar os campos do formulário (verificando se estão preenchidos)
    function validateForm(fields) {
        for (const field of fields) {
            if (!field.value) {
                alert(`Por favor, preencha o campo ${field.placeholder}`);
                return false;
            }
        }
        return true;
    }

    // Evento para o botão de gerar QR Code no Dashboard
    document.getElementById('btn-gerar-qr')?.addEventListener('click', async function () {
        try {
            const response = await fetch('/generate-qr');
            const data = await response.json();
    
            if (data.success) {
                const qrCodeImage = document.getElementById('qr-code');
                qrCodeImage.src = data.qr;  // Atualiza o src com o QR Code gerado
                qrCodeImage.style.display = 'block';  // Exibe a imagem
            } else {
                alert('Erro ao gerar QR Code: ' + data.message);
            }
        } catch (error) {
            alert('Erro ao gerar QR Code: ' + error.message);
        }
    });

    // Função para renovar chave no Dashboard
    window.renovarChave = async function(telefone) {
        try {
            const response = await fetch(`/renovar-chave?telefone=${telefone}`, { method: "POST" });
            if (!response.ok) throw new Error("Erro ao renovar chave");
            alert("Chave renovada com sucesso!");
            carregarUsuarios();
        } catch (error) {
            alert("Erro ao renovar chave: " + error.message);
        }
    };

    // Função para carregar usuários na tabela do Dashboard (só na admin.html)
    if (window.location.pathname.includes('admin.html')) {
        const tabelaUsuarios = document.getElementById("usersTable")?.getElementsByTagName("tbody")[0];

        if (tabelaUsuarios) {
            async function carregarUsuarios() {
                try {
                    const response = await fetch("/get-usuarios");
                    if (!response.ok) throw new Error(`Erro ${response.status}: ${response.statusText}`);
                    
                    const usuarios = await response.json();

                    if (!usuarios || Object.keys(usuarios).length === 0) {
                        alert("Nenhum usuário encontrado.");
                        return;
                    }

                    tabelaUsuarios.innerHTML = "";  // Limpar a tabela antes de preencher

                    Object.keys(usuarios).forEach(telefone => {
                        const userData = usuarios[telefone];
                        const row = tabelaUsuarios.insertRow();
                        row.insertCell(0).textContent = telefone;
                        row.insertCell(1).textContent = userData.empresa;
                        row.insertCell(2).textContent = userData.chave;
                        row.insertCell(3).textContent = formatarData(userData.chave_expiracao);
                        row.insertCell(4).innerHTML = `<button class="btn-renovar" onclick="renovarChave('${telefone}')">🔄 Renovar</button>`;
                    });
                } catch (error) {
                    console.error("Erro ao carregar usuários:", error);
                    alert(error.message);
                }
            }

            // Função para formatar a data de expiração da chave
            function formatarData(dataString) {
                const data = new Date(Number(dataString));  // Certifique-se de que o valor seja um número
                if (isNaN(data)) {
                    return "Data inválida";
                }
                return data.toLocaleDateString("pt-BR");  // Formata a data como 'dd/mm/aaaa'
            }

            // Carregar usuários na página
            carregarUsuarios();
        } else {
            console.error('Elemento de tabela não encontrado!');
        }
    }
});
