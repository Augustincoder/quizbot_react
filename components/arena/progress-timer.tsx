'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressTimerProps {
  timeRemaining: number
  totalTime: number
  variant?: 'bar' | 'circle'
  className?: string
}

export function ProgressTimer({
  timeRemaining,
  totalTime,
  variant = 'bar',
  className,
}: ProgressTimerProps) {
  const validTime = timeRemaining || 0
  const validTotal = totalTime || 1
  const progress = Math.max(0, Math.min(100, (validTime / validTotal) * 100)) || 0
  
  const isLow = validTime <= 5
  const isCritical = validTime <= 3

  if (variant === 'circle') {
    const circumference = 2 * Math.PI * 40
    const strokeDashoffset = circumference - (progress / 100) * circumference

    return (
      <div className={cn('relative flex items-center justify-center', className)}>
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-muted/30"
          />
          {/* Progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            stroke="currentColor"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.3, ease: 'linear' }}
            className={cn(
              'transition-colors duration-300',
              isCritical ? 'text-destructive' : isLow ? 'text-amber-500' : 'text-primary'
            )}
          />
        </svg>
        {/* Time text */}
        <motion.span
          className={cn(
            'absolute text-2xl font-bold tabular-nums',
            isCritical ? 'text-destructive' : isLow ? 'text-amber-500' : 'text-foreground'
          )}
          animate={isCritical ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: isCritical ? Infinity : 0 }}
        >
          {timeRemaining}
        </motion.span>
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Time display */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-muted-foreground">Vaqt</span>
        <motion.span
          className={cn(
            'text-sm font-semibold tabular-nums',
            isCritical ? 'text-destructive' : isLow ? 'text-amber-500' : 'text-foreground'
          )}
          animate={isCritical ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.5, repeat: isCritical ? Infinity : 0 }}
        >
          {timeRemaining}s
        </motion.span>
      </div>
      
      {/* Progress bar */}
      <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden">
        <motion.div
          className={cn(
            'h-full rounded-full transition-colors duration-300',
            isCritical
              ? 'bg-gradient-to-r from-destructive to-destructive/80'
              : isLow
              ? 'bg-gradient-to-r from-amber-500 to-amber-400'
              : 'bg-gradient-to-r from-primary to-primary/80'
          )}
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'linear' }}
        />
      </div>
    </div>
  )
}
