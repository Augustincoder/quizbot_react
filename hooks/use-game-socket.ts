'use client'

import { useEffect, useCallback, useRef } from 'react'
import { getGameSocket, resetGameSocket } from '@/services/game-socket'
import { useGameStore } from '@/store/game-store'
import { useUserStore } from '@/store/user-store'
import type { GameMode, MatchType } from '@/types/game'
import type {
  RoomJoinedPayload,
  QuestionStartPayload,
  BuzzerResultPayload,
  AnswerResultPayload,
  AIRecheckResultPayload,
  PeerVoteResultPayload,
  GameEndPayload,
} from '@/types/socket'

interface UseGameSocketReturn {
  connect: () => Promise<void>
  disconnect: () => void
  joinRoom: (roomId: string, mode: GameMode, matchType: MatchType) => Promise<void>
  submitBuzzer: () => Promise<void>
  submitAnswer: (answer: string) => Promise<void>
  requestAIRecheck: (questionId: string, answer: string) => Promise<void>
  startPeerVote: (questionId: string, answer: string) => void
}

// Zakovat rush result payload interface
interface ZakovatRushResultPayload {
  rankedCorrect?: Array<{ userId: string }>
  scores?: Array<{ userId: string; score: number }>
}

// Game question payload interface
interface GameQuestionPayload {
  question: unknown
  index: number
  total: number
  readTimerMs?: number
  pointValue?: number
}

// Buzzer locked payload interface
interface BuzzerLockedPayload {
  userId: string
}

// Buzzer result phase 3 payload interface
interface BuzzerResultPhase3Payload {
  correct: boolean
  userId: string
}

// Game round result payload interface
interface GameRoundResultPayload {
  scores?: Array<{ userId: string; score: number }>
}

