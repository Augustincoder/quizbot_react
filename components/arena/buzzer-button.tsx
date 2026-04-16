'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useBuzzer } from '@/hooks/use-buzzer'

interface BuzzerButtonProps {
  className?: string
  disabled?: boolean
}

export function BuzzerButton({ className, disabled }: BuzzerButtonProps) {
  const { canPress, isWinner, pressBuzzer } = useBuzzer()
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([])

  const handlePress = useCallback((e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
    if (disabled || !canPress) return

    // Get click position for ripple
    const button = e.currentTarget
    const rect = button.getBoundingClientRect()
    let x, y
    
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = e.clientX - rect.left
      y = e.clientY - rect.top
    }

    // Add ripple
    const rippleId = Date.now()
    setRipples((prev) => [...prev, { id: rippleId, x, y }])

    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== rippleId))
    }, 600)

    pressBuzzer()
  }, [disabled, canPress, pressBuzzer])

  const isDisabled = disabled || !canPress

  return (
    <motion.button
      onClick={handlePress}
      onTouchStart={handlePress}
      disabled={isDisabled}
      animate={
        !isDisabled && !isWinner
          ? { scale: [1, 1.02, 1] }
          : {}
      }
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={cn(
        'relative overflow-hidden',
        'w-[120px] h-[120px] rounded-full',
        'flex items-center justify-center',
        'transition-all duration-200',
        'touch-manipulation',
        isWinner
          ? 'bg-emerald-500/90 border-2 border-emerald-400/50 shadow-lg shadow-emerald-500/30'
          : isDisabled
          ? 'bg-muted/50 border-2 border-border/30'
          : 'bg-primary/90 border-2 border-primary/20 shadow-lg shadow-primary/20',
        'active:scale-[0.95]',
        className
      )}
    >
      {/* Ripple effects */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute w-10 h-10 rounded-full bg-white/30 pointer-events-none"
            style={{
              left: ripple.x - 20,
              top: ripple.y - 20,
            }}
          />
        ))}
      </AnimatePresence>

      {/* Button content */}
      <span
        className={cn(
          'relative z-10 text-lg font-bold uppercase tracking-wider',
          isWinner
            ? 'text-white'
            : isDisabled
            ? 'text-muted-foreground'
            : 'text-primary-foreground'
        )}
      >
        {isWinner ? 'Siz!' : 'Buzzer'}
      </span>

      {/* Glow effect */}
      {!isDisabled && !isWinner && (
        <motion.div
          className="absolute inset-0 -z-10 rounded-full bg-primary/30 blur-xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </motion.button>
  )
}
