export type GameMode = 'brain-ring' | 'kahoot' | 'zakovat' | 'erudit'
export type MatchType = 'solo' | '1v1' | 'friends'
export type GamePhase = 'waiting' | 'question' | 'buzzer' | 'answering' | 'results' | 'finished'

export interface Question {
  id: string
  text: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  correctAnswer: string
  explanation?: string
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
    answerTime: 0, // No separate answer phase — input is always visible
    wrongAnswerPenalty: 0,
    buzzerEnabled: false,
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

// Game mode instruction texts (shown before match)
export const GAME_MODE_INSTRUCTIONS: Record<GameMode, { title: string; rules: string[] }> = {
  'brain-ring': {
    title: 'Brain Ring qoidalari',
    rules: [
      'Savol o\'qiladi, so\'ng buzzer faollashadi.',
      'Birinchi buzzer bosgan o\'yinchi javob beradi.',
      'Noto\'g\'ri javobda 2 soniya kutish — boshqalar davom etadi.',
      'Har savol uchun maksimum 3 ta urinish.',
    ],
  },
  'kahoot': {
    title: 'Kahoot qoidalari',
    rules: [
      'Har savol uchun 4 ta variant beriladi.',
      'To\'g\'ri va tezkor javob ko\'proq ball beradi.',
      'Har savoldan keyin reyting ko\'rsatiladi.',
      'Eng ko\'p ball to\'plagan g\'olib!',
    ],
  },
  'zakovat': {
    title: 'Zakovat qoidalari',
    rules: [
      'Savol o\'qiladi — javob maydoniga yozing.',
      'Buzzer YO\'Q — hamma bir vaqtda javob beradi.',
      'Faqat 1 ta urinish mumkin — o\'ylab yozing.',
      'Tezroq to\'g\'ri javob bergan ko\'proq ball oladi.',
    ],
  },
  'erudit': {
    title: 'Erudit Kvarteti qoidalari',
    rules: [
      'Brain Ring formatida, LEKIN jazo bilan.',
      'Noto\'g\'ri javob uchun -10 ball olinadi!',
      'Buzzer vaqti tugasa ham -10 ball.',
      'Faqat ishonchingiz komil bo\'lsa bosing.',
    ],
  },
}
