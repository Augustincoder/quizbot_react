'use client'

import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Swords } from 'lucide-react'
import type { Player } from '@/types/user'

interface OpponentFoundProps {
  currentPlayer: Player
  opponent: Player
}

export function OpponentFound({ currentPlayer, opponent }: OpponentFoundProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6"
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <h2 className="text-xl font-semibold text-foreground">Raqib topildi!</h2>
        <p className="text-sm text-muted-foreground mt-1">O&apos;yin boshlanmoqda...</p>
      </motion.div>

      <div className="flex items-center gap-6">
        {/* Current Player */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="flex flex-col items-center gap-2"
        >
          <Avatar className="h-16 w-16 border-2 border-primary/50">
            <AvatarImage src={currentPlayer.avatar} alt={currentPlayer.username} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {currentPlayer.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-foreground">
            {currentPlayer.username}
          </span>
          <span className="text-xs text-muted-foreground">
            {currentPlayer.mmr} MMR
          </span>
        </motion.div>

        {/* VS Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"
        >
          <Swords className="h-6 w-6 text-primary" />
        </motion.div>

        {/* Opponent */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="flex flex-col items-center gap-2"
        >
          <Avatar className="h-16 w-16 border-2 border-destructive/50">
            <AvatarImage src={opponent.avatar} alt={opponent.username} />
            <AvatarFallback className="bg-destructive/10 text-destructive font-semibold">
              {opponent.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-foreground">
            {opponent.username}
          </span>
          <span className="text-xs text-muted-foreground">
            {opponent.mmr} MMR
          </span>
        </motion.div>
      </div>

      {/* Loading bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="w-48 h-1 bg-muted rounded-full overflow-hidden"
      >
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 2, ease: 'easeInOut' }}
        />
      </motion.div>
    </motion.div>
  )
}
