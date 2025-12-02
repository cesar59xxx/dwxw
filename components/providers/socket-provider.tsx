"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { socketClient } from "@/lib/api-client"
import { useAuthStore } from "@/lib/stores/auth-store"
import type { Socket } from "socket.io-client"

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
})

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem("accessToken")
      if (token) {
        const socketInstance = socketClient.connect(token)

        socketInstance.on("connect", () => {
          setIsConnected(true)
        })

        socketInstance.on("disconnect", () => {
          setIsConnected(false)
        })

        setSocket(socketInstance)
      }
    }

    return () => {
      socketClient.disconnect()
      setIsConnected(false)
      setSocket(null)
    }
  }, [isAuthenticated, user])

  return <SocketContext.Provider value={{ socket, isConnected }}>{children}</SocketContext.Provider>
}

export const useSocket = () => useContext(SocketContext)
