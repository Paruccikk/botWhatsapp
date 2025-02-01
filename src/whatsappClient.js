const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { obterRespostaIA } = require('./public/deepseek'); // Importa a função de resposta da IA

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true }
});

// Variável global para armazenar o QR Code e o timestamp do bot
global.qrCodeUrl = null;
global.botStartTime = null;  // Armazenar o timestamp quando o bot estiver pronto

// Evento para gerar o QR Code
client.on('qr', (qr) => {
    console.log("QR Code gerado:", qr);
    // Se o QR Code ainda não foi gerado, gerar e armazenar
    if (!global.qrCodeUrl) {
        qrcode.toDataURL(qr, (err, url) => {
            if (err) {
                console.error("Erro ao gerar QR Code:", err);
                return;
            }
            global.qrCodeUrl = url; // Armazena o QR Code
            console.log("QR Code gerado com sucesso!");
        });
    }
});


// Evento quando o cliente estiver pronto
client.on('ready', () => {
    console.log("✅ Cliente WhatsApp conectado com sucesso!");
    global.botStartTime = new Date().getTime(); // Salva o timestamp quando o bot estiver pronto
});

// 📩 Evento para lidar com mensagens recebidas
client.on('message', async (message) => {
    console.log(`📩 Mensagem recebida de ${message.from}: ${message.body}`);

    // Verifica se a mensagem NÃO vem de um grupo e se foi recebida após o bot ter iniciado
    if (!message.from.includes("@g.us") && message.timestamp * 1000 > global.botStartTime) {
        try {
            // Obtém resposta da IA simulada (ou do DeepSeek quando for implementado)
            const resposta = await obterRespostaIA(message.body, message._data.notifyName);

            // Envia a resposta para o usuário
            await client.sendMessage(message.from, resposta);
            console.log(`✅ Resposta enviada para ${message.from}: ${resposta}`);
        } catch (error) {
            console.error("❌ Erro ao processar a mensagem:", error);
        }
    } else {
        console.log("📩 Ignorando mensagem anterior ao início do bot.");
    }
});


// Inicializa o cliente do WhatsApp
client.initialize().catch(error => {
    console.error("❌ Erro ao inicializar o cliente WhatsApp:", error);
});

module.exports = client;