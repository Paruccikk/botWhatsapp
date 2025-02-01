document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const phoneNumber = document.getElementById('phoneNumber').value;
    const password = document.getElementById('password').value;

    const loginData = {
        phoneNumber,
        password
    };

    try {
        const response = await fetch('https://botwhatsapp-oxct.onrender.com/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);  // Login bem-sucedido
            // Redirecionar ou fazer algo com o resultado
        } else {
            alert(result.error);  // Se houver erro, mostrar a mensagem
        }
    } catch (error) {
        console.error("Erro de login:", error);
        alert("Ocorreu um erro ao tentar fazer login.");
    }
});
