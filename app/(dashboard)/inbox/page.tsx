"use client"

import { useEffect, useState } from "react"
import { apiClient, socketClient } from "@/lib/api-client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, Send, Paperclip, MoreVertical, Phone, Video, Archive } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Contact {
  _id: string
  name: string
  phoneNumber: string
  avatar?: string
  lastInteraction?: string
  pipelineStage: string
  tags: string[]
  unreadCount?: number
}

interface Message {
  _id: string
  content: {
    text?: string
    mediaUrl?: string
    caption?: string
  }
  direction: "inbound" | "outbound"
  type: string
  timestamp: string
  status: string
  sentBy?: any
}

export default function InboxPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)

  // Carregar contatos
  useEffect(() => {
    async function loadContacts() {
      try {
        const data = await apiClient.getContacts({ limit: 100 })
        setContacts(data.contacts)
      } catch (error) {
        console.error("Failed to load contacts:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadContacts()
  }, [])

  // Carregar mensagens do contato selecionado
  useEffect(() => {
    if (!selectedContact) return

    async function loadMessages() {
      try {
        const data = await apiClient.getContact(selectedContact._id)
        setMessages(data.recentMessages || [])
      } catch (error) {
        console.error("Failed to load messages:", error)
      }
    }

    loadMessages()

    // Entrar na sala da conversa via Socket.IO
    const socket = socketClient.getSocket()
    if (socket) {
      socket.emit("conversation:join", selectedContact._id)

      return () => {
        socket.emit("conversation:leave", selectedContact._id)
      }
    }
  }, [selectedContact])

  // Socket.IO - Escutar novas mensagens
  useEffect(() => {
    const socket = socketClient.getSocket()
    if (!socket) return

    const handleNewMessage = (data: any) => {
      if (selectedContact && data.contact._id === selectedContact._id) {
        setMessages((prev) => [...prev, data.message])
      }

      // Atualizar último contato na lista
      setContacts((prev) =>
        prev.map((c) => (c._id === data.contact._id ? { ...c, lastInteraction: data.message.timestamp } : c)),
      )
    }

    socket.on("message:new", handleNewMessage)

    return () => {
      socket.off("message:new", handleNewMessage)
    }
  }, [selectedContact])

  // Enviar mensagem
  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedContact) return

    setIsSending(true)

    try {
      // Obter sessão ativa (simplificado - em produção, verificar qual sessão usar)
      const sessionsData = await apiClient.getSessions()
      const activeSession = sessionsData.sessions.find((s: any) => s.status === "ready")

      if (!activeSession) {
        alert("Nenhuma sessão WhatsApp ativa. Conecte uma sessão primeiro.")
        return
      }

      await apiClient.sendMessage({
        sessionId: activeSession.sessionId,
        contactId: selectedContact._id,
        content: { text: messageText },
        type: "text",
      })

      setMessageText("")
    } catch (error: any) {
      console.error("Failed to send message:", error)
      alert(error.message || "Erro ao enviar mensagem")
    } finally {
      setIsSending(false)
    }
  }

  // Filtrar contatos por busca
  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) || contact.phoneNumber.includes(searchQuery),
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4">
      {/* Lista de Contatos */}
      <div className="w-80 bg-card border border-border rounded-lg flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold mb-3">Conversas</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contatos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Lista */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredContacts.map((contact) => (
              <button
                key={contact._id}
                onClick={() => setSelectedContact(contact)}
                className={`
                  w-full p-3 rounded-lg text-left transition-colors
                  ${selectedContact?._id === contact._id ? "bg-primary text-primary-foreground" : "hover:bg-accent"}
                `}
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={contact.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{contact.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium truncate">{contact.name}</p>
                      {contact.lastInteraction && (
                        <span className="text-xs opacity-70">
                          {formatDistanceToNow(new Date(contact.lastInteraction), {
                            locale: ptBR,
                            addSuffix: false,
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm opacity-70 truncate">{contact.phoneNumber}</p>
                      {contact.unreadCount && contact.unreadCount > 0 && (
                        <Badge variant="destructive" className="h-5 min-w-5 px-1 text-xs">
                          {contact.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}

            {filteredContacts.length === 0 && (
              <div className="text-center text-muted-foreground p-8">Nenhum contato encontrado</div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Área de Chat */}
      {selectedContact ? (
        <div className="flex-1 bg-card border border-border rounded-lg flex flex-col">
          {/* Header do Chat */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={selectedContact.avatar || "/placeholder.svg"} />
                <AvatarFallback>{selectedContact.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{selectedContact.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedContact.phoneNumber}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Archive className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Mensagens */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => {
                const isOutbound = message.direction === "outbound"

                return (
                  <div key={message._id} className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`
                        max-w-[70%] rounded-lg p-3
                        ${isOutbound ? "bg-primary text-primary-foreground" : "bg-muted"}
                      `}
                    >
                      {message.content.mediaUrl && (
                        <div className="mb-2">
                          {message.type === "image" ? (
                            <img
                              src={message.content.mediaUrl || "/placeholder.svg"}
                              alt="Media"
                              className="rounded max-w-full"
                            />
                          ) : message.type === "video" ? (
                            <video src={message.content.mediaUrl} controls className="rounded max-w-full" />
                          ) : message.type === "audio" ? (
                            <audio src={message.content.mediaUrl} controls className="max-w-full" />
                          ) : (
                            <a
                              href={message.content.mediaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm underline"
                            >
                              Baixar arquivo
                            </a>
                          )}
                        </div>
                      )}

                      {message.content.text && (
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content.text}</p>
                      )}

                      <div className="flex items-center justify-end gap-2 mt-1">
                        <span className={`text-xs ${isOutbound ? "opacity-70" : "text-muted-foreground"}`}>
                          {new Date(message.timestamp).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}

              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">Nenhuma mensagem ainda. Inicie a conversa!</div>
              )}
            </div>
          </ScrollArea>

          {/* Input de Mensagem */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Paperclip className="h-5 w-5" />
              </Button>

              <Input
                placeholder="Digite uma mensagem..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                disabled={isSending}
              />

              <Button onClick={handleSendMessage} disabled={isSending || !messageText.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-card border border-border rounded-lg flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">Selecione uma conversa</p>
            <p className="text-sm">Escolha um contato para começar a conversar</p>
          </div>
        </div>
      )}
    </div>
  )
}
