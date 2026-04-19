// lib/socket-event-bus.ts
import type { Socket } from 'socket.io-client'

type EventHandler = (data: any) => void

class GameSocketEventBus {
  private listeners = new Map<string, Set<EventHandler>>()
  private socket: Socket | null = null
  private initialized = false

  init(socket: Socket): void {
    if (this.initialized) return
    this.initialized = true
    this.socket = socket

    // Register socket listeners ONCE globally
    const events = [
      'room_joined',
      'question_start',
      'buzzer_result',
      'answer_result',
      'ai_recheck_result',
      'peer_vote_result',
      'zakovat_results',
      'zakovat:rush_result',
      'game_end',
      'game:question',
      'game:phase_action',
      'buzzer:locked',
      'buzzer:reactivate',
      'game:round_result',
      'buzzer:result',
    ]

    events.forEach((event) => {
      socket.on(event, (data: any) => this.emit(event, data))
    })
  }

  private emit(event: string, data: any): void {
    const handlers = this.listeners.get(event)
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data)
        } catch (error) {
          console.error(`Error in ${event} handler:`, error)
        }
      })
    }
  }

  subscribe(event: string, handler: EventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler)
  }

  unsubscribe(event: string, handler: EventHandler): void {
    const handlers = this.listeners.get(event)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  cleanup(): void {
    this.listeners.clear()
    this.initialized = false
    this.socket = null
  }

  getListenerCount(event?: string): number {
    if (event) {
      return this.listeners.get(event)?.size || 0
    }
    let total = 0
    this.listeners.forEach((handlers) => {
      total += handlers.size
    })
    return total
  }
}

export const socketEventBus = new GameSocketEventBus()
