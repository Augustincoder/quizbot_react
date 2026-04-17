'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { getGameSocket } from '@/services/game-socket'

interface SocketContextType {
  isConnected: boolean
  isConnecting: boolean
  error: Error | null
}

const SocketContext = createContext<SocketContextType>({
  isConnected: false,
  isConnecting: false,
  error: null,
})

export const useSocketContext = () => useContext(SocketContext)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true
    const socketService = getGameSocket()

    const initSocket = async () => {
      try {
        setIsConnecting(true)
        await socketService.connect()
        if (mounted) {
          setIsConnected(true)
          setIsConnecting(false)
        }
      } catch (err: any) {
        if (mounted) {
          setError(err)
          setIsConnecting(false)
          console.error('Socket connect error:', err)
        }
      }
    }

    initSocket()

    // Assuming we add explicit connected state events in the future if needed
    // socketService.on('disconnect', () => setIsConnected(false))

    return () => {
      mounted = false
      // Don't fully disconnect entirely on unmount to preserve singleton if needed, 
      // but usually the app shell stays mounted.
    }
  }, [])

  return (
    <SocketContext.Provider value={{ isConnected, isConnecting, error }}>
      {children}
    </SocketContext.Provider>
  )
}
