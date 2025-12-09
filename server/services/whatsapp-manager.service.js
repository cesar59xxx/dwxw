import pkg from "whatsapp-web.js"
const { Client, LocalAuth } = pkg
import { supabase } from "../config/supabase.js"
import fs from "fs"

/**
 * WhatsAppManager - Gerenciador de múltiplas sessões WhatsApp
 * Cada sessão representa uma conexão WhatsApp Web independente
 */
class WhatsAppManager {
  constructor() {
    // Map para armazenar clientes ativos: sessionId -> Client
    this.clients = new Map()

    // Map para armazenar estados de inicialização
    this.initializing = new Map()
  }

  /**
   * Inicializar uma nova sessão WhatsApp
   */
  async initializeSession(sessionId) {
    // Verificar se já está inicializando ou ativo
    if (this.initializing.get(sessionId) || this.clients.has(sessionId)) {
      console.log(`[${sessionId}] Sessão já está ativa ou inicializando`)
      return
    }

    this.initializing.set(sessionId, true)

    try {
      console.log(`[${sessionId}] Inicializando sessão WhatsApp...`)

      // Criar diretório de sessões se não existir
      const sessionsPath = process.env.SESSIONS_PATH || "./whatsapp-sessions"
      if (!fs.existsSync(sessionsPath)) {
        fs.mkdirSync(sessionsPath, { recursive: true })
      }

      // Configurar estratégia de autenticação
      const authStrategy = new LocalAuth({
        clientId: sessionId,
        dataPath: sessionsPath,
      })

      const puppeteerConfig = {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--single-process",
          "--disable-gpu",
        ],
      }

      // Se estiver no Railway/produção, usar Chromium do sistema
      if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        puppeteerConfig.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH
        console.log(`[${sessionId}] Usando Chrome: ${process.env.PUPPETEER_EXECUTABLE_PATH}`)
      }

      // Criar cliente WhatsApp
      const client = new Client({
        authStrategy,
        puppeteer: puppeteerConfig,
        webVersionCache: {
          type: "remote",
          remotePath: "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
        },
      })

      // ========== EVENT HANDLERS ==========

      // QR Code gerado
      client.on("qr", async (qr) => {
        console.log(`[${sessionId}] 📱 QR Code gerado`)

        try {
          // Atualizar no banco com string QR original
          await supabase
            .from("whatsapp_sessions")
            .update({
              status: "qr",
              qr_code: qr, // String original sem conversão
              updated_at: new Date().toISOString(),
            })
            .eq("session_id", sessionId)

          // Emitir via Socket.IO apenas a string original
          if (global.io) {
            global.io.emit("whatsapp:qr", {
              sessionId,
              qr, // String original do QR
            })
          }

          console.log(`[${sessionId}] QR emitido via WebSocket`)
        } catch (error) {
          console.error(`[${sessionId}] Erro ao processar QR:`, error)
        }
      })

      // Autenticando
      client.on("authenticated", async () => {
        console.log(`[${sessionId}] ✅ Autenticado`)

        await supabase
          .from("whatsapp_sessions")
          .update({
            status: "authenticated",
            qr_code: null,
            updated_at: new Date().toISOString(),
          })
          .eq("session_id", sessionId)

        if (global.io) {
          global.io.emit("whatsapp:status", { sessionId, status: "authenticated" })
        }
      })

      // Falha na autenticação
      client.on("auth_failure", async (error) => {
        console.error(`[${sessionId}] ❌ Falha na autenticação:`, error)

        await supabase
          .from("whatsapp_sessions")
          .update({
            status: "error",
            qr_code: null,
            updated_at: new Date().toISOString(),
          })
          .eq("session_id", sessionId)

        if (global.io) {
          global.io.emit("whatsapp:auth_failure", {
            sessionId,
            error: error.message,
          })
        }
      })

      // Cliente pronto
      client.on("ready", async () => {
        console.log(`[${sessionId}] ✅ Cliente pronto!`)

        // Obter informações do WhatsApp
        const info = client.info

        await supabase
          .from("whatsapp_sessions")
          .update({
            status: "connected",
            phone_number: info.wid.user,
            updated_at: new Date().toISOString(),
          })
          .eq("session_id", sessionId)

        if (global.io) {
          global.io.emit("whatsapp:status", { sessionId, status: "connected", phoneNumber: info.wid.user })
        }
      })

