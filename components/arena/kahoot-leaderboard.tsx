'use client'

import { motion } from 'framer-motion'
import { Trophy, TrendingUp, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeaderboardEntry {
  playerId: string
  playerName: string
  score: number
  delta: number // Points gained from last question
  isCurrentUser?: boolean
}

interface KahootLeaderboardProps {
  entries: LeaderboardEntry[]
  questionNumber: number
  totalQuestions: number
  onContinue?: () => void
  className?: string
}

const rankColors = [
  'from-amber-400 to-amber-500',    // 1st
  'from-slate-300 to-slate-400',     // 2nd
  'from-amber-600 to-amber-700',     // 3rd
]

const rankEmojis = ['🥇', '🥈', '🥉']

export function KahootLeaderboard({
  entries,
  questionNumber,
  totalQuestions,
  onContinue,
  className,
}: KahootLeaderboardProps) {
  const sorted = [...entries].sort((a, b) => b.score - a.score)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn('flex flex-col h-full', className)}
    >
      {/* Header */}
      <div className="p-4 text-center border-b border-border/30">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Reyting
          </span>
          <h2 className="text-lg font-bold text-foreground mt-1">
            {questionNumber}/{totalQuestions} savol
          </h2>
        </motion.div>
      </div>

      {/* Leaderboard list */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex flex-col gap-2">
          {sorted.map((entry, index) => (
            <motion.div
              key={entry.playerId}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + index * 0.1, duration: 0.3 }}
              layout
              className={cn(
                'flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300',
                entry.isCurrentUser
                  ? 'bg-primary/8 border-primary/30 shadow-sm shadow-primary/5'
                  : 'bg-card/50 border-border/20'
              )}
            >
              {/* Rank */}
              <div className="flex items-center justify-center w-10 shrink-0">
                {index < 3 ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3 + index * 0.1, type: 'spring', stiffness: 300 }}
                    className={cn(
                      'flex items-center justify-center w-9 h-9 rounded-xl',
                      'bg-gradient-to-br shadow-sm',
                      rankColors[index]
                    )}
                  >
                    <span className="text-base">{rankEmojis[index]}</span>
                  </motion.div>
                ) : (
                  <span className="text-lg font-bold text-muted-foreground/60 tabular-nums">
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Player info */}
              <div className="flex-1 min-w-0">
                <span
                  className={cn(
                    'block text-sm font-semibold truncate',
                    entry.isCurrentUser ? 'text-primary' : 'text-foreground'
                  )}
                >
                  {entry.playerName}
                  {entry.isCurrentUser && (
                    <span className="text-xs font-normal text-muted-foreground ml-1">(siz)</span>
                  )}
                </span>
              </div>

              {/* Score + delta */}
              <div className="flex items-center gap-2 shrink-0">
                {entry.delta !== 0 && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className={cn(
                      'flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full',
                      entry.delta > 0
                        ? 'text-emerald-600 bg-emerald-500/10'
                        : 'text-rose-500 bg-rose-500/10'
                    )}
                  >
                    {entry.delta > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <Minus className="h-3 w-3" />
                    )}
                    {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                  </motion.span>
                )}
                <div className="flex items-center gap-1">
                  <Trophy className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-sm font-bold text-foreground tabular-nums">
                    {entry.score}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Continue hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        onClick={onContinue}
        className="p-4 border-t border-border/30 cursor-pointer"
      >
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-center text-sm text-muted-foreground"
        >
          Davom etish uchun bosing...
        </motion.p>
      </motion.div>
    </motion.div>
  )
}
