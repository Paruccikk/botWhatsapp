# Use uma imagem base com Node.js
FROM node:16-slim

# Instalar dependências do Chromium (para o Puppeteer)
RUN apt-get update && apt-get install -y \
    libatk1.0-0 \
    libnss3 \
    libxss1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxrandr2 \
    libpango1.0-0 \
    libcups2 \
    libx11-6 \
    libxcb1 \
    libxext6 \
    libxi6 \
    libxrender1 \
    libglib2.0-0 \
    && apt-get clean

# Definir o diretório de trabalho dentro do container
WORKDIR /workspace

# Copiar o arquivo package.json e instalar as dependências do Node.js
COPY package*.json ./
RUN npm install

# Copiar o restante dos arquivos do projeto
COPY . .

# Expôr a porta onde o servidor irá rodar
EXPOSE 3000

# Definir o comando de inicialização
CMD ["node", "index.js"]
