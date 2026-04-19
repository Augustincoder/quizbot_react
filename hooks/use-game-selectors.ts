'use client'

import { useGameStore } from '@/store/game-store'
import { useShallow } from 'zustand/react/shallow'

export function useGamePhase() {
  return useGameStore(
    useShallow((state) => ({
      phase: state.phase,
      currentPhase: state.currentPhase,
    })),
  )
}

export function useCurrentQuestion() {
  return useGameStore((state) => state.currentQuestion)
}

export function useQuestionProgress() {
  return useGameStore(
    useShallow((state) => ({
      questionNumber: state.questionNumber,
      totalQuestions: state.totalQuestions,
    })),
  )
}

export function useBuzzerState() {
  return useGameStore(
    useShallow((state) => ({
      buzzerWinner: state.buzzerWinner,
      buzzerLocked: state.buzzerLocked,
      buzzerLockedBy: state.buzzerLockedBy,
    })),
  )
}

export function useAnswerState() {
  return useGameStore(
    useShallow((state) => ({
      submittedAnswer: state.submittedAnswer,
      isCorrect: state.isCorrect,
      correctAnswer: state.correctAnswer,
      pointsEarned: state.pointsEarned,
      answeredPlayerId: state.answeredPlayerId,
    })),
  )
}

export function usePlayerScore(playerId: string) {
  return useGameStore((state) => state.scores[playerId] ?? 0)
}

export function useScores() {
  return useGameStore(useShallow((state) => state.scores))
}

export function useRoomConfig() {
  return useGameStore(
    useShallow((state) => ({
      roomId: state.roomId,
      mode: state.mode,
      matchType: state.matchType,
    })),
  )
}

export function useZakovatResults() {
  return useGameStore((state) => state.zakovatResults)
}
