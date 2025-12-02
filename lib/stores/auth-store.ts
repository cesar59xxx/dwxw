import { create } from "zustand"
import { apiClient, socketClient } from "@/lib/api-client"

interface User {
  id: string
  name: string
  email: string
  role: string
  tenantId: string
  tenantName: string
  plan: string
  planLimits: any
}

interface AuthStore {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean

  login: (email: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => Promise<void>
  fetchUser: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const result = await apiClient.login({ email, password })

    set({
      user: result.user,
      isAuthenticated: true,
      isLoading: false,
    })

    // Conectar socket
    socketClient.connect(result.tokens.accessToken)
  },

  register: async (data) => {
    const result = await apiClient.register(data)

    set({
      user: result.user,
      isAuthenticated: true,
      isLoading: false,
    })

    socketClient.connect(result.tokens.accessToken)
  },

  logout: async () => {
    await apiClient.logout()
    socketClient.disconnect()

    set({
      user: null,
      isAuthenticated: false,
    })
  },

  fetchUser: async () => {
    try {
      const { user } = await apiClient.getCurrentUser()

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      })

      // Conectar socket
      const token = localStorage.getItem("accessToken")
      if (token) {
        socketClient.connect(token)
      }
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },
}))
