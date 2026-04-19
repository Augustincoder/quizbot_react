import type { GameMode, Question, AIRecheckResult } from './game'
import type { Player } from './user'

export type SocketEventType =
  | 'connect'
  | 'disconnect'
  | 'join_room'
  | 'room_joined'
  | 'player_joined'
  | 'player_left'
  | 'game_start'
  | 'question_start'
  | 'time_up'
  | 'buzzer_pressed'
  | 'buzzer_result'
  | 'answer_submitted'
  | 'answer_result'
  | 'ai_recheck_requested'
  | 'ai_recheck_result'
  | 'peer_vote_start'
  | 'peer_vote_cast'
  | 'peer_vote_result'
  | 'score_update'
  | 'game_end'
  | 'error'
  | 'zakovat_results'
  | 'zakovat:rush_result'
  | 'game:question'
  | 'game:phase_action'
  | 'game:round_result'
  | 'buzzer:locked'
  | 'buzzer:reactivate'
  | 'buzzer:result'

export interface SocketEvent {
  type: SocketEventType
  payload?: unknown
}

export interface JoinRoomPayload {
  roomId: string
  mode: GameMode
  matchType: 'solo' | '1v1' | 'friends'
}

export interface RoomJoinedPayload {
  roomId: string
  players: Player[]
  mode: GameMode
}

export interface QuestionStartPayload {
  question: Question
  duration: number
  questionNumber: number
  totalQuestions: number
}

export interface BuzzerPressedPayload {
  playerId: string
  timestamp: number
}

export interface BuzzerResultPayload {
  winnerId: string
  timestamp: number
}

export interface AnswerSubmittedPayload {
  playerId: string
  answer: string
  timestamp: number
}

export interface AnswerResultPayload {
  playerId: string
  isCorrect: boolean
  correctAnswer: string
  pointsEarned: number
}

export interface AIRecheckRequestPayload {
  questionId: string
  playerId: string
  answer: string
}

export interface AIRecheckResultPayload extends AIRecheckResult {
  questionId: string
  playerId: string
}

export interface PeerVoteStartPayload {
  questionId: string
  playerId: string
  answer: string
}

export interface PeerVoteCastPayload {
  voterId: string
  vote: boolean
}

export interface PeerVoteResultPayload {
  accepted: boolean
  votes: Record<string, boolean>
  totalYes: number
  totalNo: number
}

export interface ScoreUpdatePayload {
  scores: Record<string, number>
}

export interface GameEndPayload {
  finalScores: Record<string, number>
  mmrChanges: Record<string, number>
  winner: string | null
}

export interface ErrorPayload {
  code: string
  message: string
}
