'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface BlurOverlayProps {
  show: boolean
  children?: ReactNode
  className?: string
}

export function BlurOverlay({ show, children, className }: BlurOverlayProps) {
  return (
    <AnimatePresence>
      {show && (
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
