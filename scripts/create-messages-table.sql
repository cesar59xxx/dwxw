-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES whatsapp_sessions(session_id) ON DELETE CASCADE,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  body TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_from_number ON messages(from_number);
CREATE INDEX IF NOT EXISTS idx_messages_direction ON messages(direction);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY IF NOT EXISTS "Enable all access for authenticated users" ON messages
  FOR ALL
  USING (true)
  WITH CHECK (true);
