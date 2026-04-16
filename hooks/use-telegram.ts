'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  getTelegramWebApp,
  getTelegramUser,
  isTelegramEnvironment,
  initializeTelegramApp,
  triggerHaptic,
  getThemeColors,
  showBackButton,
  hideBackButton,
} from '@/lib/telegram'
import { useUserStore } from '@/store/user-store'
import type { TelegramUser } from '@/types/user'

interface UseTelegramReturn {
  isReady: boolean
  isTelegram: boolean
  user: TelegramUser | null
  theme: ReturnType<typeof getThemeColors>
  haptic: typeof triggerHaptic
  showBack: (callback: () => void) => void
  hideBack: () => void
}

export function useTelegram(): UseTelegramReturn {
  const [isReady, setIsReady] = useState(false)
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [theme, setTheme] = useState(getThemeColors())
  const setStoreUser = useUserStore((state) => state.setUser)

  useEffect(() => {
    // Initialize Telegram WebApp
    initializeTelegramApp()
    
    // Get user data
    const tgUser = getTelegramUser()
    if (tgUser) {
      setUser(tgUser)
      setStoreUser(tgUser)
    }
    
    // Update theme
    setTheme(getThemeColors())
    
    // Mark as ready
    setIsReady(true)
    
    // Listen for theme changes
    const webApp = getTelegramWebApp()
    if (webApp) {
      const handleThemeChange = () => {
        setTheme(getThemeColors())
      }
      webApp.onEvent('themeChanged', handleThemeChange)
      
      return () => {
        webApp.offEvent('themeChanged', handleThemeChange)
      }
    }
  }, [setStoreUser])

  const showBack = useCallback((callback: () => void) => {
    showBackButton(callback)
  }, [])

  const hideBack = useCallback(() => {
    hideBackButton()
  }, [])

  return {
    isReady,
    isTelegram: isTelegramEnvironment(),
    user,
    theme,
    haptic: triggerHaptic,
    showBack,
    hideBack,
  }
}
