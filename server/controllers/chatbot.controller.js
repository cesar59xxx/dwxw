import { ChatbotFlow } from "../models/chatbot-flow.model.js"

/**
 * Listar fluxos do tenant
 */
export const getFlows = async (req, res) => {
  const flows = await ChatbotFlow.find({
    tenantId: req.tenant._id,
  }).sort({ createdAt: -1 })

  res.json({ flows })
}

/**
 * Criar novo fluxo
 */
export const createFlow = async (req, res) => {
  const { name, description, trigger, nodes, edges } = req.body

  const flow = await ChatbotFlow.create({
    tenantId: req.tenant._id,
    name,
    description,
    trigger,
    nodes: nodes || [],
    edges: edges || [],
    isActive: false,
  })

  res.status(201).json({
    message: "Fluxo criado com sucesso",
    flow,
  })
}

/**
 * Atualizar fluxo
 */
export const updateFlow = async (req, res) => {
  const { flowId } = req.params
  const updates = req.body

  const flow = await ChatbotFlow.findOneAndUpdate({ _id: flowId, tenantId: req.tenant._id }, updates, { new: true })

  if (!flow) {
    return res.status(404).json({ error: "Fluxo não encontrado" })
  }

  res.json({
    message: "Fluxo atualizado com sucesso",
    flow,
  })
}

/**
 * Deletar fluxo
 */
export const deleteFlow = async (req, res) => {
  const { flowId } = req.params

  const flow = await ChatbotFlow.findOneAndDelete({
    _id: flowId,
    tenantId: req.tenant._id,
  })

  if (!flow) {
    return res.status(404).json({ error: "Fluxo não encontrado" })
  }

  res.json({ message: "Fluxo deletado com sucesso" })
}

/**
 * Ativar/Desativar fluxo
 */
export const toggleFlow = async (req, res) => {
  const { flowId } = req.params

  const flow = await ChatbotFlow.findOne({
    _id: flowId,
    tenantId: req.tenant._id,
  })

  if (!flow) {
    return res.status(404).json({ error: "Fluxo não encontrado" })
  }

  flow.isActive = !flow.isActive
  await flow.save()

  res.json({
    message: `Fluxo ${flow.isActive ? "ativado" : "desativado"} com sucesso`,
    flow,
  })
}
