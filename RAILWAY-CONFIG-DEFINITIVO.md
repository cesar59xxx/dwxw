# 🚀 CONFIGURAÇÃO DEFINITIVA DO RAILWAY

## ❌ PROBLEMA IDENTIFICADO

O Railway está falhando com "PORT variable must be integer" porque você está configurando `PORT=5000` manualmente, mas o Railway espera gerenciar isso automaticamente.

## ✅ SOLUÇÃO: CONFIGURAÇÃO CORRETA DAS VARIÁVEIS

Vá para Railway → Seu Projeto → Variables e configure EXATAMENTE assim:

### 1. DELETE ESTAS VARIÁVEIS:
- ❌ `PORT` - **REMOVA COMPLETAMENTE** (o Railway fornece automaticamente)

### 2. MANTENHA/ADICIONE ESTAS VARIÁVEIS:

\`\`\`env
# Supabase (copie do dashboard do Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://ldieqcofmincppqzownw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi... (sua chave anon)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... (sua chave service_role - DIFERENTE da anon!)

# Frontend (com HTTPS!)
FRONTEND_URL=https://novo-222.vercel.app

# Puppeteer/WhatsApp
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Node
NODE_ENV=production

# Sessions (opcional)
SESSIONS_PATH=/app/server/whatsapp-sessions
\`\`\`

### 3. CONFIGURE NO VERCEL (Frontend):

Vá para Vercel → Seu Projeto → Settings → Environment Variables:

\`\`\`env
# Backend API (copie a URL do seu Railway)
NEXT_PUBLIC_API_URL=https://dwxw-production.up.railway.app
NEXT_PUBLIC_BACKEND_URL=https://dwxw-production.up.railway.app

# Supabase (MESMAS do Railway)
NEXT_PUBLIC_SUPABASE_URL=https://ldieqcofmincppqzownw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi... (SUA CHAVE ANON - NÃO a service_role!)
\`\`\`

## 🔥 CHECKLIST FINAL

- [ ] Deletei a variável `PORT` do Railway
- [ ] Adicionei `FRONTEND_URL` COM `https://`
- [ ] Copiei as 3 chaves do Supabase (URL, anon, service_role)
- [ ] Configurei `NEXT_PUBLIC_API_URL` no Vercel
- [ ] Fiz redeploy no Railway (ele vai pegar as novas variáveis)
- [ ] Fiz redeploy no Vercel

## 🎯 POR QUE ISSO RESOLVE TUDO:

1. **PORT**: Railway fornece automaticamente a porta dinâmica ($PORT)
2. **FRONTEND_URL**: Com https:// o CORS vai funcionar
3. **Service Role Key**: Backend pode fazer INSERT no Supabase
4. **NEXT_PUBLIC_API_URL**: Frontend sabe onde chamar o backend
5. **Chromium**: Já está instalado no Dockerfile

## 🚨 ATENÇÃO: DIFERENÇA ENTRE CHAVES

- **ANON KEY**: Usa no frontend (segura para expor)
- **SERVICE_ROLE KEY**: Usa no backend (NUNCA expor no frontend!)

O erro que você viu no console ("Se o role for 'service_role'...") era porque você COLOCOU A CHAVE ERRADA no lugar errado.

## 📋 PRÓXIMOS PASSOS

1. Delete `PORT` do Railway
2. Adicione as variáveis acima
3. Faça redeploy (Railway vai rebuild automaticamente)
4. Aguarde 2-3 minutos
5. Acesse `https://seu-app.up.railway.app/health`
6. Se retornar `{"status":"ok"...}` = funcionou!
7. Vá no frontend e crie uma sessão WhatsApp
8. O QR code vai aparecer!

## 🆘 SE AINDA DER ERRO

Me envie:
1. Screenshot das variáveis do Railway (sem mostrar as chaves completas)
2. Os Build Logs completos
3. A URL do seu Railway app

E eu corrijo na hora!
