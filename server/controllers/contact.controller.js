import { Contact } from "../models/contact.model.js"
import { Message } from "../models/message.model.js"

/**
 * Listar contatos com filtros e paginação
 */
export const getContacts = async (req, res) => {
  const { page = 1, limit = 20, search, tags, pipelineStage, assignedTo } = req.query

  // Construir filtros
  const filters = { tenantId: req.tenant._id }

  if (search) {
    filters.$or = [
      { name: { $regex: search, $options: "i" } },
      { phoneNumber: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ]
  }

  if (tags) {
    filters.tags = { $in: tags.split(",") }
  }

  if (pipelineStage) {
    filters.pipelineStage = pipelineStage
  }

  if (assignedTo) {
    filters.assignedTo = assignedTo
  }

  // Executar query com paginação
  const skip = (page - 1) * limit

  const [contacts, total] = await Promise.all([
    Contact.find(filters)
      .populate("assignedTo", "name email avatar")
      .sort({ lastInteraction: -1 })
      .skip(skip)
      .limit(Number.parseInt(limit)),
    Contact.countDocuments(filters),
  ])

  res.json({
    contacts,
    pagination: {
      page: Number.parseInt(page),
      limit: Number.parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  })
}

/**
 * Obter contato por ID
 */
export const getContact = async (req, res) => {
  const { contactId } = req.params

  const contact = await Contact.findOne({
    _id: contactId,
    tenantId: req.tenant._id,
  }).populate("assignedTo", "name email avatar")

  if (!contact) {
    return res.status(404).json({ error: "Contato não encontrado" })
  }

  // Buscar últimas mensagens
  const recentMessages = await Message.find({
    contactId: contact._id,
  })
    .sort({ timestamp: -1 })
    .limit(50)
    .populate("sentBy", "name")

  res.json({
    contact,
    recentMessages: recentMessages.reverse(),
  })
}

/**
 * Criar contato manualmente
 */
export const createContact = async (req, res) => {
  const { name, phoneNumber, email, tags, pipelineStage } = req.body

  if (!name || !phoneNumber) {
    return res.status(400).json({
      error: "Nome e telefone são obrigatórios",
    })
  }

  const whatsappId = `${phoneNumber}@c.us`

  const contact = await Contact.create({
    tenantId: req.tenant._id,
    whatsappId,
    name,
    phoneNumber,
    email,
    tags: tags || [],
    pipelineStage: pipelineStage || "new",
  })

  res.status(201).json({
    message: "Contato criado com sucesso",
    contact,
  })
}

/**
 * Atualizar contato
 */
export const updateContact = async (req, res) => {
  const { contactId } = req.params
  const { name, email, tags, pipelineStage, assignedTo, customFields } = req.body

  const contact = await Contact.findOne({
    _id: contactId,
    tenantId: req.tenant._id,
  })

  if (!contact) {
    return res.status(404).json({ error: "Contato não encontrado" })
  }

  if (name) contact.name = name
  if (email) contact.email = email
  if (tags) contact.tags = tags
  if (pipelineStage) contact.pipelineStage = pipelineStage
  if (assignedTo) contact.assignedTo = assignedTo
  if (customFields) contact.customFields = customFields

  await contact.save()

  res.json({
    message: "Contato atualizado com sucesso",
    contact,
  })
}

/**
 * Deletar contato
 */
export const deleteContact = async (req, res) => {
  const { contactId } = req.params

  const contact = await Contact.findOne({
    _id: contactId,
    tenantId: req.tenant._id,
  })

  if (!contact) {
    return res.status(404).json({ error: "Contato não encontrado" })
  }

  await contact.deleteOne()

  res.json({ message: "Contato deletado com sucesso" })
}

/**
 * Adicionar nota
 */
export const addNote = async (req, res) => {
  const { contactId } = req.params
  const { content } = req.body

  if (!content) {
    return res.status(400).json({ error: "Conteúdo da nota é obrigatório" })
  }

  const contact = await Contact.findOne({
    _id: contactId,
    tenantId: req.tenant._id,
  })

  if (!contact) {
    return res.status(404).json({ error: "Contato não encontrado" })
  }

  contact.notes.push({
    content,
    createdBy: req.user._id,
    createdAt: new Date(),
  })

  await contact.save()

  res.json({
    message: "Nota adicionada com sucesso",
    contact,
  })
}

/**
 * Exportar contatos (CSV)
 */
export const exportContacts = async (req, res) => {
  const contacts = await Contact.find({
    tenantId: req.tenant._id,
  }).populate("assignedTo", "name")

  // Gerar CSV
  const csv = [
    ["Nome", "Telefone", "Email", "Tags", "Etapa", "Responsável", "Última Interação"].join(","),
    ...contacts.map((c) =>
      [
        c.name,
        c.phoneNumber,
        c.email || "",
        c.tags.join(";"),
        c.pipelineStage,
        c.assignedTo?.name || "",
        c.lastInteraction?.toISOString() || "",
      ].join(","),
    ),
  ].join("\n")

  res.setHeader("Content-Type", "text/csv")
  res.setHeader("Content-Disposition", "attachment; filename=contacts.csv")
  res.send(csv)
}
