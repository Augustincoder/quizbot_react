'use client'

import { useCallback } from 'react'
import { useGameStore } from '@/store/game-store'
import { useUserStore } from '@/store/user-store'
import { triggerHaptic } from '@/lib/telegram'

interface UseBuzzerReturn {
  canPress: boolean
  isWinner: boolean
  isLocked: boolean
  pressBuzzer: () => void
  buzzerWinner: string | null
}

export function useBuzzer(): UseBuzzerReturn {
  const userId = useUserStore((state) => state.id)
  const phase = useGameStore((state) => state.phase)
  const buzzerWinner = useGameStore((state) => state.buzzerWinner)
  const buzzerLocked = useGameStore((state) => state.buzzerLocked)
  const pressBuzzerAction = useGameStore((state) => state.pressBuzzer)

  const canPress = phase === 'question' && !buzzerLocked && !buzzerWinner
  const isWinner = buzzerWinner === userId
  const isLocked = buzzerLocked

  const pressBuzzer = useCallback(() => {
    if (!canPress || !userId) return
    
    const timestamp = Date.now()
    pressBuzzerAction(userId, timestamp)
    triggerHaptic('heavy')
  }, [canPress, userId, pressBuzzerAction])

  return {
    canPress,
    isWinner,
    isLocked,
    pressBuzzer,
    buzzerWinner,
  }
}
