import { Tenant } from "../models/tenant.model.js"
import { User } from "../models/user.model.js"
import { WhatsAppSession } from "../models/whatsapp-session.model.js"
import { Contact } from "../models/contact.model.js"
import { Message } from "../models/message.model.js"

/**
 * Listar todos os tenants
 */
export const getAllTenants = async (req, res) => {
  const { page = 1, limit = 20, search } = req.query

  const query = {}
  if (search) {
    query.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }]
  }

  const skip = (page - 1) * limit

  const [tenants, total] = await Promise.all([
    Tenant.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number.parseInt(limit)),
    Tenant.countDocuments(query),
  ])

  res.json({
    tenants,
    pagination: {
      page: Number.parseInt(page),
      limit: Number.parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  })
}

/**
 * Obter detalhes de um tenant
 */
export const getTenantDetails = async (req, res) => {
  const { tenantId } = req.params

  const tenant = await Tenant.findById(tenantId)
  if (!tenant) {
    return res.status(404).json({ error: "Tenant não encontrado" })
  }

  // Buscar estatísticas
  const [users, sessions, contacts, messages] = await Promise.all([
    User.countDocuments({ tenantId }),
    WhatsAppSession.countDocuments({ tenantId }),
    Contact.countDocuments({ tenantId }),
    Message.countDocuments({ tenantId }),
  ])

  res.json({
    tenant,
    stats: {
      users,
      sessions,
      contacts,
      messages,
    },
  })
}

/**
 * Atualizar tenant
 */
export const updateTenant = async (req, res) => {
  const { tenantId } = req.params
  const updates = req.body

  const tenant = await Tenant.findByIdAndUpdate(tenantId, updates, { new: true })

  if (!tenant) {
    return res.status(404).json({ error: "Tenant não encontrado" })
  }

  res.json({
    message: "Tenant atualizado com sucesso",
    tenant,
  })
}

/**
 * Suspender/Reativar tenant
 */
export const toggleTenant = async (req, res) => {
  const { tenantId } = req.params

  const tenant = await Tenant.findById(tenantId)
  if (!tenant) {
    return res.status(404).json({ error: "Tenant não encontrado" })
  }

  tenant.isActive = !tenant.isActive
  await tenant.save()

  res.json({
    message: `Tenant ${tenant.isActive ? "reativado" : "suspendido"} com sucesso`,
    tenant,
  })
}

/**
 * Estatísticas globais
 */
export const getGlobalStats = async (req, res) => {
  const [totalTenants, activeTenants, totalUsers, totalSessions, totalContacts, totalMessages] = await Promise.all([
    Tenant.countDocuments(),
    Tenant.countDocuments({ isActive: true }),
    User.countDocuments(),
    WhatsAppSession.countDocuments(),
    Contact.countDocuments(),
    Message.countDocuments(),
  ])

  res.json({
    stats: {
      tenants: {
        total: totalTenants,
        active: activeTenants,
      },
      users: totalUsers,
      sessions: totalSessions,
      contacts: totalContacts,
      messages: totalMessages,
    },
  })
}

/**
 * Obter estatísticas para o dashboard admin
 */
export const getDashboardStats = async (req, res) => {
  try {
    const [totalTenants, activeSessions, totalUsers] = await Promise.all([
      Tenant.countDocuments({ isActive: true }),
      WhatsAppSession.countDocuments({ status: "connected" }),
      User.countDocuments(),
    ])

    // Calcular receita mensal simulada (baseado nos planos)
    const tenants = await Tenant.find({ isActive: true })
    const planPrices = {
      free: 0,
      starter: 97,
      professional: 297,
      enterprise: 997,
    }
    const monthlyRevenue = tenants.reduce((sum, tenant) => sum + (planPrices[tenant.plan] || 0), 0)

    res.json({
      totalTenants,
      activeSessions,
      totalUsers,
      monthlyRevenue,
    })
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar estatísticas" })
  }
}

/**
 * Listar todos os tenants com contagem de sessões
 */
export const getTenantsWithStats = async (req, res) => {
  try {
    const tenants = await Tenant.find().sort({ createdAt: -1 })

    // Buscar contagem de sessões para cada tenant
    const tenantsWithStats = await Promise.all(
      tenants.map(async (tenant) => {
        const sessionCount = await WhatsAppSession.countDocuments({ tenantId: tenant._id })
        return {
          ...tenant.toObject(),
          sessionCount,
        }
      }),
    )

    res.json(tenantsWithStats)
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar tenants" })
  }
}

/**
 * Listar todas as sessões com informações do tenant
 */
export const getAllSessions = async (req, res) => {
  try {
    const sessions = await WhatsAppSession.find().populate("tenantId", "name email").sort({ lastActivity: -1 })

    const sessionsData = sessions.map((session) => ({
      ...session.toObject(),
      tenant: session.tenantId,
    }))

    res.json(sessionsData)
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar sessões" })
  }
}

/**
 * Resetar uma sessão específica
 */
export const resetSession = async (req, res) => {
  try {
    const { sessionId } = req.params
    const session = await WhatsAppSession.findById(sessionId)

    if (!session) {
      return res.status(404).json({ error: "Sessão não encontrada" })
    }

    // Atualizar status para forçar reconexão
    session.status = "disconnected"
    session.qrCode = null
    await session.save()

    res.json({ message: "Sessão resetada com sucesso" })
  } catch (error) {
    res.status(500).json({ error: "Erro ao resetar sessão" })
  }
}

/**
 * Obter logs do sistema
 */
export const getSystemLogs = async (req, res) => {
  try {
    const { limit = 50 } = req.query

    // Buscar mensagens de erro recentes como logs
    const errorMessages = await Message.find({
      status: "error",
    })
      .sort({ createdAt: -1 })
      .limit(Number.parseInt(limit))
      .select("error createdAt contactId")

    const logs = errorMessages.map((msg) => ({
      level: "error",
      message: msg.error || "Erro no envio de mensagem",
      timestamp: msg.createdAt,
    }))

    // Adicionar alguns logs de sistema simulados
    const systemLogs = [
      { level: "info", message: "Sistema iniciado com sucesso", timestamp: new Date() },
      { level: "info", message: "Worker de filas conectado", timestamp: new Date() },
      { level: "info", message: "WebSocket servidor rodando", timestamp: new Date() },
    ]

    res.json([...systemLogs, ...logs])
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar logs" })
  }
}

/**
 * Atualizar plano do tenant
 */
export const updateTenantPlan = async (req, res) => {
  try {
    const { tenantId } = req.params
    const { plan } = req.body

    const planLimits = {
      free: { maxSessions: 1, maxContacts: 100, maxAgents: 1 },
      starter: { maxSessions: 2, maxContacts: 500, maxAgents: 5 },
      professional: { maxSessions: 5, maxContacts: 5000, maxAgents: 20 },
      enterprise: { maxSessions: 999999, maxContacts: 999999, maxAgents: 999999 },
    }

    const tenant = await Tenant.findByIdAndUpdate(
      tenantId,
      {
        plan,
        limits: planLimits[plan] || planLimits.free,
      },
      { new: true },
    )

    if (!tenant) {
      return res.status(404).json({ error: "Tenant não encontrado" })
    }

    res.json({ message: "Plano atualizado com sucesso", tenant })
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar plano" })
  }
}
