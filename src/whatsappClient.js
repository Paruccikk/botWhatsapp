const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true }
});

// Variáveis globais para armazenar QR Code e status do bot
global.qrCodeUrl = null;
global.botStartTime = null;

// Evento para capturar e armazenar o QR Code
client.on('qr', async (qr) => {
    console.log("QR Code gerado:", qr);
    global.qrCodeUrl = await qrcode.toDataURL(qr);
});

// Evento para indicar que o bot está pronto
client.on('ready', () => {
    console.log("✅ Cliente WhatsApp conectado com sucesso!");
    global.botStartTime = new Date().getTime();
});

// Inicializa o cliente do WhatsApp
client.initialize().catch(error => {
    console.error("❌ Erro ao inicializar o cliente WhatsApp:", error);
});

module.exports = client;
