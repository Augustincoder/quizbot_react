import { io, Socket } from 'socket.io-client'
import { socketEventBus } from '@/lib/socket-event-bus'
import type { SocketEvent, SocketEventType } from '@/types/socket'
import type { GameMode, MatchType } from '@/types/game'

// URL config (Adjust for Production)
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8080'
const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true'

let socketInstance: GameSocket | null = null

export class GameSocket {
  private socket: Socket | null = null

  async connect(): Promise<void> {
    if (this.socket?.connected) return

    let initData = ''
    if (USE_MOCK_AUTH) {
      // Mock Auth for local development
      const mockUser = { id: 1234567, first_name: "MockUser" }
      initData = `mock_user_id=123&user=${encodeURIComponent(JSON.stringify(mockUser))}`
    } else if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      // Real Telegram Auth
      initData = window.Telegram.WebApp.initData
    }

    this.socket = io(SOCKET_URL, {
      auth: { initData },
      transports: ['websocket', 'polling']
    })

    return new Promise((resolve, reject) => {
      this.socket?.on('connect', () => resolve())
      this.socket?.on('connect_error', (err) => reject(err))
    })
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  on(event: SocketEventType, callback: (payload: any) => void): void {
    this.socket?.on(event, callback)
  }

  off(event: SocketEventType, callback?: (payload: any) => void): void {
    if (callback) {
      this.socket?.off(event, callback)
    } else {
      this.socket?.off(event)
    }
  }

  private currentRoom: string | null = null
  private currentMode: GameMode | null = null

  async joinRoom(roomId: string, mode: GameMode, matchType: MatchType): Promise<void> {
    if (!this.socket?.connected) await this.connect()
    
    this.currentRoom = roomId
    this.currentMode = mode

    return new Promise((resolve) => {
      // Create room first
      this.socket?.emit('room:create', { roomCode: roomId, mode, hostId: 'user', displayName: 'Player' })
      
      // Wait slightly then join and start
      setTimeout(() => {
        this.socket?.emit('room:join', { roomCode: roomId, userId: 'user', displayName: 'Player' })
        
        // Auto start for solo matching
        if (matchType === 'solo') {
          setTimeout(() => {
            this.socket?.emit('room:start', { roomCode: roomId })
          }, 100)
        }
        resolve()
      }, 100)
    })
  }

  async submitBuzzer(playerId: string, timestamp: number): Promise<void> {
    this.socket?.emit('buzzer:press', { roomCode: this.currentRoom, userId: playerId, timestamp })
  }

  async submitAnswer(playerId: string, answer: string): Promise<void> {
    if (this.currentMode === 'zakovat') {
       this.socket?.emit('zakovat:answer_submit', { roomCode: this.currentRoom, userId: playerId, answer })
    } else {
       this.socket?.emit('buzzer:answer_submit', { roomCode: this.currentRoom, userId: playerId, answer })
    }
  }

  async requestAIRecheck(questionId: string, playerId: string, answer: string): Promise<void> {
    this.socket?.emit('request_ai_recheck', { questionId, answer, correctAnswer: '' })
  }

  startPeerVote(questionId: string, playerId: string, answer: string): void {
    this.socket?.emit('start_peer_vote', { questionId, answer })
  }

  emit(event: string, data: any): void {
    this.socket?.emit(event, data)
  }

  /** Underlying socket.io client — used by the singleton event bus (one listener set globally). */
  getIoSocket(): Socket | null {
    return this.socket
  }
}

export const getGameSocket = (): GameSocket => {
  if (!socketInstance) {
    socketInstance = new GameSocket()
  }
  return socketInstance
}

export const resetGameSocket = (): void => {
  socketEventBus.cleanup()
  if (socketInstance) {
    socketInstance.disconnect()
    socketInstance = null
  }
}
