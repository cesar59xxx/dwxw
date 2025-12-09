"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, QrCode, Power, Trash2, RefreshCw } from "lucide-react"
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

export default function WhatsAppPage() {
  const [sessions, setSessions] = useState<Session[]>([])
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
      console.log("[v0] QR string length:", qr?.length)

      try {
        const qrImage = await QRCode.toDataURL(qr, {
          margin: 1,
          scale: 5,
          errorCorrectionLevel: "M",
          width: 300,
        })

        console.log("[v0] QR image generated with perfect fidelity")

        setSessions((prev) =>
          prev.map((s) => (s.sessionId === sessionId ? { ...s, qrCode: qrImage, status: "qr" } : s)),
        )

        setQrCodeDialog((prev) => (prev.sessionId === sessionId ? { ...prev, qrCode: qrImage } : prev))
      } catch (error) {
        console.error("[v0] Error generating QR image:", error)
      }
    })

    socketConnection.on("whatsapp:authenticated", ({ sessionId }) => {
      console.log("[v0] ✅ Session authenticated:", sessionId)
      setSessions((prev) =>
        prev.map((s) => (s.sessionId === sessionId ? { ...s, status: "authenticated", qrCode: null } : s)),
      )
      setQrCodeDialog((prev) => (prev.sessionId === sessionId ? { open: false, qrCode: null, sessionId: null } : prev))
    })

    socketConnection.on("whatsapp:ready", ({ sessionId, phoneNumber }) => {
      console.log("[v0] ✅ Session ready:", sessionId, phoneNumber)
      setSessions((prev) =>
        prev.map((s) => (s.sessionId === sessionId ? { ...s, status: "ready", isConnected: true, phoneNumber } : s)),
      )
    })

    socketConnection.on("whatsapp:disconnected", ({ sessionId }) => {
      console.log("[v0] ⚠️ Session disconnected:", sessionId)
      setSessions((prev) =>
        prev.map((s) => (s.sessionId === sessionId ? { ...s, status: "disconnected", isConnected: false } : s)),
      )
    })

    socketConnection.on("disconnect", () => {
      console.log("[v0] ⚠️ WebSocket disconnected")
    })

    setSocket(socketConnection)

    return () => {
      socketConnection.disconnect()
    }
  }, [])

  const loadSessions = async () => {
    try {
      console.log("[v0] Loading sessions...")

      const data = await apiClient.getSessions()

      console.log("[v0] Sessions loaded:", data.sessions?.length || 0)

      setSessions(data.sessions || [])
    } catch (error) {
      console.error("[v0] ❌ Failed to load sessions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()

    const interval = setInterval(loadSessions, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) return

    try {
      console.log("[v0] Creating session with name:", newSessionName)
      const result = await apiClient.createSession({ name: newSessionName })
      console.log("[v0] Session created:", result)

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
      console.log("[v0] Connecting session:", sessionId)
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

  const handleDisconnectSession = async (sessionId: string) => {
    try {
      await apiClient.post(`/api/whatsapp/sessions/${sessionId}/disconnect`, {})
      await loadSessions()
    } catch (error: any) {
      alert(error.message || "Erro ao desconectar sessão")
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Tem certeza que deseja deletar esta sessão?")) return

    try {
      await apiClient.post(`/api/whatsapp/sessions/${sessionId}`, {})
      await loadSessions()
    } catch (error: any) {
      alert(error.message || "Erro ao deletar sessão")
    }
  }

  const getStatusBadge = (status: string, isConnected?: boolean) => {
    if (isConnected && status === "ready") {
      return <Badge className="bg-green-500">Conectado</Badge>
    }

    switch (status) {
      case "qr":
        return <Badge variant="secondary">Aguardando QR</Badge>
      case "authenticated":
        return <Badge className="bg-blue-500">Autenticando</Badge>
      case "ready":
        return <Badge className="bg-green-500">Pronto</Badge>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sessões WhatsApp</h1>
          <p className="text-muted-foreground">Gerencie suas conexões WhatsApp</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Sessão
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sessions.map((session) => (
          <Card key={session._id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{session.name}</CardTitle>
                {getStatusBadge(session.status, session.isConnected)}
              </div>
              <CardDescription>
                {session.phoneNumber ? <span>+{session.phoneNumber}</span> : <span>Não conectado</span>}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {(!session.isConnected || session.status === "disconnected") && (
                  <Button size="sm" onClick={() => handleConnectSession(session.sessionId)} className="flex-1">
                    <Power className="h-4 w-4 mr-2" />
                    Conectar
                  </Button>
                )}

                {session.isConnected && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDisconnectSession(session.sessionId)}
                    className="flex-1"
                  >
                    <Power className="h-4 w-4 mr-2" />
                    Desconectar
                  </Button>
                )}

                <Button size="sm" variant="destructive" onClick={() => handleDeleteSession(session.sessionId)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {session.lastConnected && (
                <p className="text-xs text-muted-foreground mt-3">
                  Última conexão: {new Date(session.lastConnected).toLocaleString("pt-BR")}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {sessions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <QrCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Nenhuma sessão criada</h3>
            <p className="text-muted-foreground mb-4">Crie sua primeira sessão WhatsApp para começar</p>
          </CardContent>
        </Card>
      )}

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
          <p className="text-sm text-muted-foreground text-center">
            {qrCodeDialog.qrCode ? "O QR Code expira em 60 segundos" : "Aguarde enquanto geramos seu QR Code"}
          </p>
        </DialogContent>
      </Dialog>
    </div>
  )
}
