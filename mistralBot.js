const { Client } = require('whatsapp-web.js');
const axios = require('axios');
const { LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

const apiKey = 'Sx5yFI5BhMKGJZDvU9XjGEK15G40Ep63';  // Coloque aqui sua chave da API Mistral

// Inicializando o cliente do WhatsApp Web
const client = new Client({
    authStrategy: new LocalAuth(),  // Usa autenticação local para evitar escaneamento contínuo
    puppeteer: { headless: true },
});

// Função para enviar mensagem para o WhatsApp
async function sendMessage(to, message) {
    try {
        await client.sendMessage(to, message);
        console.log(`Mensagem enviada para ${to}: ${message}`);
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
    }
}

// Função para obter uma resposta da IA Mistral
async function getMistralResponse(prompt) {
    try {
        const response = await axios.post(
            'https://api.mistral.ai/v1/chat/completions',  // Endpoint da API Mistral
            {
                model: 'mistral-7b',  // Ou o modelo que você estiver usando
                messages: [
                    { role: 'system', content: 'Você é um assistente que responde de forma amigável e útil.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 150  // Você pode ajustar o número de tokens conforme necessário
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Erro ao chamar a API Mistral:', error);
        return 'Desculpe, algo deu errado ao processar sua mensagem.';
    }
}

// Evento para quando o cliente do WhatsApp estiver pronto
client.on('ready', () => {
    console.log('Cliente WhatsApp Web conectado!');
});

// Evento para quando uma mensagem for recebida
client.on('message', async (message) => {
    console.log(`Mensagem recebida de ${message.from}: ${message.body}`);

    // Ignorar mensagens de grupos (caso não queira responder a grupos)
    if (message.from.includes('@g.us')) return;

    // Chama a função para obter uma resposta da IA Mistral
    const prompt = message.body;
    const botResponse = await getMistralResponse(prompt);

    // Envia a resposta da IA Mistral de volta para o usuário
    await sendMessage(message.from, botResponse);
});

// Iniciar o cliente do WhatsApp
client.initialize().catch((error) => {
    console.error('Erro ao inicializar o WhatsApp Web:', error);
});
