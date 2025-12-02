import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log("[v0] Supabase Config Check:")
console.log("[v0] - URL:", supabaseUrl ? supabaseUrl.substring(0, 30) + "..." : "NOT SET")
console.log("[v0] - Service Key:", supabaseServiceKey ? "SET (" + supabaseServiceKey.length + " chars)" : "NOT SET")

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ CRITICAL: Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias")
  console.error("❌ Configure estas variáveis no Railway:")
  console.error("   - NEXT_PUBLIC_SUPABASE_URL")
  console.error("   - SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

console.log("✅ Supabase client configurado com sucesso")