export function useGameSocket(): UseGameSocketReturn {
  const userId = useUserStore((state) => state.id)
  
  // Use refs to access store actions without triggering re-renders
  const storeRef = useRef(useGameStore.getState())
  
  // Keep store ref in sync
  useEffect(() => {
    storeRef.current = useGameStore.getState()
  })

  // Setup socket event listeners - ONLY ONCE on mount
  useEffect(() => {
    const socket = getGameSocket()
    
    // Get current userId from closure (stable reference)
    const currentUserId = userId || 'user'

    const onRoomJoined = (data: RoomJoinedPayload) => {
      storeRef.current.setPlayers(data.players)
    }

    const onQuestionStart = (data: QuestionStartPayload) => {
      // Batch state updates to reduce re-renders
      const { setQuestion, setPhase, setCurrentPhase } = storeRef.current
      setQuestion(data.question, data.questionNumber, data.totalQuestions)
      setPhase('question')
      // Legacy backend path does not emit `game:phase_action`.
      // Unlock interactions immediately; modern path will overwrite to `reading` via `game:question`.
      setCurrentPhase('action')
    }

    const onBuzzerResult = (data: BuzzerResultPayload) => {
      storeRef.current.pressBuzzer(data.winnerId, data.timestamp)
      const currentPlayerId = storeRef.current.currentPlayerId ?? currentUserId
      if (data.winnerId === currentPlayerId) {
        storeRef.current.setPhase('answering')
      }
    }

    const onAnswerResult = (data: AnswerResultPayload) => {
      storeRef.current.setAnswerResult(data.playerId, data.isCorrect, data.correctAnswer, data.pointsEarned)
      if (data.playerId && data.pointsEarned !== 0) {
        storeRef.current.updateScore(data.playerId, data.pointsEarned)
      }
    }

    const onAIRecheckResult = (data: AIRecheckResultPayload) => {
      storeRef.current.setAIRecheckResult({
        isValid: data.isValid,
        explanation: data.explanation,
        confidence: data.confidence,
      })

      import('sonner').then(({ toast }) => {
        if (data.isValid) {
          toast.success(`Tabriklaymiz! Apellyatsiya qabul qilindi: ${data.explanation}`)
        } else {
          toast.error(`Apellyatsiya rad etildi: ${data.explanation}`)
        }
      })
    }

    const onPeerVoteResult = (data: PeerVoteResultPayload) => {
      storeRef.current.endPeerVote(data.accepted)
    }

    const onZakovatResults = (payload: unknown) => {
      const results = payload as { results: Array<{ playerId: string; isCorrect: boolean; pointsEarned: number }>; correctAnswer: string }
      storeRef.current.setZakovatResults(results.results, results.correctAnswer)
    }

    const onZakovatRushResult = (payload: ZakovatRushResultPayload) => {
      // Modern backend emits `zakovat:rush_result` without correctAnswer.
      // Use `currentQuestion.correctAnswer` (already normalized) as the source of truth.
      const correctAnswer = storeRef.current.currentQuestion?.correctAnswer ?? ''
      const rankedCorrect = Array.isArray(payload?.rankedCorrect) ? payload.rankedCorrect : []
      const results = rankedCorrect.map((r) => ({
        playerId: r.userId,
        isCorrect: true,
        pointsEarned: 1,
      }))
      storeRef.current.setZakovatResults(results, correctAnswer)
      // Scores may be included; keep the scoreboard in sync.
      if (Array.isArray(payload?.scores)) {
        const scoresMap: Record<string, number> = {}
        payload.scores.forEach((s) => { scoresMap[s.userId] = s.score })
        storeRef.current.setScores(scoresMap)
      }
    }

    const onGameEnd = (data: GameEndPayload) => {
      storeRef.current.setGameEnd(data.finalScores, data.mmrChanges, data.winner)
    }

    const onGameQuestion = (payload: GameQuestionPayload) => {
      console.log('🔥 [game:question] RAW PAYLOAD =>', payload)

      let safeQuestion = payload.question

      // Fallback: If backend is running old code without restart and sends a string instead of an object
      if (typeof safeQuestion === 'string') {
        safeQuestion = {
          id: `q_${payload.index}`,
          text: safeQuestion,
          category: 'General',
          difficulty: 'medium',
          timeLimit: 15, // default
          points: payload.pointValue || 1,
        }
      }

      storeRef.current.setQuestion(
        safeQuestion,
        payload.index + 1,
        payload.total,
        payload.readTimerMs
      )
    }

    const onGamePhaseAction = () => {
      storeRef.current.setCurrentPhase('action')
    }

    const onBuzzerLocked = (payload: BuzzerLockedPayload) => {
      storeRef.current.setBuzzerLockedBy(payload.userId)
      storeRef.current.setCurrentPhase('input')
      // Bridge the modern backend event to the legacy UI state
      useGameStore.setState({
        buzzerWinner: payload.userId,
        buzzerTimestamp: Date.now(),
        buzzerLocked: true,
        phase: 'answering',
      })
    }

    const onBuzzerReactivate = () => {
      storeRef.current.setCurrentPhase('action')
      storeRef.current.setBuzzerLockedBy(null)
    }

    const onGameRoundResult = (payload: GameRoundResultPayload) => {
      storeRef.current.setRoundResults(payload)
      storeRef.current.setCurrentPhase('leaderboard')

      const scoresMap: Record<string, number> = {}
      if (payload.scores) {
        payload.scores.forEach((s) => { scoresMap[s.userId] = s.score })
        storeRef.current.setScores(scoresMap)
      }
    }

    const onBuzzerResultPhase3 = (payload: BuzzerResultPhase3Payload) => {
      if (!payload.correct) {
        const currentLocked = storeRef.current.lockedPlayers
        if (!currentLocked.includes(payload.userId)) {
          storeRef.current.setLockedPlayers([...currentLocked, payload.userId])
        }
      }
    }

    socket.on('room_joined', onRoomJoined)
    socket.on('question_start', onQuestionStart)
    socket.on('buzzer_result', onBuzzerResult)
    socket.on('answer_result', onAnswerResult)
    socket.on('ai_recheck_result', onAIRecheckResult)
    socket.on('peer_vote_result', onPeerVoteResult)
    socket.on('zakovat_results', onZakovatResults)
    socket.on('zakovat:rush_result', onZakovatRushResult)
    socket.on('game_end', onGameEnd)

    socket.on('game:question', onGameQuestion)
    socket.on('game:phase_action', onGamePhaseAction)
    socket.on('buzzer:locked', onBuzzerLocked)
    socket.on('buzzer:reactivate', onBuzzerReactivate)
    socket.on('game:round_result', onGameRoundResult)
    socket.on('buzzer:result', onBuzzerResultPhase3)

    return () => {
      socket.off('room_joined', onRoomJoined)
      socket.off('question_start', onQuestionStart)
      socket.off('buzzer_result', onBuzzerResult)
      socket.off('answer_result', onAnswerResult)
      socket.off('ai_recheck_result', onAIRecheckResult)
      socket.off('peer_vote_result', onPeerVoteResult)
      socket.off('zakovat_results', onZakovatResults)
      socket.off('zakovat:rush_result', onZakovatRushResult)
      socket.off('game_end', onGameEnd)

      socket.off('game:question', onGameQuestion)
      socket.off('game:phase_action', onGamePhaseAction)
      socket.off('buzzer:locked', onBuzzerLocked)
      socket.off('buzzer:reactivate', onBuzzerReactivate)
      socket.off('game:round_result', onGameRoundResult)
      socket.off('buzzer:result', onBuzzerResultPhase3)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps - setup listeners only once

  const connect = useCallback(async () => {
    try {
      const socket = getGameSocket()
      await socket.connect()
    } catch (error) {
      console.error('Failed to connect to game socket:', error)
      throw error
    }
  }, [])

  const disconnect = useCallback(() => {
    resetGameSocket()
  }, [])

  const joinRoom = useCallback(async (roomId: string, mode: GameMode, matchType: MatchType) => {
    try {
      const socket = getGameSocket()
      await socket.joinRoom(roomId, mode, matchType)
    } catch (error) {
      console.error('Failed to join room:', error)
      throw error
    }
  }, [])

  const submitBuzzer = useCallback(async () => {
    try {
      const socket = getGameSocket()
      await socket.submitBuzzer(userId || 'user', Date.now())
    } catch (error) {
      console.error('Failed to submit buzzer:', error)
      throw error
    }
  }, [userId])

  const submitAnswer = useCallback(async (answer: string) => {
    try {
      const socket = getGameSocket()
      await socket.submitAnswer(userId || 'user', answer)
    } catch (error) {
      console.error('Failed to submit answer:', error)
      throw error
    }
  }, [userId])

  const requestAIRecheck = useCallback(async (questionId: string, answer: string) => {
    try {
      const socket = getGameSocket()
      await socket.requestAIRecheck(questionId, userId || 'user', answer)
    } catch (error) {
      console.error('Failed to request AI recheck:', error)
      throw error
    }
  }, [userId])

  const startPeerVote = useCallback((questionId: string, answer: string) => {
    try {
      const socket = getGameSocket()
      socket.startPeerVote(questionId, userId || 'user', answer)
    } catch (error) {
      console.error('Failed to start peer vote:', error)
    }
  }, [userId])

  return {
    connect,
    disconnect,
    joinRoom,
    submitBuzzer,
    submitAnswer,
    requestAIRecheck,
    startPeerVote,
  }
}
