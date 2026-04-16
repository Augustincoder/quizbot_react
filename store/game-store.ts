import { create } from 'zustand'
import type { GameMode, MatchType, GamePhase, Question, AIRecheckResult } from '@/types/game'
import type { Player } from '@/types/user'

interface GameState {
  // Room
  roomId: string | null
  mode: GameMode | null
  matchType: MatchType | null
  
  // Players
  players: Player[]
  currentPlayerId: string | null
  
  // Question Phase
  phase: GamePhase
  currentQuestion: Question | null
  questionNumber: number
  totalQuestions: number
  questionStartTime: number | null
  
  // Timer
  timeRemaining: number
  timerActive: boolean
  
  // Buzzer
  buzzerWinner: string | null
  buzzerTimestamp: number | null
  buzzerLocked: boolean
  
  // Answers
  submittedAnswer: string | null
  isCorrect: boolean | null
  correctAnswer: string | null
  
  // Scores
  scores: Record<string, number>
  
  // AI Recheck
  aiRecheckPending: boolean
  aiRecheckResult: AIRecheckResult | null
  
  // Peer Vote
  peerVoteActive: boolean
  peerVotes: Record<string, boolean>
  
  // Final Results
  finalScores: Record<string, number> | null
  mmrChanges: Record<string, number> | null
  winner: string | null
  
  // Actions
  setRoom: (roomId: string, mode: GameMode, matchType: MatchType) => void
  setPlayers: (players: Player[]) => void
  setCurrentPlayer: (playerId: string) => void
  setPhase: (phase: GamePhase) => void
  setQuestion: (question: Question, questionNumber: number, totalQuestions: number) => void
  setTimeRemaining: (time: number) => void
  setTimerActive: (active: boolean) => void
  pressBuzzer: (playerId: string, timestamp: number) => void
  lockBuzzer: () => void
  submitAnswer: (answer: string) => void
  setAnswerResult: (isCorrect: boolean, correctAnswer: string) => void
  updateScore: (playerId: string, delta: number) => void
  setScores: (scores: Record<string, number>) => void
  requestAIRecheck: () => void
  setAIRecheckResult: (result: AIRecheckResult) => void
  startPeerVote: () => void
  castPeerVote: (playerId: string, vote: boolean) => void
  endPeerVote: (accepted: boolean) => void
  setGameEnd: (finalScores: Record<string, number>, mmrChanges: Record<string, number>, winner: string | null) => void
  resetQuestion: () => void
  reset: () => void
}

const initialState = {
  roomId: null,
  mode: null,
  matchType: null,
  players: [],
  currentPlayerId: null,
  phase: 'waiting' as GamePhase,
  currentQuestion: null,
  questionNumber: 0,
  totalQuestions: 0,
  questionStartTime: null,
  timeRemaining: 0,
  timerActive: false,
  buzzerWinner: null,
  buzzerTimestamp: null,
  buzzerLocked: false,
  submittedAnswer: null,
  isCorrect: null,
  correctAnswer: null,
  scores: {},
  aiRecheckPending: false,
  aiRecheckResult: null,
  peerVoteActive: false,
  peerVotes: {},
  finalScores: null,
  mmrChanges: null,
  winner: null,
}

export const useGameStore = create<GameState>()((set) => ({
  ...initialState,
  
  setRoom: (roomId, mode, matchType) => set({
    roomId,
    mode,
    matchType,
    phase: 'waiting',
  }),
  
  setPlayers: (players) => set({ players }),
  
  setCurrentPlayer: (playerId) => set({ currentPlayerId: playerId }),
  
  setPhase: (phase) => set({ phase }),
  
  setQuestion: (question, questionNumber, totalQuestions) => set({
    currentQuestion: question,
    questionNumber,
    totalQuestions,
    questionStartTime: Date.now(),
    timeRemaining: question.timeLimit,
    phase: 'question',
    buzzerWinner: null,
    buzzerTimestamp: null,
    buzzerLocked: false,
    submittedAnswer: null,
    isCorrect: null,
    correctAnswer: null,
    aiRecheckPending: false,
    aiRecheckResult: null,
    peerVoteActive: false,
    peerVotes: {},
  }),
  
  setTimeRemaining: (time) => set({ timeRemaining: time }),
  
  setTimerActive: (active) => set({ timerActive: active }),
  
  pressBuzzer: (playerId, timestamp) => set((state) => {
    if (state.buzzerLocked || state.buzzerWinner) return state
    return {
      buzzerWinner: playerId,
      buzzerTimestamp: timestamp,
      buzzerLocked: true,
      phase: 'answering',
    }
  }),
  
  lockBuzzer: () => set({ buzzerLocked: true }),
  
  submitAnswer: (answer) => set({
    submittedAnswer: answer,
  }),
  
  setAnswerResult: (isCorrect, correctAnswer) => set({
    isCorrect,
    correctAnswer,
    phase: 'results',
  }),
  
  updateScore: (playerId, delta) => set((state) => ({
    scores: {
      ...state.scores,
      [playerId]: (state.scores[playerId] ?? 0) + delta,
    },
  })),
  
  setScores: (scores) => set({ scores }),
  
  requestAIRecheck: () => set({ aiRecheckPending: true }),
  
  setAIRecheckResult: (result) => set({
    aiRecheckPending: false,
    aiRecheckResult: result,
  }),
  
  startPeerVote: () => set({
    peerVoteActive: true,
    peerVotes: {},
  }),
  
  castPeerVote: (playerId, vote) => set((state) => ({
    peerVotes: {
      ...state.peerVotes,
      [playerId]: vote,
    },
  })),
  
  endPeerVote: (accepted) => set((state) => ({
    peerVoteActive: false,
    isCorrect: accepted ? true : state.isCorrect,
  })),
  
  setGameEnd: (finalScores, mmrChanges, winner) => set({
    finalScores,
    mmrChanges,
    winner,
    phase: 'finished',
  }),
  
  resetQuestion: () => set({
    currentQuestion: null,
    questionStartTime: null,
    timeRemaining: 0,
    buzzerWinner: null,
    buzzerTimestamp: null,
    buzzerLocked: false,
    submittedAnswer: null,
    isCorrect: null,
    correctAnswer: null,
    aiRecheckPending: false,
    aiRecheckResult: null,
    peerVoteActive: false,
    peerVotes: {},
  }),
  
  reset: () => set(initialState),
}))
