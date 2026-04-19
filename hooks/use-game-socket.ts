'use client'

import { useEffect, useCallback, useRef } from 'react'
import { getGameSocket, resetGameSocket } from '@/services/game-socket'
import { useGameStore } from '@/store/game-store'
import { useUserStore } from '@/store/user-store'
import { socketEventBus } from '@/lib/socket-event-bus'
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

interface ZakovatRushResultPayload {
  rankedCorrect?: Array<{ userId: string }>
  scores?: Array<{ userId: string; score: number }>
}

interface GameQuestionPayload {
  question: unknown
  index: number
  total: number
  readTimerMs?: number
  pointValue?: number
}

interface BuzzerLockedPayload {
  userId: string
}

interface BuzzerResultPhase3Payload {
  correct: boolean
  userId: string
}

interface GameRoundResultPayload {
  scores?: Array<{ userId: string; score: number }>
}

export function useGameSocket(): UseGameSocketReturn {
  const userId = useUserStore((state) => state.id)
  const storeRef = useRef(useGameStore.getState())
  const handlersRef = useRef<Map<string, (data: any) => void>>(new Map())

  useEffect(() => {
    storeRef.current = useGameStore.getState()
  })

  useEffect(() => {
    const socket = getGameSocket()
    socket
      .connect()
      .then(() => {
        const io = socket.getIoSocket()
        if (io) socketEventBus.init(io)
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    const handlers: Record<string, (data: any) => void> = {
      room_joined: (data: RoomJoinedPayload) => {
        storeRef.current.setPlayers(data.players)
      },

      question_start: (data: QuestionStartPayload) => {
        storeRef.current.setQuestion(data.question, data.questionNumber, data.totalQuestions)
        storeRef.current.setPhase('question')
        storeRef.current.setCurrentPhase('action')
      },

      buzzer_result: (data: BuzzerResultPayload) => {
        storeRef.current.pressBuzzer(data.winnerId, data.timestamp)
        const currentPlayerId = storeRef.current.currentPlayerId ?? (userId || 'user')
        if (data.winnerId === currentPlayerId) {
          storeRef.current.setPhase('answering')
        }
      },

      answer_result: (data: AnswerResultPayload) => {
        storeRef.current.setAnswerResult(
          data.playerId,
          data.isCorrect,
          data.correctAnswer,
          data.pointsEarned
        )
        if (data.playerId && data.pointsEarned !== 0) {
          storeRef.current.updateScore(data.playerId, data.pointsEarned)
        }
      },

      ai_recheck_result: (data: AIRecheckResultPayload) => {
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
      },

      peer_vote_result: (data: PeerVoteResultPayload) => {
        storeRef.current.endPeerVote(data.accepted)
      },

      zakovat_results: (payload: unknown) => {
        const results = payload as {
          results: Array<{ playerId: string; isCorrect: boolean; pointsEarned: number }>
          correctAnswer: string
        }
        storeRef.current.setZakovatResults(results.results, results.correctAnswer)
      },

      'zakovat:rush_result': (payload: ZakovatRushResultPayload) => {
        const correctAnswer = storeRef.current.currentQuestion?.correctAnswer ?? ''
        const rankedCorrect = Array.isArray(payload?.rankedCorrect) ? payload.rankedCorrect : []
        const results = rankedCorrect.map((r) => ({
          playerId: r.userId,
          isCorrect: true,
          pointsEarned: 1,
        }))
        storeRef.current.setZakovatResults(results, correctAnswer)
        if (Array.isArray(payload?.scores)) {
          const scoresMap: Record<string, number> = {}
          payload.scores.forEach((s) => {
            scoresMap[s.userId] = s.score
          })
          storeRef.current.setScores(scoresMap)
        }
      },

      game_end: (data: GameEndPayload) => {
        storeRef.current.setGameEnd(data.finalScores, data.mmrChanges, data.winner)
      },

      'game:question': (payload: GameQuestionPayload) => {
        let safeQuestion = payload.question

        if (typeof safeQuestion === 'string') {
          safeQuestion = {
            id: `q_${payload.index}`,
            text: safeQuestion,
            category: 'General',
            difficulty: 'medium',
            timeLimit: 15,
            points: payload.pointValue || 1,
          }
        }

        storeRef.current.setQuestion(
          safeQuestion,
          payload.index + 1,
          payload.total,
          payload.readTimerMs
        )
      },

      'game:phase_action': () => {
        storeRef.current.setCurrentPhase('action')
      },

      'buzzer:locked': (payload: BuzzerLockedPayload) => {
        storeRef.current.setBuzzerLockedBy(payload.userId)
        storeRef.current.setCurrentPhase('input')
        useGameStore.setState({
          buzzerWinner: payload.userId,
          buzzerTimestamp: Date.now(),
          buzzerLocked: true,
          phase: 'answering',
        })
      },

      'buzzer:reactivate': () => {
        storeRef.current.setCurrentPhase('action')
        storeRef.current.setBuzzerLockedBy(null)
      },

      'game:round_result': (payload: GameRoundResultPayload) => {
        storeRef.current.setRoundResults(payload)
        storeRef.current.setCurrentPhase('leaderboard')
        const scoresMap: Record<string, number> = {}
        if (payload.scores) {
          payload.scores.forEach((s) => {
            scoresMap[s.userId] = s.score
          })
          storeRef.current.setScores(scoresMap)
        }
      },

      'buzzer:result': (payload: BuzzerResultPhase3Payload) => {
        if (!payload.correct) {
          const currentLocked = storeRef.current.lockedPlayers
          if (!currentLocked.includes(payload.userId)) {
            storeRef.current.setLockedPlayers([...currentLocked, payload.userId])
          }
        }
      },
    }

    Object.entries(handlers).forEach(([event, handler]) => {
      socketEventBus.subscribe(event, handler)
      handlersRef.current.set(event, handler)
    })

    return () => {
      handlersRef.current.forEach((handler, event) => {
        socketEventBus.unsubscribe(event, handler)
      })
      handlersRef.current.clear()
    }
  }, [userId])

  const connect = useCallback(async () => {
    const socket = getGameSocket()
    await socket.connect()
    const io = socket.getIoSocket()
    if (io) socketEventBus.init(io)
  }, [])

  const disconnect = useCallback(() => {
    resetGameSocket()
  }, [])

  const joinRoom = useCallback(async (roomId: string, mode: GameMode, matchType: MatchType) => {
    const socket = getGameSocket()
    await socket.joinRoom(roomId, mode, matchType)
  }, [])

  const submitBuzzer = useCallback(async () => {
    const socket = getGameSocket()
    await socket.submitBuzzer(userId || 'user', Date.now())
  }, [userId])

  const submitAnswer = useCallback(async (answer: string) => {
    const socket = getGameSocket()
    await socket.submitAnswer(userId || 'user', answer)
  }, [userId])

  const requestAIRecheck = useCallback(async (questionId: string, answer: string) => {
    const socket = getGameSocket()
    await socket.requestAIRecheck(questionId, userId || 'user', answer)
  }, [userId])

  const startPeerVote = useCallback((questionId: string, answer: string) => {
    const socket = getGameSocket()
    socket.startPeerVote(questionId, userId || 'user', answer)
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
