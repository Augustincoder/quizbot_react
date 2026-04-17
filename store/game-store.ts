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
  answeredPlayerId: string | null
  pointsEarned: number
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
  
  // Phase 4 Engine State
  currentPhase: 'waiting' | 'reading' | 'action' | 'input' | 'leaderboard'
  dynamicTimerMs: number
  lockedPlayers: string[]
  buzzerLockedBy: string | null
  roundResults: any | null

  // Actions
  setRoom: (roomId: string, mode: GameMode, matchType: MatchType) => void
  setPlayers: (players: Player[]) => void
  setCurrentPlayer: (playerId: string) => void
  setPhase: (phase: GamePhase) => void
  setCurrentPhase: (phase: 'waiting' | 'reading' | 'action' | 'input' | 'leaderboard') => void
  setQuestion: (question: Question | any, questionNumber: number, totalQuestions: number, dynamicTimerMs?: number) => void
  setTimeRemaining: (time: number) => void
  setTimerActive: (active: boolean) => void
  setDynamicTimerMs: (ms: number) => void
  setLockedPlayers: (players: string[]) => void
  setBuzzerLockedBy: (playerId: string | null) => void
  setRoundResults: (results: any) => void
  pressBuzzer: (playerId: string, timestamp: number) => void
  lockBuzzer: () => void
  submitAnswer: (answer: string) => void
  setAnswerResult: (playerId: string | null, isCorrect: boolean, correctAnswer: string, pointsEarned: number) => void
  updateScore: (playerId: string, delta: number) => void
  setScores: (scores: Record<string, number>) => void
  requestAIRecheck: () => void
  setAIRecheckResult: (result: AIRecheckResult) => void
  startPeerVote: () => void
  castPeerVote: (playerId: string, vote: boolean) => void
  endPeerVote: (accepted: boolean) => void
  setGameEnd: (finalScores: Record<string, number>, mmrChanges: Record<string, number>, winner: string | null) => void
  setZakovatResults: (results: Array<{playerId: string, isCorrect: boolean, pointsEarned: number}>, correctAnswer: string) => void
  zakovatResults: Array<{playerId: string, isCorrect: boolean, pointsEarned: number}> | null
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
  currentPhase: 'waiting' as const,
  dynamicTimerMs: 0,
  lockedPlayers: [],
  buzzerLockedBy: null,
  roundResults: null,
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
  answeredPlayerId: null,
  pointsEarned: 0,
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
  zakovatResults: null,
}

export const useGameStore = create<GameState>()((set) => ({
  ...initialState,
  
  setRoom: (roomId, mode, matchType) => set({
    roomId,
    mode,
    matchType,
    phase: 'waiting',
    currentPhase: 'waiting',
  }),
  
  setPlayers: (players) => set({ players }),
  
  setCurrentPlayer: (playerId) => set({ currentPlayerId: playerId }),
  
  setPhase: (phase) => set({ phase }),
  
  setCurrentPhase: (phase) => set({ currentPhase: phase }),

  setQuestion: (question, questionNumber, totalQuestions, dynamicTimerMs = 15000) => set({
    currentQuestion: question,
    questionNumber,
    totalQuestions,
    dynamicTimerMs,
    currentPhase: 'reading',
    phase: 'question',
    lockedPlayers: [],
    buzzerLockedBy: null,
    buzzerWinner: null,
    buzzerTimestamp: null,
    buzzerLocked: false,
    submittedAnswer: null,
    isCorrect: null,
    correctAnswer: null,
    roundResults: null,
    aiRecheckPending: false,
    aiRecheckResult: null,
    peerVoteActive: false,
    peerVotes: {},
  }),
  
  setDynamicTimerMs: (ms) => set({ dynamicTimerMs: ms }),
  setLockedPlayers: (players) => set({ lockedPlayers: players }),
  setBuzzerLockedBy: (playerId) => set({ buzzerLockedBy: playerId }),
  setRoundResults: (results) => set({ roundResults: results, currentPhase: 'leaderboard' }),
  
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
  
  setAnswerResult: (playerId, isCorrect, correctAnswer, pointsEarned) => set({
    answeredPlayerId: playerId,
    isCorrect,
    correctAnswer,
    pointsEarned,
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
  
  setZakovatResults: (results, correctAnswer) => set({
    zakovatResults: results,
    correctAnswer: correctAnswer,
    phase: 'results',
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
