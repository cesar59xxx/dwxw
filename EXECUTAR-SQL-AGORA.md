# FIX DEFINITIVO - Supabase whatsapp_sessions

## O PROBLEMA

O backend está tentando inserir a coluna `name` mas ela não existe no Supabase:

\`\`\`
PGRST204: Could not find the 'name' column of 'whatsapp_sessions'
\`\`\`

## SOLUÇÃO - 3 PASSOS

### 1. Abrir SQL Editor do Supabase
   - Acesse: https://supabase.com/dashboard
   - Entre no seu projeto
   - Clique em "SQL Editor" no menu lateral

### 2. Copiar e Colar o Script
   Copie TUDO do arquivo `scripts/fix-whatsapp-sessions-table.sql` e cole no SQL Editor

### 3. Executar
   Clique em RUN (ou Ctrl+Enter)

## RESULTADO ESPERADO

Você vai ver uma tabela mostrando todas as colunas:

\`\`\`
column_name       | data_type
------------------|-----------
id                | bigint
session_id        | text
name              | text       ✅ AGORA EXISTE!
phone_number      | text
status            | text
qr_code           | text
last_connected    | timestamp
is_active         | boolean
created_at        | timestamp
\`\`\`

## TESTAR

Depois de executar o script:

1. Vá para o frontend: https://dwxw.vercel.app/whatsapp
2. Clique em "Nova Sessão"
3. Digite um nome (ex: "Atendimento Principal")
4. Clique em "Criar Sessão"
5. O QR CODE VAI APARECER! 🎉

## SE DER ERRO

Se aparecer "column already exists", é porque a coluna já foi adicionada. Está tudo OK!

Se aparecer outro erro, me mande o erro completo.
