// Game timing constants
export const SPLASH_DURATION = 2000 // 2 seconds
export const MATCHMAKING_TIMEOUT = 30000 // 30 seconds
export const BUZZER_WINDOW = 100 // 100ms window for simultaneous buzzes

// Default game settings
export const DEFAULT_QUESTION_TIME = 15 // seconds
export const DEFAULT_ANSWER_TIME = 10 // seconds
export const QUESTIONS_PER_GAME = 10

// Scoring
export const BASE_POINTS = 10
export const TIME_BONUS_MULTIPLIER = 0.5
export const WRONG_ANSWER_PENALTY = -10 // For Erudit mode

// MMR
export const BASE_MMR = 1000
export const MMR_K_FACTOR = 32

// Animation durations (in ms)
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  splash: 2000,
}

// Telegram Mini App
export const TG_EXPAND_VIEWPORT = true
export const TG_ENABLE_CLOSING_CONFIRMATION = false
