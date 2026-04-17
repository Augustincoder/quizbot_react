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
  
  const dynamicTimerMs = useGameStore((state) => state.dynamicTimerMs)
  const timeRemaining = useGameStore((state) => state.timeRemaining)
  const timerActive = useGameStore((state) => state.timerActive)
  const setTimeRemaining = useGameStore((state) => state.setTimeRemaining)
  const setTimerActive = useGameStore((state) => state.setTimerActive)
  const currentPhase = useGameStore((state) => state.currentPhase)

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

  // Automatically start mirror timer when dynamicTimerMs changes and phase is reading
  useEffect(() => {
     if (currentPhase === 'reading' && dynamicTimerMs > 0) {
        startTimer(Math.floor(dynamicTimerMs / 1000))
     } else if (currentPhase === 'action' && useGameStore.getState().mode === 'zakovat') {
        startTimer(60) // Zakovat action phase 60s
     } else if (currentPhase !== 'reading' && currentPhase !== 'action') {
        stopTimer()
     }
  }, [currentPhase, dynamicTimerMs, startTimer, stopTimer])

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

  const progress = timeRemaining > 0 
      ? (timeRemaining / Math.max(1, Math.floor(dynamicTimerMs / 1000) || 15)) * 100 
      : 0;

  return {
    timeRemaining,
    timerActive,
    startTimer,
    stopTimer,
    resetTimer,
    progress,
  }
}
