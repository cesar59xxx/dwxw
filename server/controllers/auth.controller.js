import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"
import { Tenant } from "../models/tenant.model.js"
import { redisClient } from "../config/redis.js"

/**
 * Gerar tokens JWT
 */
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "15m" })

  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  })

  return { accessToken, refreshToken }
}

/**
 * Registro de novo tenant + usuário admin
 */
export const register = async (req, res) => {
  const { tenantName, email, password, name } = req.body

  // Validações básicas
  if (!tenantName || !email || !password || !name) {
    return res.status(400).json({
      error: "Todos os campos são obrigatórios",
    })
  }

  // Verificar se o email já existe
  const existingUser = await User.findOne({ email })
  if (existingUser) {
    return res.status(409).json({
      error: "Email já cadastrado",
    })
  }

  // Criar tenant
  const tenant = await Tenant.create({
    name: tenantName,
    email,
    plan: "free",
    subscription: {
      status: "trial",
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 dias
    },
  })

  // Criar usuário admin do tenant
  const user = await User.create({
    tenantId: tenant._id,
    email,
    password,
    name,
    role: "admin",
    permissions: [
      "manage_users",
      "manage_contacts",
      "manage_whatsapp",
      "manage_chatbots",
      "view_analytics",
      "export_data",
      "manage_settings",
    ],
  })

  // Gerar tokens
  const tokens = generateTokens(user._id)

  // Armazenar refresh token no Redis
  await redisClient.set(
    `refresh_token:${user._id}`,
    tokens.refreshToken,
    7 * 24 * 60 * 60, // 7 dias
  )

  res.status(201).json({
    message: "Conta criada com sucesso",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: tenant._id,
      tenantName: tenant.name,
      plan: tenant.plan,
    },
    tokens,
  })
}

/**
 * Login
 */
export const login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({
      error: "Email e senha são obrigatórios",
    })
  }

  // Buscar usuário com senha
  const user = await User.findOne({ email }).select("+password")
  if (!user) {
    return res.status(401).json({
      error: "Credenciais inválidas",
    })
  }

  // Verificar senha
  const isPasswordValid = await user.comparePassword(password)
  if (!isPasswordValid) {
    return res.status(401).json({
      error: "Credenciais inválidas",
    })
  }

  // Verificar se usuário está ativo
  if (!user.isActive) {
    return res.status(403).json({
      error: "Usuário inativo",
    })
  }

  // Buscar informações do tenant
  const tenant = await Tenant.findById(user.tenantId)
  if (!tenant || !tenant.isActive) {
    return res.status(403).json({
      error: "Conta suspensa ou inativa",
    })
  }

  // Atualizar último login
  user.lastLogin = new Date()
  await user.save()

  // Gerar tokens
  const tokens = generateTokens(user._id)

  // Armazenar refresh token no Redis
  await redisClient.set(
    `refresh_token:${user._id}`,
    tokens.refreshToken,
    7 * 24 * 60 * 60, // 7 dias
  )

  res.json({
    message: "Login realizado com sucesso",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      tenantId: tenant._id,
      tenantName: tenant.name,
      plan: tenant.plan,
      planLimits: tenant.planLimits,
    },
    tokens,
  })
}

/**
 * Refresh token
 */
export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body

  if (!refreshToken) {
    return res.status(400).json({
      error: "Refresh token não fornecido",
    })
  }

  try {
    // Verificar refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)

    // Verificar se o token existe no Redis
    const storedToken = await redisClient.get(`refresh_token:${decoded.userId}`)
    if (storedToken !== refreshToken) {
      return res.status(401).json({
        error: "Refresh token inválido",
      })
    }

    // Buscar usuário
    const user = await User.findById(decoded.userId)
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: "Usuário não encontrado ou inativo",
      })
    }

    // Gerar novos tokens
    const tokens = generateTokens(user._id)

    // Atualizar refresh token no Redis
    await redisClient.set(`refresh_token:${user._id}`, tokens.refreshToken, 7 * 24 * 60 * 60)

    res.json({
      message: "Token renovado com sucesso",
      tokens,
    })
  } catch (error) {
    return res.status(401).json({
      error: "Refresh token inválido ou expirado",
    })
  }
}

/**
 * Logout
 */
export const logout = async (req, res) => {
  // Remover refresh token do Redis
  await redisClient.del(`refresh_token:${req.user._id}`)

  res.json({
    message: "Logout realizado com sucesso",
  })
}

/**
 * Obter usuário atual
 */
export const getCurrentUser = async (req, res) => {
  const user = await User.findById(req.user._id).populate("tenantId")

  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      permissions: user.permissions,
      tenantId: user.tenantId._id,
      tenantName: user.tenantId.name,
      plan: user.tenantId.plan,
      planLimits: user.tenantId.planLimits,
      lastLogin: user.lastLogin,
    },
  })
}

/**
 * Atualizar perfil
 */
export const updateProfile = async (req, res) => {
  const { name, avatar } = req.body

  const user = await User.findById(req.user._id)

  if (name) user.name = name
  if (avatar) user.avatar = avatar

  await user.save()

  res.json({
    message: "Perfil atualizado com sucesso",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    },
  })
}

/**
 * Alterar senha
 */
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      error: "Senha atual e nova senha são obrigatórias",
    })
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      error: "Nova senha deve ter no mínimo 6 caracteres",
    })
  }

  const user = await User.findById(req.user._id).select("+password")

  // Verificar senha atual
  const isPasswordValid = await user.comparePassword(currentPassword)
  if (!isPasswordValid) {
    return res.status(401).json({
      error: "Senha atual incorreta",
    })
  }

  // Atualizar senha
  user.password = newPassword
  await user.save()

  // Invalidar todos os refresh tokens
  await redisClient.del(`refresh_token:${user._id}`)

  res.json({
    message: "Senha alterada com sucesso. Faça login novamente.",
  })
}
