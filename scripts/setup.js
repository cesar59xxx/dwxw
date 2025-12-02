import fs from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, "..")

console.log("🚀 Configurando SaaS CRM WhatsApp...\n")

// Criar arquivo .env se não existir
const envPath = join(rootDir, ".env")
const envExamplePath = join(rootDir, ".env.example")

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath)
    console.log("✅ Arquivo .env criado a partir do .env.example")
  } else {
    console.log("⚠️  Arquivo .env.example não encontrado")
  }
} else {
  console.log("✅ Arquivo .env já existe")
}

// Criar diretório para sessões WhatsApp
const sessionsDir = join(rootDir, ".wwebjs_auth")
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true })
  console.log("✅ Diretório de sessões WhatsApp criado")
} else {
  console.log("✅ Diretório de sessões já existe")
}

// Criar diretório para cache
const cacheDir = join(rootDir, ".wwebjs_cache")
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true })
  console.log("✅ Diretório de cache criado")
} else {
  console.log("✅ Diretório de cache já existe")
}

console.log("\n📋 Próximos passos:")
console.log("1. Configure o arquivo .env com suas credenciais")
console.log("2. Certifique-se de que MongoDB e Redis estão rodando")
console.log("3. Execute: npm run dev")
console.log("\n🌐 URLs:")
console.log("   Frontend: http://localhost:3000")
console.log("   Backend:  http://localhost:3001")
console.log("\n✨ Pronto para desenvolver!\n")
