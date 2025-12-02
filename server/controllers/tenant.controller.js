import { Tenant } from "../models/tenant.model.js"
import { User } from "../models/user.model.js"
import { WhatsAppSession } from "../models/whatsapp-session.model.js"
import { Contact } from "../models/contact.model.js"
import { Message } from "../models/message.model.js"

/**
 * Obter tenant atual
 */
export const getCurrentTenant = async (req, res) => {
  const tenant = await Tenant.findById(req.tenant._id)

  res.json({
    tenant: {
      id: tenant._id,
      name: tenant.name,
      email: tenant.email,
      plan: tenant.plan,
      planLimits: tenant.planLimits,
      subscription: tenant.subscription,
      settings: tenant.settings,
    },
  })
}

/**
 * Atualizar configurações
 */
export const updateSettings = async (req, res) => {
  const { name, settings } = req.body

  const tenant = await Tenant.findById(req.tenant._id)

  if (name) tenant.name = name
  if (settings) {
    tenant.settings = { ...tenant.settings, ...settings }
  }

  await tenant.save()

  res.json({
    message: "Configurações atualizadas com sucesso",
    tenant,
  })
}

/**
 * Listar usuários do tenant
 */
export const getUsers = async (req, res) => {
  const users = await User.find({ tenantId: req.tenant._id })

  res.json({ users })
}

/**
 * Criar novo usuário/agente
 */
export const createUser = async (req, res) => {
  const { email, password, name, role, permissions } = req.body

  // Verificar limite de agentes
  if (role === "agent") {
    const canAdd = await req.tenant.canAddAgent()
    if (!canAdd) {
      return res.status(403).json({
        error: `Limite de agentes atingido. Plano ${req.tenant.plan} permite ${req.tenant.planLimits.maxAgents} agente(s).`,
      })
    }
  }

  const user = await User.create({
    tenantId: req.tenant._id,
    email,
    password,
    name,
    role: role || "agent",
    permissions: permissions || [],
  })

  res.status(201).json({
    message: "Usuário criado com sucesso",
    user,
  })
}

/**
 * Atualizar usuário
 */
export const updateUser = async (req, res) => {
  const { userId } = req.params
  const { name, role, permissions, isActive } = req.body

  const user = await User.findOne({
    _id: userId,
    tenantId: req.tenant._id,
  })

  if (!user) {
    return res.status(404).json({ error: "Usuário não encontrado" })
  }

  if (name) user.name = name
  if (role) user.role = role
  if (permissions) user.permissions = permissions
  if (typeof isActive !== "undefined") user.isActive = isActive

  await user.save()

  res.json({
    message: "Usuário atualizado com sucesso",
    user,
  })
}

/**
 * Deletar usuário
 */
export const deleteUser = async (req, res) => {
  const { userId } = req.params

  const user = await User.findOne({
    _id: userId,
    tenantId: req.tenant._id,
  })

  if (!user) {
    return res.status(404).json({ error: "Usuário não encontrado" })
  }

  // Não permitir deletar o próprio usuário
  if (user._id.toString() === req.user._id.toString()) {
    return res.status(403).json({
      error: "Você não pode deletar sua própria conta",
    })
  }

  await user.deleteOne()

  res.json({
    message: "Usuário deletado com sucesso",
  })
}

/**
 * Obter estatísticas do tenant
 */
export const getStats = async (req, res) => {
  const tenantId = req.tenant._id

  // Contar recursos em paralelo
  const [totalUsers, totalSessions, activeSessions, totalContacts, totalMessages, messagesThisMonth] =
    await Promise.all([
      User.countDocuments({ tenantId }),
      WhatsAppSession.countDocuments({ tenantId }),
      WhatsAppSession.countDocuments({ tenantId, status: "ready" }),
      Contact.countDocuments({ tenantId }),
      Message.countDocuments({ tenantId }),
      Message.countDocuments({
        tenantId,
        timestamp: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      }),
    ])

  res.json({
    stats: {
      users: {
        total: totalUsers,
        limit: req.tenant.planLimits.maxAgents,
      },
      whatsappSessions: {
        total: totalSessions,
        active: activeSessions,
        limit: req.tenant.planLimits.maxWhatsAppSessions,
      },
      contacts: {
        total: totalContacts,
        limit: req.tenant.planLimits.maxContacts,
      },
      messages: {
        total: totalMessages,
        thisMonth: messagesThisMonth,
        monthlyLimit: req.tenant.planLimits.maxMessagesPerMonth,
      },
    },
  })
}
