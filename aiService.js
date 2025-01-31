const axios = require("axios");
require("dotenv").config();

const apiKey = process.env.MISTRAL_API_KEY;
const apiUrl = "https://api.mistral.ai/v1/chat/completions";
const fs = require('fs');

// Função para carregar usuários e empresas
const loadUsers = () => {
    try {
        return JSON.parse(fs.readFileSync('keys.json', 'utf8'));
    } catch (error) {
        return {};
    }
};

// 🟢 Verificar se a pergunta tem resposta nos dados da empresa
function verificarPerguntaEmpresa(pergunta, numero) {
    const users = loadUsers();
    const empresa = users[numero] ? users[numero].empresa : null;

    if (!empresa) return null;

    if (/horário|funcionamento/i.test(pergunta)) {
        return `O horário de funcionamento da ${empresa.nome} é das ${empresa.horario_funcionamento}.`;
    }
    if (/endereço|localização/i.test(pergunta)) {
        return `O endereço da ${empresa.nome} é ${empresa.endereco}.`;
    }
    if (/telefone|contato/i.test(pergunta)) {
        return `O telefone de contato da ${empresa.nome} é ${empresa.telefone}.`;
    }
    if (/serviços|o que faz/i.test(pergunta)) {
        return `A ${empresa.nome} oferece os seguintes serviços: ${empresa.servicos}.`;
    }

    return null;
}

// 🟢 Obter resposta da IA
async function obterRespostaIA(mensagem, numero) {
    const respostaLocal = verificarPerguntaEmpresa(mensagem, numero);
    if (respostaLocal) return respostaLocal;

    try {
        const resposta = await axios.post(
            apiUrl,
            {
                model: "mistral-small",
                messages: [
                    { role: "system", content: "Você é um assistente amigável e profissional." },
                    { role: "user", content: `Usuário (${numero}): ${mensagem}` }
                ],
                temperature: 0.7
            },
            {
                headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }
            }
        );

        return resposta.data.choices[0].message.content.trim();
    } catch (error) {
        console.error("Erro ao chamar a API Mistral:", error);
        return "Estou com dificuldades técnicas no momento. Tente novamente mais tarde.";
    }
}

module.exports = { obterRespostaIA };
