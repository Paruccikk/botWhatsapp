const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");
const fs = require("fs");
const { obterRespostaIA } = require("./deepseek");
const config = require("./config");

// Criar cliente do WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true }
});

client.on("qr", (qr) => {
    console.log("Escaneie este QR Code para autenticar:");
    qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
    console.log("✅ Bot conectado com sucesso!");
});

// Carregar nomes salvos dos usuários
const arquivoUsuarios = "./usuarios.json";
let usuarios = {};
if (fs.existsSync(arquivoUsuarios)) {
    usuarios = JSON.parse(fs.readFileSync(arquivoUsuarios, "utf8"));
}

// Função principal para tratar mensagens
client.on("message", async (message) => {
    // Verificar se a mensagem é de um grupo
    if (message.isGroup) {
        // Se for de grupo, não faz nada (ignora)
        return;
    }

    const chatId = message.from;
    const texto = message.body.toLowerCase().trim(); // Transforma a mensagem em minúsculas e remove espaços extras

    try {
        // 🔹 Lista de saudações comuns
        const saudacoes = ["oi", "olá", "bom dia", "boa tarde", "boa noite", "e aí", "fala", "salve"];

        // 🔹 Se o usuário ainda não tem um nome salvo
        if (!usuarios[chatId]) {
            if (saudacoes.some(saudacao => texto.includes(saudacao))) {
                await message.reply("Olá! Eu sou a Daniela, sua assistente virtual. Antes de começarmos, como posso te chamar? 😊");
                return;
            } else {
                usuarios[chatId] = texto; // Salva o nome do usuário
                fs.writeFileSync(arquivoUsuarios, JSON.stringify(usuarios, null, 2));  // Alterado para arquivoUsuarios
                await message.reply(`Prazer em te conhecer, ${texto}! No que posso te ajudar hoje? 😊`);
                return;
            }
        }

        // 🔹 Nome do usuário já salvo
        const nomeUsuario = usuarios[chatId];

        // 🟢 Continua com as respostas normais da IA...
        const resposta = await obterRespostaIA(texto, nomeUsuario);
        await message.reply(resposta);

    } catch (error) {
        console.error("Erro ao processar a mensagem:", error);
        await message.reply("Ocorreu um erro ao processar sua mensagem. Por favor, tente novamente mais tarde.");
    }
});


client.initialize();
