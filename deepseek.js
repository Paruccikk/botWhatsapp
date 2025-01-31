const axios = require("axios");
require("dotenv").config();

const apiKey = process.env.DEEPSEEK_API_KEY;
const apiUrl = "https://api.deepseek.com/v1/chat/completions"; // URL da API

// Função para obter resposta do DeepSeek
async function obterRespostaIA(mensagem, nomeUsuario) {
    // MODO SIMULADO (para testes)
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(`Oie ${nomeUsuario}, você disse: "${mensagem}". Como posso ajudar? 😊`);
        }, 1000);
    });

    /*
    // MODO DEEPSEEK (Ative quando quiser usar a API real)
    try {
        const resposta = await axios.post(
            apiUrl,
            {
                model: "deepseek-chat", // Modelo do DeepSeek
                messages: [
                    { role: "system", content: "Você é um assistente educado e profissional chamado Daniela." },
                    { role: "user", content: `Usuário (${nomeUsuario}): ${mensagem}` }
                ],
                temperature: 0.7
            },
            {
                headers: { Authorization: `Bearer ${apiKey}` }
            }
        );

        return resposta.data.choices[0].message.content.trim();
    } catch (error) {
        console.error("Erro ao chamar a API DeepSeek:", error);
        return "Estou com dificuldades técnicas no momento. Tente novamente mais tarde.";
    }
    */
}

module.exports = { obterRespostaIA };
