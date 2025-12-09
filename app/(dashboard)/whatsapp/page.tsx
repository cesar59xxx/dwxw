"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Power, RefreshCw, Send, MessageCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { io, type Socket } from "socket.io-client"
import QRCode from "qrcode"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface Session {
  _id: string
  sessionId: string
  name: string
  phoneNumber?: string
  status: string
  qrCode?: string
  lastConnected?: string
  isConnected?: boolean
}

interface Message {
  id: string
  session_id: string
  from_number: string
  to_number: string
  body: string
  timestamp: string
  direction: "incoming" | "outgoing"
  status: string
}

export default function WhatsAppPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [newSessionName, setNewSessionName] = useState("")
  const [qrCodeDialog, setQrCodeDialog] = useState<{ open: boolean; qrCode: string | null; sessionId: string | null }>({
    open: false,
    qrCode: null,
    sessionId: null,
  })
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
    console.log("[v0] Connecting to WebSocket at:", backendUrl)

    const socketConnection = io(backendUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
    })

    socketConnection.on("connect", () => {
      console.log("[v0] ✅ WebSocket connected!")
    })

    socketConnection.on("whatsapp:qr", async ({ sessionId, qr }) => {
      console.log("[v0] 📱 Received QR string for session:", sessionId)

      if (!qr) return

      try {
        const qrImage = await QRCode.toDataURL(qr, {
          margin: 1,
          scale: 5,
          errorCorrectionLevel: "M",
          width: 300,
        })

        setSessions((prev) =>
          prev.map((s) => (s.sessionId === sessionId ? { ...s, qrCode: qrImage, status: "qr" } : s)),
        )

        setQrCodeDialog((prev) => {
          if (prev.sessionId === sessionId) {
            return { ...prev, qrCode: qrImage }
          }
          return prev
        })
      } catch (error) {
        console.error("[v0] ❌ Error generating QR image:", error)
      }
    })

    socketConnection.on("whatsapp:status", ({ sessionId, status, phoneNumber }) => {
      console.log("[v0] 📊 Status update:", sessionId, status)
      setSessions((prev) =>
        prev.map((s) =>
          s.sessionId === sessionId
            ? {
                ...s,
                status,
                isConnected: status === "connected",
                phoneNumber: phoneNumber || s.phoneNumber,
                qrCode: status === "connected" ? null : s.qrCode,
              }
            : s,
        ),
      )

      // Close QR dialog when connected
      if (status === "connected") {
        setQrCodeDialog((prev) =>
          prev.sessionId === sessionId ? { open: false, qrCode: null, sessionId: null } : prev,
        )
      }
    })

    socketConnection.on("whatsapp:message", (messageData) => {
      console.log("[v0] 💬 New message received:", messageData)

      // Only update if this is the selected session
      if (selectedSessionId && messageData.sessionId === selectedSessionId) {
        const newMsg: Message = {
          id: Date.now().toString(),
          session_id: messageData.sessionId,
          from_number: messageData.from,
          to_number: messageData.to,
          body: messageData.body,
          timestamp: new Date(messageData.timestamp * 1000).toISOString(),
          direction: messageData.direction,
          status: "delivered",
        }

        setMessages((prev) => ({
          ...prev,
          [messageData.sessionId]: [...(prev[messageData.sessionId] || []), newMsg],
        }))
      }
    })

    socketConnection.on("disconnect", () => {
      console.log("[v0] ⚠️ WebSocket disconnected")
    })

    setSocket(socketConnection)

    return () => {
      socketConnection.disconnect()
    }
  }, [selectedSessionId])

  const loadSessions = async () => {
    try {
      const data = await apiClient.getSessions()
      setSessions(data.sessions || [])
    } catch (error) {
      console.error("[v0] ❌ Failed to load sessions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMessages = async (sessionId: string) => {
    try {
      console.log("[v0] Loading messages for session:", sessionId)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/${sessionId}`)
      const data = await response.json()

      console.log("[v0] Messages loaded:", data.messages?.length || 0)

      setMessages((prev) => ({
        ...prev,
        [sessionId]: data.messages || [],
      }))
    } catch (error) {
      console.error("[v0] Failed to load messages:", error)
    }
  }

  useEffect(() => {
    loadSessions()
    const interval = setInterval(loadSessions, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedSessionId) {
      const session = sessions.find((s) => s.sessionId === selectedSessionId)
      if (session?.isConnected) {
        loadMessages(selectedSessionId)
      }
    }
  }, [selectedSessionId, sessions])

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) return

    try {
      const result = await apiClient.createSession({ name: newSessionName })
      setNewSessionName("")

      const closeButton = document.querySelector('[role="dialog"] button[type="button"]') as HTMLButtonElement
      if (closeButton) closeButton.click()

      await loadSessions()

      setTimeout(() => {
        setQrCodeDialog({
          open: true,
          qrCode: null,
          sessionId: result.session.sessionId,
        })
      }, 2000)
    } catch (error: any) {
      console.error("[v0] ❌ Error creating session:", error)
      alert(error.message || "Erro ao criar sessão")
    }
  }

  const handleConnectSession = async (sessionId: string) => {
    try {
      await apiClient.connectSession(sessionId)

      setQrCodeDialog({
        open: true,
        qrCode: null,
        sessionId,
      })

      await loadSessions()
    } catch (error: any) {
      console.error("[v0] Error connecting session:", error)
      alert(error.message || "Erro ao conectar sessão")
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedSessionId) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          to: "recipient@c.us", // This should be dynamic based on selected contact
          message: newMessage,
        }),
      })

      if (!response.ok) throw new Error("Failed to send message")

      setNewMessage("")
    } catch (error) {
      console.error("[v0] Failed to send message:", error)
      alert("Erro ao enviar mensagem")
    }
  }

  const getStatusBadge = (status: string, isConnected?: boolean) => {
    if (isConnected && status === "connected") {
      return <Badge className="bg-green-500">Conectado</Badge>
    }

    switch (status) {
      case "qr":
        return <Badge variant="secondary">Aguardando QR</Badge>
      case "authenticated":
        return <Badge className="bg-blue-500">Autenticando</Badge>
      case "connected":
        return <Badge className="bg-green-500">Conectado</Badge>
      case "disconnected":
        return <Badge variant="outline">Desconectado</Badge>
      case "error":
        return <Badge variant="destructive">Erro</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return <div>Carregando...</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Instâncias</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Sessão</DialogTitle>
                <DialogDescription>Dê um nome para identificar esta sessão WhatsApp</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input
                  placeholder="Ex: Atendimento Principal"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                />
                <Button onClick={handleCreateSession} className="w-full">
                  Criar Sessão
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-2">
            {sessions.map((session) => (
              <Card
                key={session._id}
                className={`cursor-pointer transition-colors ${
                  selectedSessionId === session.sessionId ? "border-primary" : ""
                }`}
                onClick={() => setSelectedSessionId(session.sessionId)}
              >
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{session.name}</CardTitle>
                    {getStatusBadge(session.status, session.isConnected)}
                  </div>
                  {session.phoneNumber && <CardDescription className="text-xs">+{session.phoneNumber}</CardDescription>}
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex gap-2">
                    {(!session.isConnected || session.status === "disconnected") && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleConnectSession(session.sessionId)
                        }}
                        className="flex-1 text-xs"
                      >
                        <Power className="h-3 w-3 mr-1" />
                        Conectar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="md:col-span-2">
        {!selectedSessionId ? (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Selecione uma instância para ver as mensagens</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>{sessions.find((s) => s.sessionId === selectedSessionId)?.name || "Chat"}</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[calc(100vh-20rem)] p-4">
                <div className="space-y-4">
                  {messages[selectedSessionId]?.length === 0 && (
                    <p className="text-center text-muted-foreground">Nenhuma mensagem ainda</p>
                  )}
                  {messages[selectedSessionId]?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === "outgoing" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.direction === "outgoing" ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{msg.body}</p>
                        <p className="text-xs opacity-70 mt-1">{new Date(msg.timestamp).toLocaleTimeString("pt-BR")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
            <Separator />
            <div className="p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite uma mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleSendMessage()
                  }}
                />
                <Button onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* QR Code Dialog */}
      <Dialog
        open={qrCodeDialog.open}
        onOpenChange={(open) => setQrCodeDialog({ open, qrCode: null, sessionId: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escaneie o QR Code</DialogTitle>
            <DialogDescription>Abra o WhatsApp no seu celular e escaneie este código</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-6">
            {qrCodeDialog.qrCode ? (
              <img
                src={qrCodeDialog.qrCode || "/placeholder.svg"}
                alt="WhatsApp QR Code"
                width={300}
                height={300}
                style={{
                  imageRendering: "pixelated",
                  objectFit: "contain",
                  maxWidth: "300px",
                  maxHeight: "300px",
                }}
              />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center bg-muted rounded">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
