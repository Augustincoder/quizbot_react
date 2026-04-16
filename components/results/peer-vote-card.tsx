'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ThumbsUp, ThumbsDown, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { triggerHaptic } from '@/lib/telegram'

interface PeerVoteCardProps {
  questionText: string
  userAnswer: string
  onVote: (accepted: boolean) => void
  votesYes?: number
  votesNo?: number
  hasVoted?: boolean
  className?: string
}

export function PeerVoteCard({
  questionText,
  userAnswer,
  onVote,
  votesYes = 0,
  votesNo = 0,
  hasVoted = false,
  className,
}: PeerVoteCardProps) {
  const [selectedVote, setSelectedVote] = useState<boolean | null>(null)
  const totalVotes = votesYes + votesNo
  const yesPercentage = totalVotes > 0 ? Math.round((votesYes / totalVotes) * 100) : 50

  const handleVote = (accepted: boolean) => {
    if (hasVoted || selectedVote !== null) return
    
    triggerHaptic('medium')
    setSelectedVote(accepted)
    onVote(accepted)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-4 rounded-xl bg-card/50 border border-border/30',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Jamoaviy ovoz</span>
      </div>

      {/* Question preview */}
      <div className="mb-3 p-3 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground mb-1">Savol:</p>
        <p className="text-sm text-foreground line-clamp-2">{questionText}</p>
      </div>

      {/* User answer */}
      <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
        <p className="text-xs text-muted-foreground mb-1">Javob:</p>
        <p className="text-sm font-medium text-foreground">{userAnswer}</p>
      </div>

      {/* Vote buttons */}
      <div className="flex gap-2 mb-3">
        <Button
          onClick={() => handleVote(true)}
          disabled={hasVoted || selectedVote !== null}
          variant="outline"
          className={cn(
            'flex-1 h-12',
            selectedVote === true && 'bg-emerald-500/10 border-emerald-500/50 text-emerald-600'
          )}
        >
          <ThumbsUp className={cn(
            'h-5 w-5 mr-2',
            selectedVote === true ? 'text-emerald-500' : 'text-muted-foreground'
          )} />
          <span>Qabul</span>
        </Button>
        
        <Button
          onClick={() => handleVote(false)}
          disabled={hasVoted || selectedVote !== null}
          variant="outline"
          className={cn(
            'flex-1 h-12',
            selectedVote === false && 'bg-rose-500/10 border-rose-500/50 text-rose-600'
          )}
        >
          <ThumbsDown className={cn(
            'h-5 w-5 mr-2',
            selectedVote === false ? 'text-rose-500' : 'text-muted-foreground'
          )} />
          <span>Rad</span>
        </Button>
      </div>

      {/* Vote progress */}
      {(selectedVote !== null || hasVoted) && totalVotes > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="pt-2"
        >
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Qabul: {votesYes}</span>
            <span>Rad: {votesNo}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden flex">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${yesPercentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-emerald-500"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${100 - yesPercentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-rose-500"
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
