import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import cors from "cors"
import helmet from "helmet"
import compression from "compression"
import rateLimit from "express-rate-limit"
import dotenv from "dotenv"
import { whatsappManager } from "./services/whatsapp-manager.service.js"
import { supabase } from "./config/supabase.js"

dotenv.config()

console.log("🚀 WhatsApp CRM Backend iniciando...")
console.log("📦 Node.js:", process.version)
console.log("🌍 Ambiente:", process.env.NODE_ENV || "development")

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  },
})

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
)
app.use(compression())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true, limit: "50mb" }))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
})
app.use("/api/", limiter)

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

const mockSessions = []

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  })
})

app.get("/api/auth/me", (req, res) => {
  console.log("[v0] GET /api/auth/me")
  res.json({
    user: {
      id: "demo-user",
      email: "cesar.mediotec@gmail.com",
      name: "Demo User",
      role: "admin",
    },
    message: "Auth funcionando - usuário demo",
  })
})

app.post("/api/auth/login", (req, res) => {
  console.log("[v0] POST /api/auth/login:", req.body)
  const { email, password } = req.body

  res.json({
    success: true,
    user: {
      id: "demo-user",
      email: email || "demo@example.com",
      name: "Demo User",
      role: "admin",
    },
    token: "demo-token-" + Date.now(),
    message: "Login funcionando - auth será implementado em breve",
  })
})

app.post("/api/auth/register", (req, res) => {
  console.log("[v0] POST /api/auth/register:", req.body)
  const { email, password, name } = req.body

  res.status(201).json({
    success: true,
    user: {
      id: "demo-user-" + Date.now(),
      email,
      name,
      role: "user",
    },
    token: "demo-token-" + Date.now(),
    message: "Registro funcionando - auth será implementado em breve",
  })
})

app.post("/api/auth/logout", (req, res) => {
  console.log("[v0] POST /api/auth/logout")
  res.json({
    success: true,
    message: "Logout realizado com sucesso",
  })
})

app.post("/api/auth/refresh", (req, res) => {
  console.log("[v0] POST /api/auth/refresh")
  res.json({
    success: true,
    token: "demo-token-refreshed-" + Date.now(),
    message: "Token refresh funcionando",
  })
})

app.get("/", (req, res) => {
  res.json({
    message: "WhatsApp CRM Backend API",
    status: "running",
    version: "2.0.0",
    endpoints: {
      health: "/health",
      auth: "/api/auth/*",
      sessions: "/api/whatsapp/sessions",
      qr: "/api/whatsapp/sessions/:sessionId/qr",
      disconnect: "/api/whatsapp/sessions/:sessionId/disconnect",
      connect: "/api/whatsapp/sessions/:sessionId/connect",
      sendMessage: "/api/whatsapp/send",
      debugWhatsApp: "/api/debug/whatsapp",
      testSupabase: "/api/test/supabase",
    },
  })
})

app.get("/api/test/supabase", async (req, res) => {
  try {
    console.log("[v0] ========== TESTING SUPABASE ==========")
    console.log("[v0] Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log("[v0] Has Service Role Key:", !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    console.log("[v0] Key length:", process.env.SUPABASE_SERVICE_ROLE_KEY?.length)

    // Test simple query
    const { data, error, count } = await supabase.from("whatsapp_sessions").select("*", { count: "exact" })

    console.log("[v0] Query result:")
    console.log("[v0] - Error:", JSON.stringify(error, null, 2))
    console.log("[v0] - Data:", JSON.stringify(data, null, 2))
    console.log("[v0] - Count:", count)
    console.log("[v0] ==========================================")

    res.json({
      success: !error,
      error: error,
      data: data,
      count: count,
      config: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 50) + "...",
      },
    })
  } catch (error) {
    console.error("[v0] Test error:", error)
    res.status(500).json({ error: error.message, stack: error.stack })
  }
})

