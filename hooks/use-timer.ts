'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useGameStore } from '@/store/game-store'

interface UseTimerReturn {
  timeRemaining: number
  timerActive: boolean
  startTimer: (duration: number) => void
  stopTimer: () => void
  progress: number
}

export function useTimer(): UseTimerReturn {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const durationRef = useRef<number>(0)
  const lastTickRef = useRef<number>(0)

  const timeRemaining = useGameStore((state) => state.timeRemaining)
  const timerActive = useGameStore((state) => state.timerActive)
  const currentPhase = useGameStore((state) => state.currentPhase)
  const dynamicTimerMs = useGameStore((state) => state.dynamicTimerMs)

  const tick = useCallback(() => {
    const now = Date.now()
    const elapsed = Math.floor((now - startTimeRef.current) / 1000)
    const remaining = Math.max(0, durationRef.current - elapsed)

    if (remaining !== lastTickRef.current) {
      lastTickRef.current = remaining
      useGameStore.getState().setTimeRemaining(remaining)
    }

    if (remaining <= 0) {
      useGameStore.getState().setTimerActive(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    } else {
      rafRef.current = requestAnimationFrame(tick)
    }
  }, [])

  const startTimer = useCallback((duration: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    startTimeRef.current = Date.now()
    durationRef.current = duration
    lastTickRef.current = duration

    useGameStore.getState().setTimeRemaining(duration)
    useGameStore.getState().setTimerActive(true)

    rafRef.current = requestAnimationFrame(tick)

    intervalRef.current = setInterval(() => {
      if (document.hidden) {
        tick()
      }
    }, 1000)
  }, [tick])

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    useGameStore.getState().setTimerActive(false)
  }, [])

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
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const progress =
    durationRef.current > 0 ? (timeRemaining / durationRef.current) * 100 : 0

  return {
    timeRemaining,
    timerActive,
    startTimer,
    stopTimer,
    progress,
  }
}
