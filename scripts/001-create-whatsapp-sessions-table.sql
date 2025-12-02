-- Criar tabela no Supabase para armazenar sessões WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'disconnected',
  phone_number TEXT,
  qr_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_session_id ON whatsapp_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_status ON whatsapp_sessions(status);

-- Habilitar RLS (Row Level Security)
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações (simplificado para MVP)
CREATE POLICY "Allow all operations on whatsapp_sessions" ON whatsapp_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);
