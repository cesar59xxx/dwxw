import { Contact } from "../models/contact.model.js"
import { Message } from "../models/message.model.js"
import { ChatbotFlow } from "../models/chatbot-flow.model.js"
import { whatsappManager } from "./whatsapp-manager.service.js"

/**
 * Executar fluxo de chatbot
 */
export const executeChatbotFlow = async (flow, contact, triggerMessage, sessionId, tenantId) => {
  console.log(`[Chatbot] Executando fluxo "${flow.name}" para contato ${contact.name}`)

  const startTime = Date.now()

  try {
    // Criar contexto de execução
    const context = {
      contact: contact.toObject(),
      variables: {},
      currentNodeId: flow.nodes[0]?.id,
    }

    // Executar nós do fluxo
    while (context.currentNodeId) {
      const node = flow.nodes.find((n) => n.id === context.currentNodeId)

      if (!node) {
        console.log("[Chatbot] Nó não encontrado, encerrando fluxo")
        break
      }

      console.log(`[Chatbot] Executando nó: ${node.type} (${node.id})`)

      // Processar nó
      const result = await processNode(node, context, contact, sessionId, tenantId)

      // Atualizar próximo nó
      context.currentNodeId = result.nextNodeId

      // Delay entre nós (opcional)
      if (node.data.delayMs) {
        await sleep(node.data.delayMs)
      }
    }

    // Atualizar estatísticas
    const completionTime = Date.now() - startTime
    await ChatbotFlow.findByIdAndUpdate(flow._id, {
      $inc: {
        "stats.totalExecutions": 1,
        "stats.totalCompletions": 1,
      },
      $set: {
        "stats.lastExecutedAt": new Date(),
        "stats.averageCompletionTime": completionTime,
      },
    })

    console.log(`[Chatbot] Fluxo concluído em ${completionTime}ms`)
  } catch (error) {
    console.error("[Chatbot] Erro ao executar fluxo:", error)

    // Incrementar apenas execuções (não completions)
    await ChatbotFlow.findByIdAndUpdate(flow._id, {
      $inc: { "stats.totalExecutions": 1 },
    })

    throw error
  }
}

/**
 * Processar um nó do fluxo
 */
async function processNode(node, context, contact, sessionId, tenantId) {
  switch (node.type) {
    case "message":
      return await processMessageNode(node, context, contact, sessionId, tenantId)

    case "question":
      return await processQuestionNode(node, context, contact, sessionId, tenantId)

    case "condition":
      return await processConditionNode(node, context)

    case "action":
      return await processActionNode(node, context, contact)

    case "delay":
      await sleep(node.data.delayMs || 1000)
      return { nextNodeId: node.nextNodeId }

    case "end":
      return { nextNodeId: null }

    default:
      console.log(`[Chatbot] Tipo de nó desconhecido: ${node.type}`)
      return { nextNodeId: null }
  }
}

/**
 * Processar nó de mensagem
 */
async function processMessageNode(node, context, contact, sessionId, tenantId) {
  const content = replaceVariables(node.data.content, context)

  try {
    // Enviar mensagem
    const sentMessage = await whatsappManager.sendMessage(sessionId, contact.whatsappId, { text: content }, "text")

    // Salvar no banco
    await Message.create({
      tenantId,
      contactId: contact._id,
      sessionId,
      whatsappMessageId: sentMessage.id._serialized,
      direction: "outbound",
      type: "text",
      content: { text: content },
      status: "sent",
      isFromBot: true,
      timestamp: new Date(),
    })

    return { nextNodeId: node.nextNodeId }
  } catch (error) {
    console.error("[Chatbot] Erro ao enviar mensagem:", error)
    throw error
  }
}

/**
 * Processar nó de pergunta
 */
async function processQuestionNode(node, context, contact, sessionId, tenantId) {
  const question = replaceVariables(node.data.question, context)

  // Enviar pergunta
  await whatsappManager.sendMessage(sessionId, contact.whatsappId, { text: question }, "text")

  // Se houver opções, enviar também
  if (node.data.options && node.data.options.length > 0) {
    const optionsText = node.data.options.map((opt, idx) => `${idx + 1}. ${opt.label}`).join("\n")

    await whatsappManager.sendMessage(sessionId, contact.whatsappId, { text: optionsText }, "text")
  }

  // Por enquanto, continuar para o próximo nó
  // Em uma implementação completa, aguardaria resposta do usuário
  return { nextNodeId: node.nextNodeId }
}

/**
 * Processar nó de condição
 */
async function processConditionNode(node, context) {
  const conditions = node.data.conditions || []

  for (const condition of conditions) {
    const fieldValue = getFieldValue(context, condition.field)

    if (evaluateCondition(fieldValue, condition.operator, condition.value)) {
      return { nextNodeId: condition.nextNodeId }
    }
  }

  // Nenhuma condição atendida, ir para próximo padrão
  return { nextNodeId: node.nextNodeId }
}

/**
 * Processar nó de ação
 */
async function processActionNode(node, context, contact) {
  const { action, params } = node.data

  switch (action) {
    case "update_pipeline_stage":
      await Contact.findByIdAndUpdate(contact._id, {
        pipelineStage: params.stage,
      })
      break

    case "add_tag":
      await Contact.findByIdAndUpdate(contact._id, {
        $addToSet: { tags: params.tag },
      })
      break

    case "remove_tag":
      await Contact.findByIdAndUpdate(contact._id, {
        $pull: { tags: params.tag },
      })
      break

    case "set_variable":
      context.variables[params.name] = params.value
      break

    default:
      console.log(`[Chatbot] Ação desconhecida: ${action}`)
  }

  return { nextNodeId: node.nextNodeId }
}

/**
 * Substituir variáveis no texto
 */
function replaceVariables(text, context) {
  if (!text) return ""

  let result = text

  // Substituir variáveis do contato: {{contact.name}}, {{contact.email}}
  result = result.replace(/\{\{contact\.(\w+)\}\}/g, (match, field) => {
    return context.contact[field] || match
  })

  // Substituir variáveis customizadas: {{variable_name}}
  result = result.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return context.variables[varName] || match
  })

  return result
}

/**
 * Obter valor de campo do contexto
 */
function getFieldValue(context, field) {
  if (field.startsWith("contact.")) {
    const contactField = field.replace("contact.", "")
    return context.contact[contactField]
  }

  if (field.startsWith("variable.")) {
    const varName = field.replace("variable.", "")
    return context.variables[varName]
  }

  return null
}

/**
 * Avaliar condição
 */
function evaluateCondition(fieldValue, operator, compareValue) {
  switch (operator) {
    case "equals":
      return fieldValue === compareValue
    case "not_equals":
      return fieldValue !== compareValue
    case "contains":
      return String(fieldValue).includes(compareValue)
    case "greater_than":
      return Number(fieldValue) > Number(compareValue)
    case "less_than":
      return Number(fieldValue) < Number(compareValue)
    default:
      return false
  }
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
