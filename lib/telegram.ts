import type { TelegramUser } from '@/types/user'

// Telegram WebApp type definitions
interface TelegramWebApp {
  ready: () => void
  expand: () => void
  close: () => void
  enableClosingConfirmation: () => void
  disableClosingConfirmation: () => void
  setHeaderColor: (color: string) => void
  setBackgroundColor: (color: string) => void
  onEvent: (eventType: string, callback: () => void) => void
  offEvent: (eventType: string, callback: () => void) => void
  sendData: (data: string) => void
  switchInlineQuery: (query: string, chatTypes?: string[]) => void
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void
  openTelegramLink: (url: string) => void
  showPopup: (params: { title?: string; message: string; buttons?: Array<{ id?: string; type?: string; text?: string }> }, callback?: (buttonId: string) => void) => void
  showAlert: (message: string, callback?: () => void) => void
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
    selectionChanged: () => void
  }
  MainButton: {
    text: string
    color: string
    textColor: string
    isVisible: boolean
    isActive: boolean
    isProgressVisible: boolean
    setText: (text: string) => void
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
    show: () => void
    hide: () => void
    enable: () => void
    disable: () => void
    showProgress: (leaveActive?: boolean) => void
    hideProgress: () => void
  }
  BackButton: {
    isVisible: boolean
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
    show: () => void
    hide: () => void
  }
  themeParams: {
    bg_color?: string
    text_color?: string
    hint_color?: string
    link_color?: string
    button_color?: string
    button_text_color?: string
    secondary_bg_color?: string
  }
  colorScheme: 'light' | 'dark'
  viewportHeight: number
  viewportStableHeight: number
  initDataUnsafe: {
    user?: TelegramUser
    chat_instance?: string
    chat_type?: string
    start_param?: string
  }
  platform: string
  version: string
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp
  }
  return null
}

export function getTelegramUser(): TelegramUser | null {
  const webApp = getTelegramWebApp()
  return webApp?.initDataUnsafe?.user ?? null
}

export function isTelegramEnvironment(): boolean {
  return getTelegramWebApp() !== null
}

export function initializeTelegramApp(): void {
  const webApp = getTelegramWebApp()
  if (webApp) {
    webApp.ready()
    webApp.expand()
  }
}

export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection'): void {
  const webApp = getTelegramWebApp()
  if (!webApp?.HapticFeedback) return

  switch (type) {
    case 'light':
    case 'medium':
    case 'heavy':
      webApp.HapticFeedback.impactOccurred(type)
      break
    case 'success':
    case 'error':
    case 'warning':
      webApp.HapticFeedback.notificationOccurred(type)
      break
    case 'selection':
      webApp.HapticFeedback.selectionChanged()
      break
  }
}

export function getThemeColors() {
  const webApp = getTelegramWebApp()
  const params = webApp?.themeParams ?? {}
  
  return {
    background: params.bg_color ?? '#ffffff',
    foreground: params.text_color ?? '#000000',
    muted: params.hint_color ?? '#999999',
    primary: params.button_color ?? '#3390ec',
    primaryForeground: params.button_text_color ?? '#ffffff',
    secondary: params.secondary_bg_color ?? '#f4f4f5',
    isDark: webApp?.colorScheme === 'dark',
  }
}

export function showBackButton(callback: () => void): void {
  const webApp = getTelegramWebApp()
  if (webApp?.BackButton) {
    webApp.BackButton.onClick(callback)
    webApp.BackButton.show()
  }
}

export function hideBackButton(): void {
  const webApp = getTelegramWebApp()
  if (webApp?.BackButton) {
    webApp.BackButton.hide()
  }
}
