# 📋 VARIÁVEIS PARA COPIAR E COLAR

## RAILWAY (Backend)

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=https://ldieqcofmincppqzownw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkaWVxY29mbWluY3BwcXpvd253Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzNDU5NDYsImV4cCI6MjA0ODkyMTk0Nn0.lFIzMajkO46ilUeuKUl4CM4TakEhpZbqBef5_Hg
SUPABASE_SERVICE_ROLE_KEY=(PEGA NO DASHBOARD DO SUPABASE - API SETTINGS - SERVICE_ROLE KEY)
FRONTEND_URL=https://novo-222.vercel.app
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
NODE_ENV=production
SESSIONS_PATH=/app/server/whatsapp-sessions
\`\`\`

**IMPORTANTE**: NÃO coloque `PORT` - deixe o Railway gerenciar!

---

## VERCEL (Frontend)

\`\`\`
NEXT_PUBLIC_API_URL=https://dwxw-production.up.railway.app
NEXT_PUBLIC_BACKEND_URL=https://dwxw-production.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://ldieqcofmincppqzownw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkaWVxY29mbWluY3BwcXpvd253Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzNDU5NDYsImV4cCI6MjA0ODkyMTk0Nn0.lFIzMajkO46ilUeuKUl4CM4TakEhpZbqBef5_Hg
\`\`\`

**IMPORTANTE**: NO VERCEL use APENAS a ANON KEY, NUNCA a SERVICE_ROLE KEY!

---

## ONDE PEGAR AS CHAVES DO SUPABASE:

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em: Settings → API
4. Copie:
   - `Project URL` = NEXT_PUBLIC_SUPABASE_URL
   - `anon public` = NEXT_PUBLIC_SUPABASE_ANON_KEY
   - `service_role secret` = SUPABASE_SERVICE_ROLE_KEY (só para Railway!)