      // Desconectado
      client.on("disconnected", async (reason) => {
        console.log(`[${sessionId}] ⚠️ Desconectado:`, reason)

        await supabase
          .from("whatsapp_sessions")
          .update({
            status: "disconnected",
            updated_at: new Date().toISOString(),
          })
          .eq("session_id", sessionId)

        // Remover cliente do Map
        this.clients.delete(sessionId)
        this.initializing.delete(sessionId)

        // Emitir via Socket.IO
        if (global.io) {
          global.io.emit("whatsapp:disconnected", { sessionId, reason })
        }

        // Tentar reconectar após 5 segundos
        setTimeout(() => {
          this.reconnectSession(sessionId)
        }, 5000)
      })

      // Nova mensagem recebida
      client.on("message", async (msg) => {
        try {
          console.log(`[${sessionId}] 📨 Message received from ${msg.from}`)

          const messageData = {
            sessionId,
            from: msg.from,
            to: msg.to || sessionId,
            body: msg.body,
            timestamp: msg.timestamp,
            direction: msg.fromMe ? "outgoing" : "incoming",
          }

          await this.saveMessage(sessionId, messageData)

          if (global.io) {
            global.io.emit("whatsapp:message", messageData)
          }
        } catch (error) {
          console.error(`[${sessionId}] Error handling message:`, error)
        }
      })

      // Mudança de estado da mensagem
      client.on("message_ack", async (msg, ack) => {
        try {
          await this.handleMessageAck(msg, ack, sessionId)
        } catch (error) {
          console.error(`[${sessionId}] Erro ao processar ACK:`, error)
        }
      })

      // Inicializar cliente
      await client.initialize()

      // Armazenar cliente no Map
      this.clients.set(sessionId, client)

