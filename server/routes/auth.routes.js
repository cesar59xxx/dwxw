import express from "express"
import { asyncHandler } from "../middleware/error.middleware.js"
import { authenticate } from "../middleware/auth.middleware.js"
import * as authController from "../controllers/auth.controller.js"

const router = express.Router()

// Registro de novo tenant (signup)
router.post("/register", asyncHandler(authController.register))

// Login
router.post("/login", asyncHandler(authController.login))

// Refresh token
router.post("/refresh", asyncHandler(authController.refreshToken))

// Logout
router.post("/logout", authenticate, asyncHandler(authController.logout))

// Verificar token atual
router.get("/me", authenticate, asyncHandler(authController.getCurrentUser))

// Atualizar perfil
router.patch("/profile", authenticate, asyncHandler(authController.updateProfile))

// Alterar senha
router.patch("/password", authenticate, asyncHandler(authController.changePassword))

export default router
