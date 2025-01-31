const axios = require("axios");
const fs = require("fs");
require("dotenv").config();

const apiKey = process.env.MISTRAL_API_KEY;
const apiUrl = "https://api.mistral.ai/v1/chat/completions";

// Carregar informações da empresa do arquivo JSON
function carregarDadosEmpresa() {
    try {
        const dados = fs.readFileSync("dados_empresa.json", "utf8");
        return JSON.parse(dados);
    } catch (error) {
        console.error("Erro ao carregar dados da empresa:", error);
        return {};
    }
}

// Função para verificar se a pergunta está relacionada à empresa
function verificarPerguntaEmpresa(pergunta) {
    const dados = carregarDadosEmpresa();
    
    if (/horário|funcionamento|abre|fecha/i.test(pergunta)) {
        return `O horário de funcionamento da ${dados.empresa} é das ${dados.horario_funcionamento}.`;
    }
    if (/endereço|localização|onde fica/i.test(pergunta)) {
        return `O endereço da ${dados.empresa} é ${dados.endereco}.`;
    }
    if (/telefone|contato/i.test(pergunta)) {
        return `O telefone de contato da ${dados.empresa} é ${dados.telefone}.`;
    }
    if (/serviços|o que faz|trabalho/i.test(pergunta)) {
        return `A ${dados.empresa} oferece os seguintes serviços: ${dados.servicos}.`;
    }
    
    return null; // Se a pergunta não for encontrada, retorna `null`
}

// Função para obter resposta da IA
async function obterRespostaIA(mensagem, nomeUsuario) {
    // Primeiro, verificar se a pergunta tem resposta no banco de dados
    const respostaLocal = verificarPerguntaEmpresa(mensagem);
    if (respostaLocal) {
        return respostaLocal; // Retorna a resposta do banco de dados sem chamar a IA
    }

    // Se a pergunta não estiver no banco, chama a IA
    try {
        const resposta = await axios.post(
            apiUrl,
            {
                model: "mistral-small", // Pode usar "mistral-medium" se preferir
                messages: [
                    { role: "system", content: "Você é um assistente amigável e profissional chamado Daniela." },
                    { role: "user", content: `Usuário (${nomeUsuario}): ${mensagem}` }
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