      console.log(`[${sessionId}] ✅ Cliente armazenado`)
    } catch (error) {
      console.error(`[${sessionId}] ❌ Erro ao inicializar:`, error)

      await supabase
        .from("whatsapp_sessions")
        .update({
          status: "error",
          updated_at: new Date().toISOString(),
        })
        .eq("session_id", sessionId)

      this.initializing.delete(sessionId)
      throw error
    }
  }

  /**
   * Processar mensagem recebida
   */
  async handleIncomingMessage(msg, sessionId) {
    console.log(`[${sessionId}] Mensagem recebida de ${msg.from}`)

    // Obter ou criar contato
    const contact = await this.getOrCreateContact(msg, sessionId)

    // Determinar tipo da mensagem
    let messageType = "text"
    let content = { text: msg.body }

    if (msg.hasMedia) {
      const media = await msg.downloadMedia()
      messageType = media.mimetype.startsWith("image")
        ? "image"
        : media.mimetype.startsWith("video")
          ? "video"
          : media.mimetype.startsWith("audio")
            ? "audio"
            : "document"

      content = {
        text: msg.body,
        mediaUrl: `data:${media.mimetype};base64,${media.data}`,
        mimeType: media.mimetype,
        caption: msg.caption || msg.body,
        filename: media.filename,
      }
    }

    // Criar mensagem no banco
    const { data, error } = await supabase.from("messages").insert([
      {
        session_id: sessionId,
        contact_id: contact.id,
        whatsapp_message_id: msg.id._serialized,
        direction: "inbound",
        type: messageType,
        content: JSON.stringify(content),
        status: "delivered",
        timestamp: new Date(msg.timestamp * 1000).toISOString(),
      },
    ])

    if (error) {
      console.error(`[${sessionId}] Erro ao criar mensagem no banco:`, error)
      throw error
    }

    // Atualizar última interação do contato
    await supabase
      .from("contacts")
      .update({
        last_interaction: new Date().toISOString(),
        total_messages: contact.total_messages + 1,
      })
      .eq("id", contact.id)

    // Emitir mensagem via Socket.IO
    if (global.io) {
      global.io.emit("message:new", {
        message: data[0],
        contact: contact,
      })
    }

    // Adicionar à fila para processamento de chatbot
    // await messageQueue.add("process-message", {
    //   messageId: message._id,
    //   tenantId,
    //   contactId: contact._id,
    //   sessionId,
    // })
  }

  /**
   * Obter ou criar contato
   */
  async getOrCreateContact(msg, sessionId) {
    const whatsappId = msg.from
    const phoneNumber = whatsappId.split("@")[0]

    let { data: contactData, error: contactError } = await supabase
      .from("contacts")
      .select("*")
      .eq("whatsapp_id", whatsappId)
      .single()

    if (contactError || !contactData) {
      // Buscar informações do contato
      const client = this.clients.get(sessionId)
      const whatsappContact = await client.getContactById(whatsappId)

      const { data: newContactData, error: newContactError } = await supabase
        .from("contacts")
        .insert([
          {
            whatsapp_id: whatsappId,
            name: whatsappContact.pushname || whatsappContact.name || phoneNumber,
            phone_number: phoneNumber,
            avatar: await whatsappContact.getProfilePicUrl().catch(() => null),
            tenant_id: msg.from.split("@")[1], // Assuming tenant_id is part of the whatsappId
          },
        ])
        .select()

      if (newContactError) {
        console.error(`[${sessionId}] Erro ao criar novo contato:`, newContactError)
        throw newContactError
      }

      contactData = newContactData[0]
      console.log(`[${sessionId}] Novo contato criado: ${contactData.name}`)
    }

    return contactData
  }

  /**
   * Processar ACK (confirmação de entrega/leitura)
   */
  async handleMessageAck(msg, ack, sessionId) {
    const statusMap = {
      0: "pending",
      1: "sent",
      2: "delivered",
      3: "read",
      "-1": "failed",
    }

    const status = statusMap[ack] || "pending"

    await supabase.from("messages").update({ status }).eq("whatsapp_message_id", msg.id._serialized)
  }

  /**
   * Enviar mensagem
   */
  async sendMessage(sessionId, to, content) {
    const client = this.clients.get(sessionId)

    if (!client) {
      throw new Error("Sessão WhatsApp não está ativa")
    }

    let sentMessage

    try {
      if (content.type === "text") {
        sentMessage = await client.sendMessage(to, content.text)
      } else if (content.type === "image" || content.type === "video" || content.type === "document") {
        const media = new pkg.MessageMedia(content.mimeType, content.mediaData, content.filename)
        sentMessage = await client.sendMessage(to, media, {
          caption: content.caption,
        })
      }

      return sentMessage
    } catch (error) {
      console.error(`[${sessionId}] Erro ao enviar mensagem:`, error)
      throw error
    }
  }

  /**
   * Tentar reconectar sessão
   */
  async reconnectSession(sessionId) {
    const { data: sessionData, error: sessionError } = await supabase
      .from("whatsapp_sessions")
      .select("*")
      .eq("session_id", sessionId)
      .single()

    if (sessionError || !sessionData || !sessionData.is_active) {
      return
    }

    if (sessionData.reconnect_attempts >= sessionData.max_reconnect_attempts) {
      console.log(`[${sessionId}] Máximo de tentativas de reconexão atingido`)
      await supabase
        .from("whatsapp_sessions")
        .update({
          status: "error",
          updated_at: new Date().toISOString(),
        })
        .eq("session_id", sessionId)
      return
    }

    console.log(`[${sessionId}] Tentando reconectar... (tentativa ${sessionData.reconnect_attempts + 1})`)

    await supabase
      .from("whatsapp_sessions")
      .update({
        reconnect_attempts: sessionData.reconnect_attempts + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("session_id", sessionId)

    await this.initializeSession(sessionId)
  }

  /**
   * Desconectar sessão
   */
  async disconnectSession(sessionId) {
    const client = this.clients.get(sessionId)

    if (client) {
      await client.destroy()
      this.clients.delete(sessionId)
    }

    this.initializing.delete(sessionId)

    await supabase
      .from("whatsapp_sessions")
      .update({
        status: "disconnected",
        updated_at: new Date().toISOString(),
      })
      .eq("session_id", sessionId)
  }

  /**
   * Obter cliente ativo
   */
  getClient(sessionId) {
    return this.clients.get(sessionId)
  }

  /**
   * Verificar se sessão está ativa
   */
  isSessionActive(sessionId) {
    return this.clients.has(sessionId)
  }

  /**
   * Save message to database
   */
  async saveMessage(sessionId, messageData) {
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert([
          {
            session_id: sessionId,
            from_number: messageData.from,
            to_number: messageData.to,
            body: messageData.body,
            timestamp: new Date(messageData.timestamp * 1000).toISOString(),
            direction: messageData.direction,
            status: "delivered",
          },
        ])
        .select()
        .single()

      if (error) {
        console.error(`[${sessionId}] Error saving message:`, error)
        throw error
      }

      console.log(`[${sessionId}] ✅ Message saved to database`)
      return data
    } catch (error) {
      console.error(`[${sessionId}] Failed to save message:`, error)
      throw error
    }
  }
}

// Singleton
export const whatsappManager = new WhatsAppManager()
