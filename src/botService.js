const axios = require("axios");
const fs = require("fs");
require("dotenv").config(); // Carrega as variáveis de ambiente do arquivo .env

const apiKey = process.env.MISTRAL_API_KEY; // Obtém a chave da API do Mistral
const apiUrl = "https://api.mistral.ai/v1/chat/completions"; // URL da API Mistral

// Função para carregar dados da empresa do arquivo JSON
function carregarDadosEmpresa(numero) {
    try {
        return JSON.parse(fs.readFileSync(`dados_empresa_${numero}.json`, 'utf8'));
    } catch (error) {
        return { perguntas_respostas: [] }; // Retorna um array vazio se o arquivo não existir
    }
}

// Função para verificar se a pergunta tem uma resposta personalizada
function verificarPerguntaEmpresa(pergunta, numero) {
    const dados = carregarDadosEmpresa(numero);

    // Verificar se há uma resposta personalizada para a pergunta
    for (let item of dados.perguntas_respostas) {
        if (new RegExp(item.pergunta, 'i').test(pergunta)) {
            return item.resposta; // Retorna a resposta personalizada
        }
    }

    // Se não encontrar uma resposta personalizada, chama a IA
    return obterRespostaIA(pergunta, numero);
}

// Função para obter a resposta da IA
async function obterRespostaIA(mensagem, numero) {
    try {
        const resposta = await axios.post(
            apiUrl,
            {
                model: "mistral-small", // Escolha o modelo desejado
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

module.exports = { obterRespostaIA, verificarPerguntaEmpresa };
