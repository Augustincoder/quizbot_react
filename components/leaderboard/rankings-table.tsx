'use client'

import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { Crown, Medal } from 'lucide-react'
import type { Player } from '@/types/user'

interface RankingsTableProps {
  players: Array<Player & { rank: number; mmrChange: number }>
  currentUserId: string | null
  className?: string
}

export function RankingsTable({ players, currentUserId, className }: RankingsTableProps) {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-amber-500" />
    if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />
    return <span className="text-sm font-medium text-muted-foreground">{rank}</span>
  }

  return (
    <div className={cn('rounded-xl overflow-hidden border border-border/30', className)}>
      {/* Header */}
      <div className="grid grid-cols-[40px_1fr_80px_80px] gap-2 px-4 py-2 bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground font-medium">
        <span>#</span>
        <span>O&apos;yinchi</span>
        <span className="text-right">Ball</span>
        <span className="text-right">MMR</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/30">
        {players.map((player, index) => {
          const isCurrentUser = player.id === currentUserId
          
          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className={cn(
                'grid grid-cols-[40px_1fr_80px_80px] gap-2 px-4 py-3 items-center',
                isCurrentUser && 'bg-primary/5 border-l-2 border-primary',
                index % 2 === 1 && !isCurrentUser && 'bg-muted/20'
              )}
            >
              {/* Rank */}
              <div className="flex items-center justify-center">
                {getRankIcon(player.rank)}
              </div>

              {/* Player info */}
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={player.avatar} alt={player.username} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    {player.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className={cn(
                  'text-sm font-medium truncate',
                  isCurrentUser ? 'text-primary' : 'text-foreground'
                )}>
                  {player.username}
                  {isCurrentUser && ' (Siz)'}
                </span>
              </div>

              {/* Score */}
              <div className="text-right">
                <span className="text-sm font-semibold text-foreground">
                  {player.score}
                </span>
              </div>

              {/* MMR Change */}
              <div className="text-right">
                <span className={cn(
                  'text-sm font-medium',
                  player.mmrChange > 0 ? 'text-emerald-500' : player.mmrChange < 0 ? 'text-rose-500' : 'text-muted-foreground'
                )}>
                  {player.mmrChange > 0 && '+'}
                  {player.mmrChange}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
