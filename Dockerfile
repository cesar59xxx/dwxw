FROM node:20-slim

# Install Chromium and dependencies for WhatsApp Web
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libnss3 \
    libxss1 \
    wget \
    ca-certificates \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy all package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm install
RUN cd server && npm install

# Copy application code
COPY . .

# Create sessions directory
RUN mkdir -p ./server/whatsapp-sessions && chmod 777 ./server/whatsapp-sessions

# Set Puppeteer environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

ENV PORT=5000

# Expose ports
EXPOSE 3000 5000

# Build Next.js (frontend)
RUN npm run build

CMD ["sh", "-c", "cd server && PORT=${PORT:-5000} node index.js & npm run start"]
