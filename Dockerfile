FROM node:20-slim

RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libnss3 \
    libxss1 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install dependencies
COPY package*.json ./
COPY server/package*.json ./server/
RUN npm install && cd server && npm install

# Copy source code
COPY . .

# Build Next.js
RUN npm run build

# Create sessions directory
RUN mkdir -p ./server/whatsapp-sessions

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

CMD ["node", "server/index.js"]
