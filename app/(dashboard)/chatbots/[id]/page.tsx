"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import ReactFlow, {
  type Node,
  Controls,
  Background,
  type Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  MiniMap,
  Panel,
} from "reactflow"
import "reactflow/dist/style.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { ChevronLeft, Save, Play, Plus, Trash2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

const nodeTypes = {
  trigger: "Gatilho",
  message: "Mensagem",
  condition: "Condição",
  action: "Ação",
  delay: "Atraso",
}

export default function FlowEditorPage() {
  const params = useParams()
  const router = useRouter()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [showNodeEditor, setShowNodeEditor] = useState(false)
  const [flowName, setFlowName] = useState("Novo Fluxo")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (params.id && params.id !== "new") {
      loadFlow()
    }
  }, [params.id])

  const loadFlow = async () => {
    try {
      const response = await apiClient.get(`/chatbot/flows/${params.id}`)
      const flow = response.data
      setFlowName(flow.name)
      setNodes(flow.nodes || [])
      setEdges(flow.edges || [])
    } catch (error) {
      toast.error("Erro ao carregar fluxo")
    }
  }

  const onConnect = useCallback((connection: Connection) => setEdges((eds) => addEdge(connection, eds)), [setEdges])

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
    setShowNodeEditor(true)
  }, [])

  const addNode = (type: string) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type: "default",
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: nodeTypes[type as keyof typeof nodeTypes],
        type,
        config: getDefaultConfig(type),
      },
    }
    setNodes((nds) => [...nds, newNode])
  }

  const getDefaultConfig = (type: string) => {
    switch (type) {
      case "trigger":
        return { triggerType: "keyword", keywords: [], scheduleTime: "" }
      case "message":
        return { text: "", variables: [] }
      case "condition":
        return { field: "", operator: "equals", value: "" }
      case "action":
        return { actionType: "tag", tagName: "", pipelineStage: "" }
      case "delay":
        return { delayAmount: 1, delayUnit: "minutes" }
      default:
        return {}
    }
  }

  const updateNodeData = (nodeId: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, config: data } }
        }
        return node
      }),
    )
  }

  const deleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId))
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
    setShowNodeEditor(false)
  }

  const saveFlow = async () => {
    setSaving(true)
    try {
      const flowData = {
        name: flowName,
        nodes,
        edges,
        isActive: true,
      }

      if (params.id === "new") {
        await apiClient.post("/chatbot/flows", flowData)
        toast.success("Fluxo criado com sucesso")
      } else {
        await apiClient.put(`/chatbot/flows/${params.id}`, flowData)
        toast.success("Fluxo salvo com sucesso")
      }
      router.push("/chatbots")
    } catch (error) {
      toast.error("Erro ao salvar fluxo")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="flex items-center justify-between border-b bg-card px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/chatbots")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Input value={flowName} onChange={(e) => setFlowName(e.target.value)} className="max-w-xs" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled>
            <Play className="mr-2 h-4 w-4" />
            Testar
          </Button>
          <Button onClick={saveFlow} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r bg-card p-4">
          <h3 className="mb-4 font-semibold">Adicionar Bloco</h3>
          <div className="space-y-2">
            {Object.entries(nodeTypes).map(([key, label]) => (
              <Button
                key={key}
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => addNode(key)}
              >
                <Plus className="mr-2 h-4 w-4" />
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
            <Panel position="top-center">
              <Card className="px-4 py-2">
                <p className="text-sm text-muted-foreground">Arraste e conecte os blocos para criar seu fluxo</p>
              </Card>
            </Panel>
          </ReactFlow>
        </div>
      </div>

      <Dialog open={showNodeEditor} onOpenChange={setShowNodeEditor}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Bloco</DialogTitle>
          </DialogHeader>
          {selectedNode && (
            <NodeEditor
              node={selectedNode}
              onUpdate={(data) => updateNodeData(selectedNode.id, data)}
              onDelete={() => deleteNode(selectedNode.id)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NodeEditor({
  node,
  onUpdate,
  onDelete,
}: {
  node: Node
  onUpdate: (data: any) => void
  onDelete: () => void
}) {
  const [config, setConfig] = useState(node.data.config || {})

  const updateConfig = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    onUpdate(newConfig)
  }

  const renderEditor = () => {
    switch (node.data.type) {
      case "trigger":
        return (
          <div className="space-y-4">
            <div>
              <Label>Tipo de Gatilho</Label>
              <Select value={config.triggerType} onValueChange={(v) => updateConfig("triggerType", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keyword">Palavra-chave</SelectItem>
                  <SelectItem value="schedule">Agendamento</SelectItem>
                  <SelectItem value="pipeline">Etapa do Funil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {config.triggerType === "keyword" && (
              <div>
                <Label>Palavras-chave (uma por linha)</Label>
                <Textarea
                  value={config.keywords?.join("\n") || ""}
                  onChange={(e) => updateConfig("keywords", e.target.value.split("\n"))}
                  placeholder="oi&#10;olá&#10;bom dia"
                />
              </div>
            )}
          </div>
        )
      case "message":
        return (
          <div className="space-y-4">
            <div>
              <Label>Mensagem</Label>
              <Textarea
                value={config.text || ""}
                onChange={(e) => updateConfig("text", e.target.value)}
                placeholder="Olá {{nome}}, como posso ajudar?"
                rows={5}
              />
              <p className="mt-1 text-xs text-muted-foreground">Use variáveis: nome, telefone, email</p>
            </div>
          </div>
        )
      case "condition":
        return (
          <div className="space-y-4">
            <div>
              <Label>Campo</Label>
              <Select value={config.field} onValueChange={(v) => updateConfig("field", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pipelineStage">Etapa do Funil</SelectItem>
                  <SelectItem value="tags">Tags</SelectItem>
                  <SelectItem value="lastMessage">Última Mensagem</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Operador</Label>
              <Select value={config.operator} onValueChange={(v) => updateConfig("operator", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Igual a</SelectItem>
                  <SelectItem value="contains">Contém</SelectItem>
                  <SelectItem value="notEquals">Diferente de</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor</Label>
              <Input value={config.value || ""} onChange={(e) => updateConfig("value", e.target.value)} />
            </div>
          </div>
        )
      case "action":
        return (
          <div className="space-y-4">
            <div>
              <Label>Tipo de Ação</Label>
              <Select value={config.actionType} onValueChange={(v) => updateConfig("actionType", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tag">Adicionar Tag</SelectItem>
                  <SelectItem value="pipeline">Mover no Funil</SelectItem>
                  <SelectItem value="notify">Notificar Agente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {config.actionType === "tag" && (
              <div>
                <Label>Nome da Tag</Label>
                <Input value={config.tagName || ""} onChange={(e) => updateConfig("tagName", e.target.value)} />
              </div>
            )}
            {config.actionType === "pipeline" && (
              <div>
                <Label>Etapa do Funil</Label>
                <Select value={config.pipelineStage} onValueChange={(v) => updateConfig("pipelineStage", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="qualified">Qualificado</SelectItem>
                    <SelectItem value="proposal">Proposta</SelectItem>
                    <SelectItem value="negotiation">Negociação</SelectItem>
                    <SelectItem value="won">Ganho</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )
      case "delay":
        return (
          <div className="space-y-4">
            <div>
              <Label>Tempo de Espera</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={config.delayAmount || 1}
                  onChange={(e) => updateConfig("delayAmount", Number.parseInt(e.target.value))}
                  min={1}
                />
                <Select value={config.delayUnit} onValueChange={(v) => updateConfig("delayUnit", v)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minutos</SelectItem>
                    <SelectItem value="hours">Horas</SelectItem>
                    <SelectItem value="days">Dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )
      default:
        return <p>Selecione um tipo de bloco</p>
    }
  }

  return (
    <div className="space-y-4">
      {renderEditor()}
      <Button variant="destructive" onClick={onDelete} className="w-full">
        <Trash2 className="mr-2 h-4 w-4" />
        Excluir Bloco
      </Button>
    </div>
  )
}
