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
  const [qrCodeDialog, setQrCodeDialog] = useState<{ open: boolean; qrCode: string | null }>({
    open: false,
    qrCode: null,
  })

  const loadSessions = async () => {
    try {
      console.log("[v0] ========================================")
      console.log("[v0] Loading sessions...")
      console.log("[v0] API URL:", process.env.NEXT_PUBLIC_API_URL)

      const data = await apiClient.getSessions()

      console.log("[v0] Full response:", JSON.stringify(data, null, 2))
      console.log("[v0] Sessions array:", data.sessions)
      console.log("[v0] Sessions type:", typeof data.sessions)
      console.log("[v0] Is Array?:", Array.isArray(data.sessions))
      console.log("[v0] Sessions length:", data.sessions?.length)

      if (data.sessions && data.sessions.length > 0) {
        console.log("[v0] ✅ Found sessions:", data.sessions.length)
        data.sessions.forEach((session, index) => {
          console.log(`[v0] Session ${index}:`, session)
        })
      } else {
        console.log("[v0] ⚠️ No sessions found in response")
      }
      console.log("[v0] ========================================")

      setSessions(data.sessions || [])
    } catch (error) {
      console.error("[v0] ❌ Failed to load sessions:", error)
      console.error("[v0] Error details:", error.message)
      console.error("[v0] Error stack:", error.stack)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()

    // Atualizar a cada 5 segundos
    const interval = setInterval(loadSessions, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) return

    try {
      console.log("[v0] ========================================")
      console.log("[v0] Creating session with name:", newSessionName)
      const result = await apiClient.createSession({ name: newSessionName })
      console.log("[v0] Session create response:", JSON.stringify(result, null, 2))
      console.log("[v0] ========================================")

      setNewSessionName("")

      // Fechar o dialog
      const closeButton = document.querySelector('[role="dialog"] button[type="button"]')
      if (closeButton) closeButton.click()

      // Recarregar sessões imediatamente
      await loadSessions()

      alert("Sessão criada com sucesso! Aguarde a conexão...")
    } catch (error: any) {
      console.error("[v0] ❌ Error creating session:", error)
      console.error("[v0] Error message:", error.message)
      alert(error.message || "Erro ao criar sessão")
    }
  }

  const handleConnectSession = async (sessionId: string) => {
    try {
      console.log("[v0] Connecting session:", sessionId)
      await apiClient.connectSession(sessionId)

      setTimeout(async () => {
        console.log("[v0] Fetching QR code for session:", sessionId)
        const data = await apiClient.get(`/api/whatsapp/sessions/${sessionId}/qr`)
        console.log("[v0] QR code data:", data)
        if (data.qrCode) {
          setQrCodeDialog({ open: true, qrCode: data.qrCode })
        } else {
          console.log("[v0] No QR code yet, keep refreshing...")
        }
        // Atualizar lista de sessões
        await loadSessions()
      }, 5000)
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

      {/* QR Code Dialog */}
      <Dialog open={qrCodeDialog.open} onOpenChange={(open) => setQrCodeDialog({ open, qrCode: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escaneie o QR Code</DialogTitle>
            <DialogDescription>Abra o WhatsApp no seu celular e escaneie este código</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-6">
            {qrCodeDialog.qrCode ? (
              <img src={qrCodeDialog.qrCode || "/placeholder.svg"} alt="QR Code" className="w-64 h-64" />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center bg-muted rounded">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground text-center">O QR Code expira em 60 segundos</p>
        </DialogContent>
      </Dialog>
    </div>
  )
}
