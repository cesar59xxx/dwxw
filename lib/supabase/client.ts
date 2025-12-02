import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  console.log("[v0] =================================")
  console.log("[v0] Creating Supabase Client")
  console.log("[v0] =================================")
  console.log("[v0] URL exists:", !!process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log("[v0] Key exists:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log("[v0] URL value:", process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 40) + "...")
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log("[v0] Key starts with:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + "...")
    console.log("[v0] Key length:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length)
    const keyPayload = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.split(".")[1]
    if (keyPayload) {
      try {
        const decoded = JSON.parse(atob(keyPayload))
        console.log("[v0] Key role:", decoded.role)
        console.log("[v0] ⚠️ ATENÇÃO: Se o role for 'service_role', você está usando a chave ERRADA!")
        console.log("[v0] ⚠️ O frontend precisa da 'anon' key, NÃO a 'service_role' key!")
      } catch (e) {
        console.log("[v0] Could not decode key payload")
      }
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    const errorMsg = `Variáveis do Supabase não encontradas. URL: ${supabaseUrl ? "✓" : "✗"}, Key: ${supabaseKey ? "✓" : "✗"}`
    console.error("[v0]", errorMsg)
    throw new Error(errorMsg)
  }

  console.log("[v0] Supabase client criado com sucesso!")
  console.log("[v0] =================================")

  return createBrowserClient(supabaseUrl, supabaseKey)
}
