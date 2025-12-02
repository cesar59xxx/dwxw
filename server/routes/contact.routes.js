import express from "express"
import { asyncHandler } from "../middleware/error.middleware.js"
import { authenticate } from "../middleware/auth.middleware.js"
import * as contactController from "../controllers/contact.controller.js"

const router = express.Router()

router.use(authenticate)

// Listar contatos
router.get("/", asyncHandler(contactController.getContacts))

// Obter contato por ID
router.get("/:contactId", asyncHandler(contactController.getContact))

// Criar contato manualmente
router.post("/", asyncHandler(contactController.createContact))

// Atualizar contato
router.patch("/:contactId", asyncHandler(contactController.updateContact))

// Deletar contato
router.delete("/:contactId", asyncHandler(contactController.deleteContact))

// Adicionar nota
router.post("/:contactId/notes", asyncHandler(contactController.addNote))

// Exportar contatos (CSV)
router.get("/export/csv", asyncHandler(contactController.exportContacts))

export default router
