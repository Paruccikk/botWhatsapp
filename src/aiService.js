// aiService.js
const { obterRespostaIA } = require('./someIAIntegration'); // Se você já tem essa função para interação com a Mistral

// Função para processar mensagens e obter respostas da IA
const responderMensagemIA = (mensagem) => {
    return obterRespostaIA(mensagem); // Chama a função que processa a interação com a IA
};

module.exports = { responderMensagemIA };
