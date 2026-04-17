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
  const currentPhase = useGameStore((state) => state.currentPhase)
  const lockedPlayers = useGameStore((state) => state.lockedPlayers)
  const buzzerLockedBy = useGameStore((state) => state.buzzerLockedBy)
  const pressBuzzerAction = useGameStore((state) => state.pressBuzzer)

  const canPress = currentPhase === 'action' && !lockedPlayers.includes(userId || '') && !buzzerLockedBy
  const isWinner = buzzerLockedBy === userId
  const isLocked = !!buzzerLockedBy

  const pressBuzzer = useCallback(() => {
    if (!canPress || !userId) return
    
    // Emit to server
    import('@/services/game-socket').then(({ getGameSocket }) => {
      getGameSocket().submitBuzzer(userId, Date.now())
    })
    
    triggerHaptic('heavy')
  }, [canPress, userId])

  return {
    canPress,
    isWinner,
    isLocked,
    pressBuzzer,
    buzzerWinner: buzzerLockedBy,
  }
}
