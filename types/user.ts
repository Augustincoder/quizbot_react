export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  photo_url?: string
}

export interface User {
  id: string
  username: string
  avatar: string
  mmr: number
  gamesPlayed: number
  wins: number
  losses: number
}

export interface Player extends User {
  isReady: boolean
  score: number
  connected: boolean
}
