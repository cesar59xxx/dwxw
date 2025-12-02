import express from "express"
import { asyncHandler } from "../middleware/error.middleware.js"
import { authenticate, checkPermission } from "../middleware/auth.middleware.js"
import * as chatbotController from "../controllers/chatbot.controller.js"

const router = express.Router()

router.use(authenticate)

// Listar fluxos
router.get("/flows", asyncHandler(chatbotController.getFlows))

// Criar fluxo
router.post("/flows", checkPermission("manage_chatbots"), asyncHandler(chatbotController.createFlow))

// Atualizar fluxo
router.patch("/flows/:flowId", checkPermission("manage_chatbots"), asyncHandler(chatbotController.updateFlow))

// Deletar fluxo
router.delete("/flows/:flowId", checkPermission("manage_chatbots"), asyncHandler(chatbotController.deleteFlow))

// Ativar/Desativar fluxo
router.patch("/flows/:flowId/toggle", checkPermission("manage_chatbots"), asyncHandler(chatbotController.toggleFlow))

export default router
