import express from "express"
import { asyncHandler } from "../middleware/error.middleware.js"
import { authenticate, authorize } from "../middleware/auth.middleware.js"
import * as tenantController from "../controllers/tenant.controller.js"

const router = express.Router()

// Todas as rotas requerem autenticação
router.use(authenticate)

// Obter informações do tenant atual
router.get("/current", asyncHandler(tenantController.getCurrentTenant))

// Atualizar configurações do tenant (apenas admin)
router.patch("/settings", authorize("admin"), asyncHandler(tenantController.updateSettings))

// Gerenciar usuários/agentes
router.get("/users", authorize("admin"), asyncHandler(tenantController.getUsers))
router.post("/users", authorize("admin"), asyncHandler(tenantController.createUser))
router.patch("/users/:userId", authorize("admin"), asyncHandler(tenantController.updateUser))
router.delete("/users/:userId", authorize("admin"), asyncHandler(tenantController.deleteUser))

// Obter estatísticas
router.get("/stats", asyncHandler(tenantController.getStats))

export default router
