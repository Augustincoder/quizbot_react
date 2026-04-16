'use client'

import { useEffect, useCallback, useRef } from 'react'
import { getGameSocket, resetGameSocket, MockGameSocket } from '@/services/game-socket'
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

export function useGameSocket(): UseGameSocketReturn {
  const socketRef = useRef<MockGameSocket | null>(null)
  
  const userId = useUserStore((state) => state.id)
  
  const setPlayers = useGameStore((state) => state.setPlayers)
  const setPhase = useGameStore((state) => state.setPhase)
  const setQuestion = useGameStore((state) => state.setQuestion)
  const pressBuzzer = useGameStore((state) => state.pressBuzzer)
  const setAnswerResult = useGameStore((state) => state.setAnswerResult)
  const updateScore = useGameStore((state) => state.updateScore)
  const setAIRecheckResult = useGameStore((state) => state.setAIRecheckResult)
  const endPeerVote = useGameStore((state) => state.endPeerVote)
  const setGameEnd = useGameStore((state) => state.setGameEnd)

  // Setup socket event listeners
  useEffect(() => {
    const socket = getGameSocket()
    socketRef.current = socket

    // Room joined
    socket.on('room_joined', (payload) => {
      const data = payload as RoomJoinedPayload
      setPlayers(data.players)
    })

    // Question start
    socket.on('question_start', (payload) => {
      const data = payload as QuestionStartPayload
      setQuestion(data.question, data.questionNumber, data.totalQuestions)
      setPhase('question')
    })

    // Buzzer result
    socket.on('buzzer_result', (payload) => {
      const data = payload as BuzzerResultPayload
      pressBuzzer(data.winnerId, data.timestamp)
      if (data.winnerId === userId) {
        setPhase('answering')
      }
    })

    // Answer result
    socket.on('answer_result', (payload) => {
      const data = payload as AnswerResultPayload
      setAnswerResult(data.isCorrect, data.correctAnswer)
      if (data.isCorrect) {
        updateScore(data.playerId, data.pointsEarned)
      }
      setPhase('results')
    })

    // AI recheck result
    socket.on('ai_recheck_result', (payload) => {
      const data = payload as AIRecheckResultPayload
      setAIRecheckResult({
        isValid: data.isValid,
        explanation: data.explanation,
        confidence: data.confidence,
      })
    })

    // Peer vote result
    socket.on('peer_vote_result', (payload) => {
      const data = payload as PeerVoteResultPayload
      endPeerVote(data.accepted)
    })

    // Game end
    socket.on('game_end', (payload) => {
      const data = payload as GameEndPayload
      setGameEnd(data.finalScores, data.mmrChanges, data.winner)
    })

    return () => {
      // Cleanup listeners would go here
    }
  }, [
    userId,
    setPlayers,
    setPhase,
    setQuestion,
    pressBuzzer,
    setAnswerResult,
    updateScore,
    setAIRecheckResult,
    endPeerVote,
    setGameEnd,
  ])

  const connect = useCallback(async () => {
    const socket = getGameSocket()
    await socket.connect()
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
