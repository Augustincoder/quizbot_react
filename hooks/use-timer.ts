'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useGameStore } from '@/store/game-store'

interface UseTimerOptions {
  onTimeUp?: () => void
  onTick?: (remaining: number) => void
}

export function useTimer(options: UseTimerOptions = {}) {
  const { onTimeUp, onTick } = options
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const timeRemaining = useGameStore((state) => state.timeRemaining)
  const timerActive = useGameStore((state) => state.timerActive)
  const setTimeRemaining = useGameStore((state) => state.setTimeRemaining)
  const setTimerActive = useGameStore((state) => state.setTimerActive)

  const startTimer = useCallback((duration: number) => {
    setTimeRemaining(duration)
    setTimerActive(true)
  }, [setTimeRemaining, setTimerActive])

  const stopTimer = useCallback(() => {
    setTimerActive(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [setTimerActive])

  const resetTimer = useCallback((duration: number) => {
    stopTimer()
    setTimeRemaining(duration)
  }, [stopTimer, setTimeRemaining])

  useEffect(() => {
    if (!timerActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining(Math.max(0, timeRemaining - 1))
      onTick?.(timeRemaining - 1)
      
      if (timeRemaining <= 1) {
        stopTimer()
        onTimeUp?.()
      }
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [timerActive, timeRemaining, setTimeRemaining, stopTimer, onTimeUp, onTick])

  return {
    timeRemaining,
    timerActive,
    startTimer,
    stopTimer,
    resetTimer,
    progress: timeRemaining > 0 ? (timeRemaining / (useGameStore.getState().currentQuestion?.timeLimit ?? 15)) * 100 : 0,
  }
}
