"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Bot, Play, Pause, Edit, Trash2, Copy } from "lucide-react"

interface ChatbotFlow {
  _id: string
  name: string
  description: string
  isActive: boolean
  trigger: {
    type: string
  }
  stats: {
    totalExecutions: number
    totalCompletions: number
  }
}

export default function ChatbotsPage() {
  const [flows] = useState<ChatbotFlow[]>([])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chatbots</h1>
          <p className="text-muted-foreground">Automatize seu atendimento com fluxos inteligentes</p>
        </div>

        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Chatbot
        </Button>
      </div>

      {flows.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Nenhum chatbot criado</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Crie seu primeiro chatbot para automatizar respostas e qualificar leads automaticamente
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Chatbot
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {flows.map((flow) => (
            <Card key={flow._id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{flow.name}</CardTitle>
                  </div>
                  {flow.isActive ? (
                    <Badge className="bg-green-500">Ativo</Badge>
                  ) : (
                    <Badge variant="secondary">Inativo</Badge>
                  )}
                </div>
                <CardDescription>{flow.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Gatilho: </span>
                    <span className="font-medium capitalize">{flow.trigger.type.replace("_", " ")}</span>
                  </div>

                  <div className="flex gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Execuções</p>
                      <p className="font-semibold">{flow.stats.totalExecutions}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Conclusões</p>
                      <p className="font-semibold">{flow.stats.totalCompletions}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      {flow.isActive ? (
                        <>
                          <Pause className="h-3 w-3 mr-1" />
                          Pausar
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3 mr-1" />
                          Ativar
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Templates Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Templates Prontos</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Saudação Inicial</CardTitle>
              <CardDescription>Envie uma mensagem de boas-vindas para novos contatos</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full bg-transparent">
                Usar Template
              </Button>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Qualificação de Lead</CardTitle>
              <CardDescription>Faça perguntas para qualificar automaticamente seus leads</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full bg-transparent">
                Usar Template
              </Button>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">FAQ Automático</CardTitle>
              <CardDescription>Responda perguntas frequentes automaticamente</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full bg-transparent">
                Usar Template
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
