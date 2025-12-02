import Redis from "redis"

/**
 * Cliente Redis para cache e filas
 */
class RedisClient {
  constructor() {
    this.client = null
  }

  async connect() {
    this.client = Redis.createClient({
      host: process.env.REDIS_HOST || "localhost",
      port: Number.parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
    })

    this.client.on("error", (err) => {
      console.error("❌ Erro no Redis:", err)
    })

    this.client.on("connect", () => {
      console.log("✅ Redis conectado com sucesso")
    })

    await this.client.connect()
  }

  async get(key) {
    return await this.client.get(key)
  }

  async set(key, value, expireSeconds = null) {
    if (expireSeconds) {
      return await this.client.setEx(key, expireSeconds, value)
    }
    return await this.client.set(key, value)
  }

  async del(key) {
    return await this.client.del(key)
  }

  async exists(key) {
    return await this.client.exists(key)
  }

  getClient() {
    return this.client
  }
}

export const redisClient = new RedisClient()
