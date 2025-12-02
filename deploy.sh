#!/bin/bash

echo "🚀 Fazendo commit e push para o Railway..."

# Add all changes
git add .

# Commit with message
git commit -m "fix: add all missing API endpoints (auth + whatsapp)"

# Push to main branch
git push origin main

echo "✅ Deploy enviado! Railway vai fazer deploy em 2-3 minutos."
echo "🔗 Acesse: https://railway.app/project/[seu-projeto]/deployments"
