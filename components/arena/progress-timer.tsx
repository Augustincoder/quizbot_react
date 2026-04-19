'use client'

import { motion } from 'framer-motion'
import { memo, useMemo } from 'react'
import { cn } from '@/lib/utils'

interface ProgressTimerProps {
  timeRemaining: number
  totalTime: number
  variant?: 'bar' | 'circle'
  className?: string
}

function ProgressTimerComponent({
  timeRemaining,
  totalTime,
  variant = 'bar',
  className,
}: ProgressTimerProps) {
  const validTime = Math.max(0, timeRemaining)
  const validTotal = Math.max(1, totalTime)
  const progress = Math.max(0, Math.min(100, (validTime / validTotal) * 100))

  const isLow = validTime <= 5
  const isCritical = validTime <= 3

  const circleProps = useMemo(() => {
    if (variant !== 'circle') return null
    const circumference = 2 * Math.PI * 40
    const strokeDashoffset = circumference - (progress / 100) * circumference
    return { circumference, strokeDashoffset }
  }, [variant, progress])

  if (variant === 'circle' && circleProps) {
    return (
      <div className={cn('relative flex items-center justify-center', className)}>
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-muted/30"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            stroke="currentColor"
            strokeDasharray={circleProps.circumference}
            initial={false}
            animate={{ strokeDashoffset: circleProps.strokeDashoffset }}
            transition={{ duration: 0.3, ease: 'linear' }}
            className={cn(
              'transition-colors duration-300',
              isCritical ? 'text-destructive' : isLow ? 'text-amber-500' : 'text-primary',
            )}
          />
        </svg>
        <motion.span
          className={cn(
            'absolute text-2xl font-bold tabular-nums',
            isCritical ? 'text-destructive' : isLow ? 'text-amber-500' : 'text-foreground',
          )}
          animate={isCritical ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: isCritical ? Infinity : 0 }}
        >
          {validTime}
        </motion.span>
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-muted-foreground">Vaqt</span>
        <motion.span
          className={cn(
            'text-sm font-semibold tabular-nums',
            isCritical ? 'text-destructive' : isLow ? 'text-amber-500' : 'text-foreground',
          )}
          animate={isCritical ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.5, repeat: isCritical ? Infinity : 0 }}
        >
          {validTime}s
        </motion.span>
      </div>

      <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden">
        <motion.div
          className={cn(
            'h-full rounded-full transition-colors duration-300',
            isCritical
              ? 'bg-gradient-to-r from-destructive to-destructive/80'
              : isLow
                ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                : 'bg-gradient-to-r from-primary to-primary/80',
          )}
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'linear' }}
        />
      </div>
    </div>
  )
}

export const ProgressTimer = memo(ProgressTimerComponent, (prev, next) => {
  return prev.timeRemaining === next.timeRemaining && prev.variant === next.variant
})
