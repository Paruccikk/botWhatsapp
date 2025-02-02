document.addEventListener('DOMContentLoaded', function () {
    // Instancia o Socket.io
    const socket = io();

    socket.on('qr', (qr) => {
        console.log("QR Code recebido:", qr);
        showQRCode(qr);
    });

    function showQRCode(qrComplete) {
        if (qrComplete) {
            document.getElementById('qrCodeImage').src = qrComplete;
            document.getElementById('qrCodeSection').style.display = 'block';
        } else {
            document.getElementById('message').innerText = 'Erro ao gerar QR Code.';
        }
    }

    // Função para lidar com o envio do formulário e geração do QR Code
    document.getElementById('activationForm')?.addEventListener('submit', async function (event) {
        event.preventDefault();
        
        const accessKey = document.getElementById('accessKey').value;
        const phoneNumber = document.getElementById('phoneNumber')?.value;

        // Verificação dos campos necessários
        if (!accessKey || !phoneNumber) {
            document.getElementById('message').innerText = "Por favor, insira a chave de acesso e o número de telefone.";
            return;
        }

        try {
            // Valida a chave de acesso
            const response = await fetch(`/validate-key?accessKey=${accessKey}`);
            const result = await response.json();

            if (result.success) {
                // Se a chave de acesso for válida, solicita o QR Code
                const qrResponse = await fetch(`/generate-qr?phoneNumber=${phoneNumber}`);
                const qrResult = await qrResponse.json();

                if (qrResult.success) {
                    showQRCode(qrResult.qr);
                } else {
                    document.getElementById('message').innerText = qrResult.message;
                }
            } else {
                document.getElementById('message').innerText = result.message;
            }
        } catch (error) {
            console.error('Erro ao gerar QR Code:', error);
            document.getElementById('message').innerText = "Erro ao gerar QR Code, tente novamente mais tarde.";
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

    // Cadastro
    document.getElementById('cadastro-form')?.addEventListener('submit', async function (event) {
        event.preventDefault(); // Impede o envio tradicional do formulário

        // Pega os valores dos campos de cadastro
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
            // Faz a requisição POST para o backend para registrar o usuário
            const response = await fetch('/cadastro', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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

    // Login
    document.getElementById('login-form')?.addEventListener('submit', async function (event) {
        event.preventDefault();

        const login = document.getElementById('login');
        const senha = document.getElementById('senha');

        // Valida os campos antes de enviar
        if (!validateForm([login, senha])) return;

        const loginData = {
            login: login.value,
            senha: senha.value,
        };

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData),
            });

            const result = await response.json();
            console.log('Resposta do servidor:', result);

            if (result.success) {
                window.location.href = 'dashboard.html';
            } else {
                alert(result.message || 'Erro ao realizar login');
            }
        } catch (error) {
            console.error('Erro no login:', error);
            alert('Erro ao realizar login, tente novamente mais tarde.');
        }
    });
});
