-- Fix tenant_id not-null constraint in whatsapp_sessions table
-- Execute este script no Supabase SQL Editor

-- Opção 1: Tornar tenant_id opcional (RECOMENDADO)
ALTER TABLE whatsapp_sessions
ALTER COLUMN tenant_id DROP NOT NULL;

-- Se houver outras colunas com problema, execute também:
ALTER TABLE whatsapp_sessions
ALTER COLUMN user_id DROP NOT NULL;

-- Verificar que a tabela está correta agora
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'whatsapp_sessions'
ORDER BY ordinal_position;
