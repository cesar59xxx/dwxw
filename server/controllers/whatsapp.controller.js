import { whatsappManager } from "../services/whatsapp-manager.service.js"
import { supabase } from "../config/supabase.js"
import { v4 as uuidv4 } from "uuid"

export const getSessions = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("whatsapp_sessions")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    const sessionsWithStatus = (data || []).map((session) => ({
      ...session,
      isConnected: whatsappManager.isSessionActive(session.session_id),
    }))

    res.json({
      sessions: sessionsWithStatus,
      total: sessionsWithStatus.length,
    })
  } catch (error) {
    console.error("Erro ao buscar sessões:", error)
    res.status(500).json({ error: error.message })
  }
}

export const createSession = async (req, res) => {
  try {
    const { name } = req.body

    if (!name) {
      return res.status(400).json({ error: "Nome da sessão é obrigatório" })
    }

    const sessionId = uuidv4()

    const { data, error } = await supabase
      .from("whatsapp_sessions")
      .insert({
        session_id: sessionId,
        name,
        status: "disconnected",
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({
      message: "Sessão criada com sucesso",
      session: data,
    })
  } catch (error) {
    console.error("Erro ao criar sessão:", error)
    res.status(500).json({ error: error.message })
  }
}

export const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params

    const { data, error } = await supabase.from("whatsapp_sessions").select("*").eq("session_id", sessionId).single()

    if (error) throw error

    if (!data) {
      return res.status(404).json({ error: "Sessão não encontrada" })
    }

    res.json({
      session: {
        ...data,
        isConnected: whatsappManager.isSessionActive(sessionId),
      },
    })
  } catch (error) {
    console.error("Erro ao buscar sessão:", error)
    res.status(500).json({ error: error.message })
  }
}

export const connectSession = async (req, res) => {
  try {
    const { sessionId } = req.params

    console.log(`[${sessionId}] Iniciando conexão WhatsApp...`)

    // Verificar se sessão existe
    const { data: session, error: sessionError } = await supabase
      .from("whatsapp_sessions")
      .select("*")
      .eq("session_id", sessionId)
      .single()

    if (sessionError || !session) {
      return res.status(404).json({ error: "Sessão não encontrada" })
    }

    // Verificar se já está conectada
    if (whatsappManager.isSessionActive(sessionId)) {
      return res.status(400).json({ error: "Sessão já está conectada" })
    }

    // Inicializar sessão de forma assíncrona
    whatsappManager.initializeSession(sessionId).catch((error) => {
      console.error(`[${sessionId}] Erro ao inicializar:`, error)
    })

    res.json({
      message: "Conexão iniciada. Aguarde o QR Code.",
      sessionId,
    })
  } catch (error) {
    console.error("Erro ao conectar sessão:", error)
    res.status(500).json({ error: error.message })
  }
}

export const disconnectSession = async (req, res) => {
  try {
    const { sessionId } = req.params

    await whatsappManager.disconnectSession(sessionId)

    res.json({
      message: "Sessão desconectada com sucesso",
    })
  } catch (error) {
    console.error("Erro ao desconectar sessão:", error)
    res.status(500).json({ error: error.message })
  }
}

export const deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params

    // Desconectar se estiver ativa
    if (whatsappManager.isSessionActive(sessionId)) {
      await whatsappManager.disconnectSession(sessionId)
    }

    // Deletar do banco
    const { error } = await supabase.from("whatsapp_sessions").delete().eq("session_id", sessionId)

    if (error) throw error

    res.json({
      message: "Sessão deletada com sucesso",
    })
  } catch (error) {
    console.error("Erro ao deletar sessão:", error)
    res.status(500).json({ error: error.message })
  }
}

export const sendMessage = async (req, res) => {
  try {
    const { sessionId, to, message } = req.body

    if (!sessionId || !to || !message) {
      return res.status(400).json({
        error: "sessionId, to e message são obrigatórios",
      })
    }

    // Verificar se sessão está ativa
    if (!whatsappManager.isSessionActive(sessionId)) {
      return res.status(400).json({
        error: "Sessão WhatsApp não está conectada",
      })
    }

    const result = await whatsappManager.sendMessage(sessionId, to, {
      text: message,
    })

    res.json({
      message: "Mensagem enviada com sucesso",
      result,
    })
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error)
    res.status(500).json({ error: error.message })
  }
}

export const getQRCode = async (req, res) => {
  try {
    const { sessionId } = req.params

    const { data, error } = await supabase
      .from("whatsapp_sessions")
      .select("qr_code")
      .eq("session_id", sessionId)
      .single()

    if (error) throw error

    if (!data || !data.qr_code) {
      return res.status(404).json({ error: "QR Code não disponível" })
    }

    res.json({
      qrCode: data.qr_code,
    })
  } catch (error) {
    console.error("Erro ao buscar QR Code:", error)
    res.status(500).json({ error: error.message })
  }
}
