import Queue from "bull"

/**
 * Fila para processamento assíncrono de mensagens
 * Usado para processar chatbots, notificações, etc.
 */
export const messageQueue = new Queue("message-processing", {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: Number.parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
})

// Log de eventos
messageQueue.on("completed", (job) => {
  console.log(`Job ${job.id} completado`)
})

messageQueue.on("failed", (job, err) => {
  console.error(`Job ${job.id} falhou:`, err)
})

messageQueue.on("error", (error) => {
  console.error("Erro na fila:", error)
})
