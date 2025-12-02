#!/bin/bash

# Script para iniciar o ambiente de desenvolvimento completo

echo "🚀 Iniciando ambiente de desenvolvimento..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se MongoDB está rodando
echo -e "${YELLOW}Verificando MongoDB...${NC}"
if ! pgrep -x "mongod" > /dev/null; then
    echo "❌ MongoDB não está rodando. Inicie com: mongod"
    exit 1
fi
echo -e "${GREEN}✓ MongoDB rodando${NC}"

# Verificar se Redis está rodando
echo -e "${YELLOW}Verificando Redis...${NC}"
if ! pgrep -x "redis-server" > /dev/null; then
    echo "❌ Redis não está rodando. Inicie com: redis-server"
    exit 1
fi
echo -e "${GREEN}✓ Redis rodando${NC}"

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado. Copie .env.example para .env"
    exit 1
fi

# Criar pasta de sessões se não existir
mkdir -p whatsapp-sessions
echo -e "${GREEN}✓ Pasta de sessões criada${NC}"

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Instalando dependências...${NC}"
    npm install
fi

# Iniciar backend em background
echo -e "${YELLOW}Iniciando backend...${NC}"
npm run dev:backend &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend iniciado (PID: $BACKEND_PID)${NC}"

# Aguardar backend iniciar
sleep 3

# Iniciar worker em background
echo -e "${YELLOW}Iniciando worker de filas...${NC}"
npm run worker &
WORKER_PID=$!
echo -e "${GREEN}✓ Worker iniciado (PID: $WORKER_PID)${NC}"

# Aguardar worker iniciar
sleep 2

# Iniciar frontend
echo -e "${YELLOW}Iniciando frontend...${NC}"
echo -e "${GREEN}✓ Tudo pronto!${NC}"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:5000"
echo ""
echo "Para parar: Ctrl+C"

npm run dev:frontend

# Cleanup ao sair
trap "echo 'Parando serviços...'; kill $BACKEND_PID $WORKER_PID 2>/dev/null" EXIT
