'use client'

import { useEffect, useCallback, useRef } from 'react'
import { getGameSocket, resetGameSocket, GameSocket } from '@/services/game-socket'
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
  const socketRef = useRef<GameSocket | null>(null)
  
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

    const onRoomJoined = (payload: any) => {
      const data = payload as RoomJoinedPayload
      setPlayers(data.players)
    }

    const onQuestionStart = (payload: any) => {
      const data = payload as QuestionStartPayload
      setQuestion(data.question, data.questionNumber, data.totalQuestions)
      setPhase('question')
    }

    const onBuzzerResult = (payload: any) => {
      const data = payload as BuzzerResultPayload
      pressBuzzer(data.winnerId, data.timestamp)
      if (data.winnerId === userId) {
        setPhase('answering')
      }
    }

    const onAnswerResult = (payload: any) => {
      const data = payload as AnswerResultPayload
      setAnswerResult(data.playerId, data.isCorrect, data.correctAnswer, data.pointsEarned)
      if (data.playerId && data.pointsEarned !== 0) {
        updateScore(data.playerId, data.pointsEarned)
      }
    }

    const onAiRecheckResult = (payload: any) => {
      const data = payload as AIRecheckResultPayload
      setAIRecheckResult({
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

    const onPeerVoteResult = (payload: any) => {
      const data = payload as PeerVoteResultPayload
      endPeerVote(data.accepted)
    }

    const onZakovatResults = (payload: any) => {
      useGameStore.getState().setZakovatResults(payload.results, payload.correctAnswer)
    }

    const onGameEnd = (payload: any) => {
      const data = payload as GameEndPayload
      setGameEnd(data.finalScores, data.mmrChanges, data.winner)
    }

    const onGameQuestion = (payload: any) => {
      useGameStore.getState().setQuestion(
        payload.question, 
        payload.index + 1, 
        payload.total, 
        payload.readTimerMs
      )
    }

    const onGamePhaseAction = () => {
      useGameStore.getState().setCurrentPhase('action')
    }

    const onBuzzerLocked = (payload: any) => {
      useGameStore.getState().setBuzzerLockedBy(payload.userId)
      useGameStore.getState().setCurrentPhase('input')
    }

    const onBuzzerReactivate = (payload: any) => {
      useGameStore.getState().setCurrentPhase('action')
      useGameStore.getState().setBuzzerLockedBy(null)
    }

    const onGameRoundResult = (payload: any) => {
      useGameStore.getState().setRoundResults(payload)
      useGameStore.getState().setCurrentPhase('leaderboard')
      
      const scoresMap: Record<string, number> = {}
      if (payload.scores) {
         payload.scores.forEach((s: any) => { scoresMap[s.userId] = s.score })
         useGameStore.getState().setScores(scoresMap)
      }
    }

    const onBuzzerResultPhase3 = (payload: any) => {
       if (!payload.correct) {
          const currentLocked = useGameStore.getState().lockedPlayers
          if (!currentLocked.includes(payload.userId)) {
             useGameStore.getState().setLockedPlayers([...currentLocked, payload.userId])
          }
       }
    }

    socket.on('room_joined', onRoomJoined)
    socket.on('question_start', onQuestionStart)
    socket.on('buzzer_result', onBuzzerResult)
    socket.on('answer_result', onAnswerResult)
    socket.on('ai_recheck_result', onAiRecheckResult)
    socket.on('peer_vote_result', onPeerVoteResult)
    socket.on('zakovat_results', onZakovatResults)
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
      socket.off('ai_recheck_result', onAiRecheckResult)
      socket.off('peer_vote_result', onPeerVoteResult)
      socket.off('zakovat_results', onZakovatResults)
      socket.off('game_end', onGameEnd)
      
      socket.off('game:question', onGameQuestion)
      socket.off('game:phase_action', onGamePhaseAction)
      socket.off('buzzer:locked', onBuzzerLocked)
      socket.off('buzzer:reactivate', onBuzzerReactivate)
      socket.off('game:round_result', onGameRoundResult)
      socket.off('buzzer:result', onBuzzerResultPhase3)
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