app.get("/api/whatsapp/sessions", async (req, res) => {
  try {
    console.log("[v0] ========================================")
    console.log("[v0] GET /api/whatsapp/sessions - fetching real sessions")
    console.log("[v0] Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "...")
    console.log("[v0] Has service role key:", !!process.env.SUPABASE_SERVICE_ROLE_KEY)

    const { data: sessions, error } = await supabase
      .from("whatsapp_sessions")
      .select("*")
      .order("created_at", { ascending: false })

    console.log("[v0] Supabase query result:")
    console.log("[v0] - Error:", error)
    console.log("[v0] - Data:", sessions)
    console.log("[v0] - Sessions count:", sessions?.length || 0)

    if (error) {
      console.error("[v0] Supabase error:", error)
      throw error
    }

    const transformedSessions =
      sessions?.map((session) => {
        const transformed = {
          _id: session.id,
          sessionId: session.session_id,
          name: session.name,
          phoneNumber: session.phone_number,
          status: session.status,
          qrCode: session.qr_code,
          lastConnected: session.last_connected,
          isConnected: session.status === "ready",
        }
        console.log("[v0] Transformed session:", transformed)
        return transformed
      }) || []

    console.log("[v0] Returning sessions:", {
      count: transformedSessions.length,
      sessions: transformedSessions,
    })
    console.log("[v0] ========================================")

    res.json({
      sessions: transformedSessions,
      total: transformedSessions.length,
    })
  } catch (error) {
    console.error("[v0] ❌ Error fetching sessions:", error)
    console.error("[v0] Error stack:", error.stack)
    res.status(500).json({ error: error.message })
  }
})

app.post("/api/whatsapp/sessions", async (req, res) => {
  try {
    const { name } = req.body

    if (!name) {
      return res.status(400).json({ error: "Nome da sessão é obrigatório" })
    }

    const sessionId = `session-${Date.now()}`

    console.log("[v0] ==================== CREATING SESSION ====================")
    console.log("[v0] Session name:", name)
    console.log("[v0] Session ID:", sessionId)

    const { data: tenants } = await supabase.from("tenants").select("id").limit(1).single()

    const tenantId = tenants?.id

    if (!tenantId) {
      return res.status(500).json({ error: "No tenant found. Please create a tenant first." })
    }

    const { data: newSession, error } = await supabase
      .from("whatsapp_sessions")
      .insert([
        {
          session_id: sessionId,
          name,
          tenant_id: tenantId, // Adding tenant_id to fix the constraint error
          status: "disconnected",
          is_active: true,
        },
      ])
      .select()
      .single()

    console.log("[v0] INSERT Response:")
    console.log("[v0] - Error:", JSON.stringify(error, null, 2))
    console.log("[v0] - Data:", JSON.stringify(newSession, null, 2))
    console.log("[v0] ============================================================")

    if (error) {
      console.error("[v0] ❌ Supabase INSERT error:", error)
      return res.status(500).json({
        error: "Erro ao criar sessão no banco de dados: " + error.message,
        details: error,
      })
    }

    if (!newSession) {
      console.error("[v0] ❌ No session data returned from INSERT")
      return res.status(500).json({ error: "Sessão criada mas não retornou dados" })
    }

    console.log("[v0] ✅ Session created successfully in Supabase:", newSession.id)

    const transformedSession = {
      _id: newSession.id,
      sessionId: newSession.session_id,
      name: newSession.name,
      status: newSession.status,
      isConnected: false,
    }

    setTimeout(async () => {
      try {
        console.log(`[v0] Initializing WhatsApp for session ${sessionId}`)
        await whatsappManager.initializeSession(sessionId)
        console.log(`[v0] ✅ WhatsApp initialized for session ${sessionId}`)
      } catch (error) {
        console.error(`[v0] ❌ Failed to initialize WhatsApp: ${error.message}`)
        await supabase.from("whatsapp_sessions").update({ status: "error" }).eq("session_id", sessionId)
      }
    }, 1000)

    res.status(201).json({
      success: true,
      message: "Sessão criada - iniciando conexão...",
      session: transformedSession,
    })
  } catch (error) {
    console.error("[v0] ❌ Unexpected error creating session:", error)
    res.status(500).json({ error: error.message, stack: error.stack })
  }
})

app.get("/api/whatsapp/sessions/:sessionId/qr", async (req, res) => {
  try {
    const { sessionId } = req.params
    console.log("[v0] GET /api/whatsapp/sessions/:sessionId/qr:", sessionId)

    const { data: session, error } = await supabase
      .from("whatsapp_sessions")
      .select("qr_code, status")
      .eq("session_id", sessionId)
      .single()

    if (error) throw error

    res.json({
      qrCode: session.qr_code,
      status: session.status,
      message: session.qr_code ? "Escaneie o QR code no WhatsApp" : "Conecte a sessão para gerar QR code",
    })
  } catch (error) {
    console.error("Error fetching QR code:", error)
    res.status(500).json({ error: error.message })
  }
})

app.post("/api/whatsapp/sessions/:sessionId/disconnect", async (req, res) => {
  try {
    const { sessionId } = req.params
    console.log("[v0] POST /api/whatsapp/sessions/:sessionId/disconnect:", sessionId)

    await whatsappManager.disconnectSession(sessionId)

    res.json({
      success: true,
      message: "Sessão desconectada com sucesso",
    })
  } catch (error) {
    console.error("Error disconnecting session:", error)
    res.status(500).json({ error: error.message })
  }
})

app.post("/api/whatsapp/sessions/:sessionId/connect", async (req, res) => {
  try {
    const { sessionId } = req.params
    console.log("[v0] POST /api/whatsapp/sessions/:sessionId/connect:", sessionId)

    await whatsappManager.initializeSession(sessionId)

    res.json({
      success: true,
      message: "Sessão iniciando - aguarde o QR code",
    })
  } catch (error) {
    console.error("Error connecting session:", error)
    res.status(500).json({ error: error.message })
  }
})

app.post("/api/whatsapp/send", async (req, res) => {
  try {
    console.log("[v0] POST /api/whatsapp/send:", req.body)
    const { sessionId, to, content } = req.body

    if (!sessionId || !to || !content) {
      return res.status(400).json({ error: "sessionId, to e content são obrigatórios" })
    }

    const sentMessage = await whatsappManager.sendMessage(sessionId, to, content)

    res.json({
      success: true,
      message: "Mensagem enviada com sucesso",
      messageId: sentMessage.id._serialized,
    })
  } catch (error) {
    console.error("Error sending message:", error)
    res.status(500).json({ error: error.message })
  }
})

app.get("/api/debug/whatsapp", async (req, res) => {
  try {
    const { data: sessions } = await supabase.from("whatsapp_sessions").select("*")

    const whatsappStatus = {
      isManagerLoaded: !!whatsappManager,
      managerType: typeof whatsappManager,
      activeSessions: whatsappManager?.clients ? Object.keys(whatsappManager.clients).length : 0,
      supabaseSessions: sessions?.length || 0,
      environmentVars: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        nodeVersion: process.version,
        platform: process.platform,
      },
    }

    res.json(whatsappStatus)
  } catch (error) {
    console.error("[v0] Debug endpoint error:", error)
    res.status(500).json({ error: error.message, stack: error.stack })
  }
})

app.use((err, req, res, next) => {
  console.error("❌ Erro:", err)
  res.status(500).json({
    error: err.message || "Erro interno do servidor",
  })
})

app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint não encontrado",
    path: req.path,
  })
})

const PORT = Number.parseInt(process.env.PORT, 10) || 5000

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`
╔═══════════════════════════════════╗
║   ✅ SERVIDOR FUNCIONANDO!        ║
╠═══════════════════════════════════╣
║ 🔗 Porta: ${PORT.toString().padEnd(23)}║
║ 🌐 Health: /health ${" ".repeat(15)}║
║ 📱 Frontend: ${(process.env.FRONTEND_URL || "não configurado").substring(0, 18).padEnd(18)}║
║ 💬 WhatsApp: ATIVO ${" ".repeat(14)}║
╚═══════════════════════════════════╝
  `)
})

process.on("SIGTERM", () => {
  console.log("SIGTERM recebido, fechando servidor...")
  httpServer.close(() => {
    console.log("Servidor fechado")
    process.exit(0)
  })
})

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err)
})

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err)
  process.exit(1)
})

global.io = io

export { io }
