#!/bin/bash

# Instalar as dependências, caso não estejam instaladas
echo "Instalando dependências..."
npm install

# Iniciar o servidor
echo "Iniciando o servidor..."
node ./src/js/server.js
