'use client'

import { motion } from 'framer-motion'
import { Trophy, Target, Clock, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScoreSummaryProps {
  totalScore: number
  correctAnswers: number
  totalQuestions: number
  averageTime?: number
  className?: string
}

export function ScoreSummary({
  totalScore,
  correctAnswers,
  totalQuestions,
  averageTime,
  className,
}: ScoreSummaryProps) {
  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

  const stats = [
    {
      icon: Trophy,
      label: 'Umumiy ball',
      value: totalScore.toString(),
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      icon: Target,
      label: 'Aniqlik',
      value: `${accuracy}%`,
      color: accuracy >= 70 ? 'text-emerald-500' : accuracy >= 40 ? 'text-amber-500' : 'text-rose-500',
      bgColor: accuracy >= 70 ? 'bg-emerald-500/10' : accuracy >= 40 ? 'bg-amber-500/10' : 'bg-rose-500/10',
    },
    {
      icon: Zap,
      label: 'To\'g\'ri javoblar',
      value: `${correctAnswers}/${totalQuestions}`,
      color: 'text-sky-500',
      bgColor: 'bg-sky-500/10',
    },
  ]

  if (averageTime) {
    stats.push({
      icon: Clock,
      label: 'O\'rtacha vaqt',
      value: `${averageTime.toFixed(1)}s`,
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
    })
  }

  return (
    <div className={cn('grid grid-cols-2 gap-3', className)}>
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="flex flex-col items-center p-4 rounded-xl bg-card/50 border border-border/30"
          >
            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center mb-2', stat.bgColor)}>
              <Icon className={cn('h-5 w-5', stat.color)} />
            </div>
            <span className={cn('text-2xl font-bold', stat.color)}>{stat.value}</span>
            <span className="text-xs text-muted-foreground mt-1">{stat.label}</span>
          </motion.div>
        )
      })}
    </div>
  )
}
