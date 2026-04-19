'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useGameStore } from '@/store/game-store'

interface UseTimerOptions {
  onTimeUp?: () => void
  onTick?: (remaining: number) => void
}

interface UseTimerReturn {
  timeRemaining: number
  timerActive: boolean
  startTimer: (duration: number) => void
  stopTimer: () => void
  resetTimer: (duration: number) => void
  progress: number
}

export function useTimer(options: UseTimerOptions = {}): UseTimerReturn {
  const { onTimeUp, onTick } = options
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const remainingTimeRef = useRef<number>(0)
  const totalDurationRef = useRef<number>(0)

  const dynamicTimerMs = useGameStore((state) => state.dynamicTimerMs)
  const timeRemaining = useGameStore((state) => state.timeRemaining)
  const timerActive = useGameStore((state) => state.timerActive)
  const setTimeRemaining = useGameStore((state) => state.setTimeRemaining)
  const setTimerActive = useGameStore((state) => state.setTimerActive)
  const currentPhase = useGameStore((state) => state.currentPhase)

  const tick = useCallback(() => {
    const now = Date.now()
    const elapsed = Math.floor((now - startTimeRef.current) / 1000)
    const newTime = Math.max(0, remainingTimeRef.current - elapsed)

    setTimeRemaining(newTime)
    onTick?.(newTime)

    if (newTime <= 0) {
      setTimerActive(false)
      onTimeUp?.()
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [setTimeRemaining, setTimerActive, onTick, onTimeUp])

  const startTimer = useCallback((duration: number) => {
    startTimeRef.current = Date.now()
    remainingTimeRef.current = duration
    totalDurationRef.current = duration
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
    if (currentPhase === 'reading' && dynamicTimerMs > 0) {
      startTimer(Math.floor(dynamicTimerMs / 1000))
    } else if (currentPhase === 'action' && useGameStore.getState().mode === 'zakovat') {
      startTimer(60)
    } else if (currentPhase === 'input') {
      startTimer(10)
    } else {
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

    intervalRef.current = setInterval(tick, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [timerActive, tick])

  const progress = totalDurationRef.current > 0
    ? (timeRemaining / totalDurationRef.current) * 100
    : 0

  return {
    timeRemaining,
    timerActive,
    startTimer,
    stopTimer,
    resetTimer,
    progress,
  }
}