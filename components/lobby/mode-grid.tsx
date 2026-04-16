'use client'

import { motion } from 'framer-motion'
import { Brain, Gamepad2, Timer, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GameMode } from '@/types/game'
import { GAME_MODES } from '@/types/game'
import { triggerHaptic } from '@/lib/telegram'

const iconMap = {
  'brain': Brain,
  'gamepad-2': Gamepad2,
  'timer': Timer,
  'graduation-cap': GraduationCap,
}

interface ModeGridProps {
  onSelectMode: (mode: GameMode) => void
}

export function ModeGrid({ onSelectMode }: ModeGridProps) {
  const handleSelect = (mode: GameMode) => {
    triggerHaptic('light')
    onSelectMode(mode)
  }

  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {GAME_MODES.map((mode, index) => {
        const Icon = iconMap[mode.icon as keyof typeof iconMap] || Brain
        
        return (
          <motion.button
            key={mode.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            onClick={() => handleSelect(mode.id)}
            className={cn(
              'group relative flex flex-col items-center justify-center gap-3',
              'aspect-square rounded-2xl p-4',
              'bg-card/50 backdrop-blur-sm',
              'border border-border/30',
              'transition-all duration-200',
              'hover:bg-card/70 hover:border-border/50',
              'active:scale-[0.98]'
            )}
          >
            {/* Icon */}
            <div className={cn(
              'flex h-14 w-14 items-center justify-center rounded-xl',
              'bg-primary/10 text-primary',
              'transition-transform duration-200',
              'group-hover:scale-105'
            )}>
              <Icon className="h-7 w-7" />
            </div>
            
            {/* Label */}
            <div className="text-center">
              <span className="block text-sm font-medium text-foreground">
                {mode.nameUz}
              </span>
              <span className="block text-xs text-muted-foreground mt-0.5">
                {mode.descriptionUz}
              </span>
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
