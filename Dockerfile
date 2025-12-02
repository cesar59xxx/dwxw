FROM node:20-slim

# Install Chromium for WhatsApp Web
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libnss3 \
    libxss1 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install ALL dependencies
RUN npm install && cd server && npm install

# Copy all code
COPY . .

# Build Next.js frontend
RUN npm run build

# Create sessions directory
RUN mkdir -p ./server/whatsapp-sessions

# Set Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

CMD cd server && node index.js & npm run start
