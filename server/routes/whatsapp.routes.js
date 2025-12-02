import express from "express"
import * as whatsappController from "../controllers/whatsapp.controller.js"

const router = express.Router()

router.get("/sessions", whatsappController.getSessions)
router.post("/sessions", whatsappController.createSession)
router.get("/sessions/:sessionId", whatsappController.getSession)
router.post("/sessions/:sessionId/connect", whatsappController.connectSession)
router.post("/sessions/:sessionId/disconnect", whatsappController.disconnectSession)
router.delete("/sessions/:sessionId", whatsappController.deleteSession)
router.post("/send", whatsappController.sendMessage)
router.get("/sessions/:sessionId/qr", whatsappController.getQRCode)

export default router
