# Corrigir tenant_id AGORA

## O Problema

O backend está tentando criar sessões mas a tabela `whatsapp_sessions` tem a coluna `tenant_id` como obrigatória (NOT NULL). O backend não envia esse campo, causando erro 500.

## Solução Rápida (30 segundos)

1. Abra o Supabase: https://supabase.com/dashboard/project/ldieqcofmincpqgzownw/editor

2. Clique em **SQL Editor** (ícone ⚡ na barra lateral)

3. Copie e cole este SQL:

\`\`\`sql
ALTER TABLE whatsapp_sessions ALTER COLUMN tenant_id DROP NOT NULL;
\`\`\`

4. Clique em **RUN** (ou pressione Ctrl+Enter)

5. Deve aparecer: "Success. No rows returned"

## Testar

Agora vá no frontend e crie uma nova sessão. O QR code deve aparecer imediatamente!

## O Que Isso Faz?

Remove a restrição NOT NULL da coluna `tenant_id`, permitindo que ela seja NULL. Como você não está usando multi-tenant agora, essa coluna pode ficar vazia.

## Alternativa (Se Não For Usar Multi-Tenant Nunca)

Se você tem certeza que nunca vai usar multi-tenant, pode DELETAR a coluna:

\`\`\`sql
ALTER TABLE whatsapp_sessions DROP COLUMN tenant_id;
\`\`\`

Mas a primeira solução é mais segura.
