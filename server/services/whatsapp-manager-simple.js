import qrcode from "qrcode"
import { supabase } from "../config/supabase.js"

/**
 * WhatsAppManager Simplificado - Gera QR codes de teste
 * Use esta versão até o Chromium estar configurado no Railway
 */
class WhatsAppManagerSimple {
  constructor() {
    this.clients = new Map()
    this.initializing = new Map()
  }

  /**
   * Inicializar sessão com QR code de teste
   */
  async initializeSession(sessionId) {
    if (this.initializing.get(sessionId) || this.clients.has(sessionId)) {
      console.log(`[${sessionId}] Sessão já está ativa`)
      return
    }

    this.initializing.set(sessionId, true)

    try {
      console.log(`[${sessionId}] 🔄 Gerando QR code de teste...`)

      // Gerar QR code de teste
      const testQRData = `https://wa.me/${sessionId}-${Date.now()}`
      const qrCodeDataUrl = await qrcode.toDataURL(testQRData)

      // Atualizar no banco
      const { error } = await supabase
        .from("whatsapp_sessions")
        .update({
          status: "qr",
          qr_code: qrCodeDataUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("session_id", sessionId)

      if (error) {
        console.error(`[${sessionId}] ❌ Erro ao salvar QR:`, error)
        throw error
      }

      console.log(`[${sessionId}] ✅ QR code gerado com sucesso!`)

      // Marcar como cliente ativo
      this.clients.set(sessionId, { type: "test", sessionId })
      this.initializing.delete(sessionId)

      // Emitir via Socket.IO se disponível
      if (global.io) {
        global.io.emit("whatsapp:qr", {
          sessionId,
          qrCode: qrCodeDataUrl,
        })
      }

      // Simular conexão após 30 segundos (para teste)
      setTimeout(async () => {
        await this.simulateConnection(sessionId)
      }, 30000)
    } catch (error) {
      console.error(`[${sessionId}] ❌ Erro:`, error)
      this.initializing.delete(sessionId)

      await supabase
        .from("whatsapp_sessions")
        .update({
          status: "error",
          updated_at: new Date().toISOString(),
        })
        .eq("session_id", sessionId)

      throw error
    }
  }

  /**
   * Simular conexão bem-sucedida
   */
  async simulateConnection(sessionId) {
    try {
      await supabase
        .from("whatsapp_sessions")
        .update({
          status: "ready",
          qr_code: null,
          phone_number: "+5511999999999",
          last_connected: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("session_id", sessionId)

      if (global.io) {
        global.io.emit("whatsapp:ready", {
          sessionId,
          phoneNumber: "+5511999999999",
        })
      }

      console.log(`[${sessionId}] ✅ Simulação de conexão concluída`)
    } catch (error) {
      console.error(`[${sessionId}] Erro na simulação:`, error)
    }
  }

  /**
   * Desconectar sessão
   */
  async disconnectSession(sessionId) {
    this.clients.delete(sessionId)
    this.initializing.delete(sessionId)

    await supabase
      .from("whatsapp_sessions")
      .update({
        status: "disconnected",
        qr_code: null,
        updated_at: new Date().toISOString(),
      })
      .eq("session_id", sessionId)

    console.log(`[${sessionId}] ⚠️ Sessão desconectada`)
  }

  /**
   * Enviar mensagem (mock)
   */
  async sendMessage(sessionId, to, content) {
    const client = this.clients.get(sessionId)

    if (!client) {
      throw new Error("Sessão WhatsApp não está ativa")
    }

    console.log(`[${sessionId}] 📤 Mensagem enviada para ${to}:`, content)

    return {
      id: { _serialized: `mock-${Date.now()}` },
      body: content.text || content,
      to,
      timestamp: Date.now(),
    }
  }

  getClient(sessionId) {
    return this.clients.get(sessionId)
  }

  isSessionActive(sessionId) {
    return this.clients.has(sessionId)
  }
}

export const whatsappManager = new WhatsAppManagerSimple()
