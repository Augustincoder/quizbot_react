'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MMRChangeBadgeProps {
  oldMMR: number
  newMMR: number
  className?: string
}

export function MMRChangeBadge({ oldMMR, newMMR, className }: MMRChangeBadgeProps) {
  const [displayMMR, setDisplayMMR] = useState(oldMMR)
  const change = newMMR - oldMMR
  const isPositive = change > 0
  const isNegative = change < 0

  // Animate the MMR count
  useEffect(() => {
    const duration = 1500
    const steps = 30
    const stepDuration = duration / steps
    const stepValue = (newMMR - oldMMR) / steps

    let currentStep = 0
    const interval = setInterval(() => {
      currentStep++
      if (currentStep >= steps) {
        setDisplayMMR(newMMR)
        clearInterval(interval)
      } else {
        setDisplayMMR(Math.round(oldMMR + stepValue * currentStep))
      }
    }, stepDuration)

    return () => clearInterval(interval)
  }, [oldMMR, newMMR])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'flex flex-col items-center p-6 rounded-2xl',
        'bg-card/50 border border-border/30',
        className
      )}
    >
      {/* MMR Display */}
      <span className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
        Sizning MMR
      </span>
      <motion.span
        key={displayMMR}
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        className="text-4xl font-bold text-foreground tabular-nums"
      >
        {displayMMR}
      </motion.span>

      {/* Change indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={cn(
          'flex items-center gap-1 mt-3 px-3 py-1 rounded-full',
          isPositive && 'bg-emerald-500/10 text-emerald-500',
          isNegative && 'bg-rose-500/10 text-rose-500',
          !isPositive && !isNegative && 'bg-muted text-muted-foreground'
        )}
      >
        {isPositive && <TrendingUp className="h-4 w-4" />}
        {isNegative && <TrendingDown className="h-4 w-4" />}
        {!isPositive && !isNegative && <Minus className="h-4 w-4" />}
        <span className="text-sm font-semibold">
          {isPositive && '+'}
          {change}
        </span>
      </motion.div>
    </motion.div>
  )
}
