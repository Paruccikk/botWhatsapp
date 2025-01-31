// server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const client = require('./whatsappClient'); // Importa o cliente WhatsApp
const crypto = require('crypto'); // Para geração de chaves seguras

// Inicializa o servidor Express
const app = express();
app.use(cors());
app.use(express.json()); // Permite receber JSON no body das requisições

const KEYS_FILE = 'keys.json';

// Função auxiliar para carregar as chaves do arquivo
const loadKeys = () => {
    try {
        return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
    } catch (error) {
        return {};
    }
};

// Função auxiliar para salvar as chaves no arquivo
const saveKeys = (keys) => {
    fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2), 'utf8');
};

// Endpoint para carregar todas as chaves registradas
app.get('/get-keys', (req, res) => {
    try {
        const keys = loadKeys();
        res.json(keys);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao carregar as chaves.' });
    }
});

// Endpoint para validar a chave de acesso
app.get('/validate-key', (req, res) => {
    try {
        const { accessKey, phoneNumber } = req.query;
        const keys = loadKeys();

        if (keys[phoneNumber]) {
            const storedKey = keys[phoneNumber].accessKey;
            const expirationDate = new Date(keys[phoneNumber].expiresAt);

            if (storedKey === accessKey && expirationDate > new Date()) {
                return res.json({ isValid: true, phoneNumber });
            }
        }
        res.json({ isValid: false });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao validar a chave.' });
    }
});


// Endpoint para cadastrar um novo usuário
app.post('/cadastrar-usuario', (req, res) => {
    try {
        const { numero, chave } = req.body;
        if (!numero || !chave) {
            return res.status(400).json({ error: 'Número e chave são obrigatórios.' });
        }

        const keys = loadKeys();
        if (keys[numero]) {
            return res.status(400).json({ error: 'Número já cadastrado.' });
        }

        keys[numero] = { accessKey: chave, expiresAt: new Date().toISOString() };
        saveKeys(keys);

        res.status(200).json({ message: 'Usuário cadastrado com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});





// Endpoint para renovar a chave de acesso de um usuário
app.post('/renovar-chave', (req, res) => {
    try {
        const { numero } = req.body;

        if (!numero) {
            return res.status(400).json({ error: 'Número de telefone é obrigatório.' });
        }

        const keys = loadKeys();

        if (!keys[numero]) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        // Gerar nova chave e atualizar a data de expiração
        const newAccessKey = crypto.randomBytes(16).toString('hex');
        const newExpiresAt = new Date();
        newExpiresAt.setDate(newExpiresAt.getDate() + 30);

        keys[numero] = { accessKey: newAccessKey, expiresAt: newExpiresAt.toISOString() };
        saveKeys(keys);

        res.json({ message: 'Chave renovada com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao renovar chave.' });
    }
});


// Endpoint para obter o QR Code
app.get('/generate-qr', (req, res) => {
    if (global.qrCodeUrl) {
        res.json({ qrCodeUrl: global.qrCodeUrl });
    } else {
        res.status(500).json({ error: 'QR Code ainda não gerado. Aguarde alguns instantes e tente novamente.' });
    }
});


// Inicia o servidor na porta 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
