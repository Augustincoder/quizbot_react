'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

import { useGameStore } from '@/store/game-store'

interface BlurOverlayProps {
  show?: boolean
  children?: ReactNode
  className?: string
}

export function BlurOverlay({ show, children, className }: BlurOverlayProps) {
  const currentPhase = useGameStore((state) => state.currentPhase)
  const isShow = currentPhase === 'reading' || show

  return (
    <AnimatePresence>
      {isShow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'fixed inset-0 z-40',
            'bg-background/60 backdrop-blur-md',
            'flex items-center justify-center',
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
