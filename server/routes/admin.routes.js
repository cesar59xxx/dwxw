import express from "express"
import { asyncHandler } from "../middleware/error.middleware.js"
import { authenticate, authorize } from "../middleware/auth.middleware.js"
import * as adminController from "../controllers/admin.controller.js"

const router = express.Router()

// Apenas superadmin
router.use(authenticate)
router.use(authorize("superadmin"))

// Estatísticas do dashboard
router.get("/stats", asyncHandler(adminController.getDashboardStats))

// Listar todos os tenants com estatísticas
router.get("/tenants", asyncHandler(adminController.getTenantsWithStats))

// Obter detalhes de um tenant
router.get("/tenants/:tenantId", asyncHandler(adminController.getTenantDetails))

// Atualizar tenant
router.patch("/tenants/:tenantId", asyncHandler(adminController.updateTenant))

// Atualizar plano do tenant
router.put("/tenants/:tenantId/plan", asyncHandler(adminController.updateTenantPlan))

// Suspender/Reativar tenant
router.patch("/tenants/:tenantId/toggle", asyncHandler(adminController.toggleTenant))

// Listar todas as sessões
router.get("/sessions", asyncHandler(adminController.getAllSessions))

// Resetar sessão específica
router.post("/sessions/:sessionId/reset", asyncHandler(adminController.resetSession))

// Logs do sistema
router.get("/logs", asyncHandler(adminController.getSystemLogs))

// Estatísticas globais
router.get("/global-stats", asyncHandler(adminController.getGlobalStats))

export default router
