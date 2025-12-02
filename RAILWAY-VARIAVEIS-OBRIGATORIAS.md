# VARIÁVEIS OBRIGATÓRIAS NO RAILWAY

## STATUS ATUAL

Você tem estas variáveis configuradas no Railway mas a sessão não está sendo salva no Supabase.

## PROBLEMA IDENTIFICADO

O backend está rodando e respondendo 201, mas o Supabase está retornando erro silencioso no INSERT.

## SOLUÇÃO: VERIFICAR VARIÁVEIS NO RAILWAY

Acesse: https://railway.app/project/[SEU_PROJETO]/service/novo-222/variables

### 1. Variáveis que DEVEM existir:

\`\`\`bash
NEXT_PUBLIC_SUPABASE_URL=https://ldieqcofmincppqzownw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
FRONTEND_URL=https://novo-222.vercel.app
PORT=5000
NODE_ENV=production
\`\`\`

### 2. Como verificar se está correto:

1. Vá em Railway > seu projeto > service "novo-222"
2. Clique em "Variables"
3. **CERTIFIQUE-SE** de que `SUPABASE_SERVICE_ROLE_KEY` está lá
4. O valor deve começar com `eyJhbGciOiJIUzI...` e ter ~250+ caracteres
5. NÃO use a chave `anon` aqui, APENAS a `service_role`

### 3. Onde encontrar a chave correta:

1. Acesse https://supabase.com/dashboard/project/ldieqcofmincppqzownw/settings/api
2. Procure por "service_role" (NÃO "anon")
3. Clique em "Reveal" para ver a chave completa
4. Copie a chave COMPLETA (começando com `eyJhbGci`)

### 4. Teste rápido:

Após configurar, acesse:
\`\`\`
https://novo-222-production.up.railway.app/api/test/supabase
\`\`\`

Deve retornar:
\`\`\`json
{
  "success": true,
  "data": [],
  "count": 0,
  "config": {
    "hasUrl": true,
    "hasKey": true
  }
}
\`\`\`

Se retornar erro ou `hasKey: false`, a variável está errada.

### 5. Depois de configurar:

1. Clique em "Save" no Railway
2. O serviço vai reiniciar automaticamente
3. Aguarde 1-2 minutos
4. Teste criando uma sessão nova
5. Verifique no Supabase se apareceu na tabela

## ERRO COMUM

Se você copiou as variáveis da Vercel, pode ter copiado ERRADO:
- VERCEL usa: `NEXT_PUBLIC_SUPABASE_ANON_KEY` (chave anon)
- RAILWAY usa: `SUPABASE_SERVICE_ROLE_KEY` (chave service_role)

São chaves DIFERENTES com NOMES DIFERENTES!
