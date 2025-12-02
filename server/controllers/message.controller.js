import { Message } from "../models/message.model.js"
import { Contact } from "../models/contact.model.js"

/**
 * Obter mensagens de um contato
 */
export const getContactMessages = async (req, res) => {
  const { contactId } = req.params
  const { limit = 50, before } = req.query

  // Verificar se contato pertence ao tenant
  const contact = await Contact.findOne({
    _id: contactId,
    tenantId: req.tenant._id,
  })

  if (!contact) {
    return res.status(404).json({ error: "Contato não encontrado" })
  }

  // Construir query
  const query = {
    tenantId: req.tenant._id,
    contactId,
  }

  if (before) {
    query.timestamp = { $lt: new Date(before) }
  }

  const messages = await Message.find(query)
    .sort({ timestamp: -1 })
    .limit(Number.parseInt(limit))
    .populate("sentBy", "name avatar")

  res.json({
    messages: messages.reverse(),
    hasMore: messages.length === Number.parseInt(limit),
  })
}

/**
 * Buscar mensagens
 */
export const searchMessages = async (req, res) => {
  const { q, contactId } = req.query

  const query = {
    tenantId: req.tenant._id,
    "content.text": { $regex: q, $options: "i" },
  }

  if (contactId) {
    query.contactId = contactId
  }

  const messages = await Message.find(query)
    .sort({ timestamp: -1 })
    .limit(50)
    .populate("contactId", "name phoneNumber")
    .populate("sentBy", "name")

  res.json({ messages })
}

/**
 * Marcar mensagem como lida
 */
export const markAsRead = async (req, res) => {
  const { messageId } = req.params

  const message = await Message.findOneAndUpdate(
    { _id: messageId, tenantId: req.tenant._id },
    { status: "read" },
    { new: true },
  )

  if (!message) {
    return res.status(404).json({ error: "Mensagem não encontrada" })
  }

  res.json({ message })
}
