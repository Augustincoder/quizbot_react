'use client'

import { useEffect, type ReactNode } from 'react'
import { useTelegram } from '@/hooks/use-telegram'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: ReactNode
  className?: string
}

export function AppShell({ children, className }: AppShellProps) {
  const { theme, isTelegram } = useTelegram()

  useEffect(() => {
    // Apply Telegram theme variables as CSS custom properties
    if (isTelegram) {
      document.documentElement.style.setProperty('--tg-bg', theme.background)
      document.documentElement.style.setProperty('--tg-fg', theme.foreground)
      document.documentElement.style.setProperty('--tg-primary', theme.primary)
      document.documentElement.style.setProperty('--tg-muted', theme.muted)
    }
    
    // Prevent pull-to-refresh and overscroll
    document.body.style.overscrollBehavior = 'none'
    document.documentElement.style.overscrollBehavior = 'none'
    
    return () => {
      document.body.style.overscrollBehavior = ''
      document.documentElement.style.overscrollBehavior = ''
    }
  }, [isTelegram, theme])

  return (
    <div
      className={cn(
        'h-dvh w-full overflow-hidden bg-background text-foreground',
        'flex flex-col',
        'touch-none select-none',
        className
      )}
      style={{
        // Use Telegram viewport height if available
        height: 'var(--tg-viewport-stable-height, 100dvh)',
      }}
    >
      {children}
    </div>
  )
}
