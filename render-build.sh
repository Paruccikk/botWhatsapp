#!/bin/bash

# Instala as dependências necessárias para o Puppeteer no Render
apt-get update
apt-get install -y wget ca-certificates fonts-liberation libappindicator3-1 libnss3 lsb-release xdg-utils

# Instalar o Chromium (caso não esteja disponível)
apt-get install -y chromium
