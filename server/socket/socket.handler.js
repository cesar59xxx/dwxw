import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"

/**
 * Configurar Socket.IO para comunicação em tempo real
 */
export const setupSocketIO = (io) => {
  // Tornar IO global para uso em outros módulos
  global.io = io

  // Middleware de autenticação
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token

      if (!token) {
        return next(new Error("Token não fornecido"))
      }

      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.userId).populate("tenantId")

      if (!user || !user.isActive) {
        return next(new Error("Usuário não encontrado ou inativo"))
      }

      // Adicionar dados do usuário ao socket
      socket.userId = user._id.toString()
      socket.tenantId = user.tenantId._id.toString()
      socket.userData = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }

      next()
    } catch (error) {
      next(new Error("Autenticação falhou"))
    }
  })

  // Conexão estabelecida
  io.on("connection", (socket) => {
    console.log(`[Socket.IO] Cliente conectado: ${socket.id} (User: ${socket.userData.name})`)

    // Entrar na sala do tenant
    socket.join(`tenant:${socket.tenantId}`)
    console.log(`[Socket.IO] ${socket.userData.name} entrou na sala tenant:${socket.tenantId}`)

    // Notificar outros usuários
    socket.to(`tenant:${socket.tenantId}`).emit("user:online", {
      userId: socket.userId,
      userName: socket.userData.name,
    })

    // ========== EVENTOS DO CLIENTE ==========

    /**
     * Entrar em uma conversa específica
     */
    socket.on("conversation:join", (contactId) => {
      const room = `conversation:${contactId}`
      socket.join(room)
      console.log(`[Socket.IO] ${socket.userData.name} entrou em ${room}`)
    })

    /**
     * Sair de uma conversa
     */
    socket.on("conversation:leave", (contactId) => {
      const room = `conversation:${contactId}`
      socket.leave(room)
      console.log(`[Socket.IO] ${socket.userData.name} saiu de ${room}`)
    })

    /**
     * Notificar que está digitando
     */
    socket.on("typing:start", (contactId) => {
      socket.to(`conversation:${contactId}`).emit("user:typing", {
        userId: socket.userId,
        userName: socket.userData.name,
        contactId,
      })
    })

    /**
     * Notificar que parou de digitar
     */
    socket.on("typing:stop", (contactId) => {
      socket.to(`conversation:${contactId}`).emit("user:stopped-typing", {
        userId: socket.userId,
        contactId,
      })
    })

    /**
     * Marcar mensagem como lida
     */
    socket.on("message:read", (data) => {
      socket.to(`tenant:${socket.tenantId}`).emit("message:read", {
        messageId: data.messageId,
        contactId: data.contactId,
        readBy: socket.userId,
      })
    })

    /**
     * Desconexão
     */
    socket.on("disconnect", () => {
      console.log(`[Socket.IO] Cliente desconectado: ${socket.id}`)

      // Notificar outros usuários
      socket.to(`tenant:${socket.tenantId}`).emit("user:offline", {
        userId: socket.userId,
        userName: socket.userData.name,
      })
    })

    /**
     * Erro
     */
    socket.on("error", (error) => {
      console.error(`[Socket.IO] Erro no socket ${socket.id}:`, error)
    })
  })

  console.log("[Socket.IO] Configurado com sucesso")
}

/**
 * Emitir evento para tenant específico
 */
export const emitToTenant = (tenantId, event, data) => {
  if (global.io) {
    global.io.to(`tenant:${tenantId}`).emit(event, data)
  }
}

/**
 * Emitir evento para conversa específica
 */
export const emitToConversation = (contactId, event, data) => {
  if (global.io) {
    global.io.to(`conversation:${contactId}`).emit(event, data)
  }
}

/**
 * Emitir evento para usuário específico
 */
export const emitToUser = (userId, event, data) => {
  if (global.io) {
    const sockets = global.io.sockets.sockets
    for (const [socketId, socket] of sockets) {
      if (socket.userId === userId.toString()) {
        socket.emit(event, data)
      }
    }
  }
}
