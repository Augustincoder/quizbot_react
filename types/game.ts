export type GameMode = 'brain-ring' | 'kahoot' | 'zakovat' | 'erudit'
export type MatchType = 'solo' | '1v1' | 'friends'
export type GamePhase = 'waiting' | 'question' | 'buzzer' | 'answering' | 'results' | 'finished'

export interface Question {
  id: string
  text: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  correctAnswer: string
  options?: string[] // For Kahoot mode
  timeLimit: number // in seconds
  points: number
}

export interface Answer {
  playerId: string
  questionId: string
  answer: string
  timestamp: number
  isCorrect?: boolean
}

export interface AIRecheckResult {
  isValid: boolean
  explanation: string
  confidence: number
}

export interface PeerVote {
  voterId: string
  targetPlayerId: string
  questionId: string
  accepted: boolean
}

export interface GameResult {
  finalScores: Record<string, number>
  mmrChanges: Record<string, number>
  winner: string | null
  questions: Question[]
  answers: Answer[]
}

export interface GameModeConfig {
  id: GameMode
  name: string
  nameUz: string
  description: string
  descriptionUz: string
  icon: string
  questionTime: number
  answerTime: number
  wrongAnswerPenalty: number
  buzzerEnabled: boolean
}

export const GAME_MODES: GameModeConfig[] = [
  {
    id: 'brain-ring',
    name: 'Brain Ring',
    nameUz: 'Brain Ring',
    description: 'Race to buzz in and answer first',
    descriptionUz: 'Birinchi bo\'lib javob bering',
    icon: 'brain',
    questionTime: 15,
    answerTime: 10,
    wrongAnswerPenalty: 0,
    buzzerEnabled: true,
  },
  {
    id: 'kahoot',
    name: 'Kahoot',
    nameUz: 'Kahoot',
    description: 'Choose the correct answer quickly',
    descriptionUz: 'To\'g\'ri javobni tanlang',
    icon: 'gamepad-2',
    questionTime: 20,
    answerTime: 0,
    wrongAnswerPenalty: 0,
    buzzerEnabled: false,
  },
  {
    id: 'zakovat',
    name: 'Zakovat',
    nameUz: 'Zakovat',
    description: 'Rush module with timestamp tracking',
    descriptionUz: 'Vaqt bo\'yicha reyting',
    icon: 'timer',
    questionTime: 60,
    answerTime: 10,
    wrongAnswerPenalty: 0,
    buzzerEnabled: true,
  },
  {
    id: 'erudit',
    name: 'Erudit Kvarteti',
    nameUz: 'Erudit Kvarteti',
    description: 'Brain Ring with -10 penalty for wrong answers',
    descriptionUz: 'Noto\'g\'ri javob uchun -10 ball',
    icon: 'graduation-cap',
    questionTime: 15,
    answerTime: 10,
    wrongAnswerPenalty: -10,
    buzzerEnabled: true,
  },
]
