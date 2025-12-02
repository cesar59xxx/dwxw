import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"
import { Tenant } from "../models/tenant.model.js"

/**
 * Middleware de autenticação JWT
 */
export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ error: "Token não fornecido" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId).select("+password")

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Usuário não encontrado ou inativo" })
    }

    // Verificar se o tenant está ativo
    const tenant = await Tenant.findById(user.tenantId)
    if (!tenant || !tenant.isActive) {
      return res.status(403).json({ error: "Conta suspensa ou inativa" })
    }

    req.user = user
    req.tenant = tenant
    next()
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Token inválido" })
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expirado" })
    }
    return res.status(500).json({ error: "Erro na autenticação" })
  }
}

/**
 * Middleware para verificar role/permissão
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Não autenticado" })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Sem permissão para acessar este recurso" })
    }

    next()
  }
}

/**
 * Middleware para verificar permissões específicas
 */
export const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Não autenticado" })
    }

    // Superadmin e admin têm todas as permissões
    if (req.user.role === "superadmin" || req.user.role === "admin") {
      return next()
    }

    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return res.status(403).json({
        error: `Permissão necessária: ${permission}`,
      })
    }

    next()
  }
}
