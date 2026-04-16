import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TelegramUser } from '@/types/user'
import { BASE_MMR } from '@/lib/constants'

interface UserState {
  // Profile
  id: string | null
  username: string
  avatar: string
  mmr: number
  gamesPlayed: number
  wins: number
  losses: number
  
  // Session
  isAuthenticated: boolean
  telegramUser: TelegramUser | null
  
  // Actions
  setUser: (user: TelegramUser) => void
  updateMMR: (delta: number) => void
  recordGameResult: (won: boolean) => void
  reset: () => void
}

const initialState = {
  id: null,
  username: 'Guest',
  avatar: '',
  mmr: BASE_MMR,
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  isAuthenticated: false,
  telegramUser: null,
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setUser: (user: TelegramUser) => set({
        id: user.id.toString(),
        username: user.username ?? user.first_name,
        avatar: user.photo_url ?? '',
        telegramUser: user,
        isAuthenticated: true,
      }),
      
      updateMMR: (delta: number) => set((state) => ({
        mmr: Math.max(0, state.mmr + delta),
      })),
      
      recordGameResult: (won: boolean) => set((state) => ({
        gamesPlayed: state.gamesPlayed + 1,
        wins: won ? state.wins + 1 : state.wins,
        losses: won ? state.losses : state.losses + 1,
      })),
      
      reset: () => set(initialState),
    }),
    {
      name: 'user-storage',
    }
  )
)
