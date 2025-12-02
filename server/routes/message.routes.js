import express from "express"
import { asyncHandler } from "../middleware/error.middleware.js"
import { authenticate } from "../middleware/auth.middleware.js"
import * as messageController from "../controllers/message.controller.js"

const router = express.Router()

router.use(authenticate)

// Obter mensagens de um contato
router.get("/contact/:contactId", asyncHandler(messageController.getContactMessages))

// Buscar mensagens
router.get("/search", asyncHandler(messageController.searchMessages))

// Marcar como lida
router.patch("/:messageId/read", asyncHandler(messageController.markAsRead))

export default router
