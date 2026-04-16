'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TgSafeAreaProps {
  children: ReactNode
  className?: string
  top?: boolean
  bottom?: boolean
}

export function TgSafeArea({ children, className, top = true, bottom = true }: TgSafeAreaProps) {
  return (
    <div
      className={cn(
        'flex flex-col flex-1 overflow-hidden',
        top && 'pt-safe',
        bottom && 'pb-safe',
        className
      )}
      style={{
        paddingTop: top ? 'env(safe-area-inset-top, 0px)' : undefined,
        paddingBottom: bottom ? 'env(safe-area-inset-bottom, 0px)' : undefined,
      }}
    >
      {children}
    </div>
  )
}
