FROM node:18-alpine

# Instalar dependências do Puppeteer
RUN apk add --no-cache \
    wget \
    ca-certificates \
    font-noto \
    chromium \
    nss \
    freetype \
    harfbuzz \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copiar package files
COPY package*.json ./

RUN npm install --production

# Copiar código
COPY . .

# Build Next.js
RUN npm run build

# Criar pasta de sessões
RUN mkdir -p whatsapp-sessions && chmod 777 whatsapp-sessions

# Expor porta
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); });"

# Start Next.js
CMD ["npm", "run", "start"]
