'use client'

import { motion } from 'framer-motion'
import { ShieldCheck, Brain, Gamepad2, Timer, GraduationCap } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { GameMode } from '@/types/game'
import { GAME_MODE_INSTRUCTIONS } from '@/types/game'

interface InstructionModalProps {
  open: boolean
  mode: GameMode | null
  onConfirm: () => void
}

const modeIcons: Record<GameMode, typeof Brain> = {
  'brain-ring': Brain,
  'kahoot': Gamepad2,
  'zakovat': Timer,
  'erudit': GraduationCap,
}

const modeAccentColors: Record<GameMode, string> = {
  'brain-ring': 'text-sky-500',
  'kahoot': 'text-violet-500',
  'zakovat': 'text-amber-500',
  'erudit': 'text-rose-500',
}

const modeAccentBg: Record<GameMode, string> = {
  'brain-ring': 'bg-sky-500/10',
  'kahoot': 'bg-violet-500/10',
  'zakovat': 'bg-amber-500/10',
  'erudit': 'bg-rose-500/10',
}

export function InstructionModal({
  open,
  mode,
  onConfirm,
}: InstructionModalProps) {
  if (!mode) return null

  const instructions = GAME_MODE_INSTRUCTIONS[mode]
  const Icon = modeIcons[mode]
  const accentColor = modeAccentColors[mode]
  const accentBg = modeAccentBg[mode]

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        className="rounded-3xl border-border/30 bg-background/98 backdrop-blur-xl max-w-[340px] p-0 gap-0"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="pt-8 pb-4 px-6 text-center">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 250, delay: 0.1 }}
            className="mx-auto mb-4"
          >
            <div
              className={cn(
                'flex h-16 w-16 items-center justify-center rounded-2xl',
                accentBg
              )}
            >
              <Icon className={cn('h-8 w-8', accentColor)} />
            </div>
          </motion.div>

          <DialogTitle className="text-xl font-bold">
            {instructions.title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm mt-1">
            O&apos;yinni boshlashdan oldin qoidalarni o&apos;qing
          </DialogDescription>
        </DialogHeader>

        {/* Rules list */}
        <div className="px-6 pb-4">
          <div className="flex flex-col gap-2.5">
            {instructions.rules.map((rule, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.08 }}
                className="flex gap-3 items-start"
              >
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full shrink-0 mt-0.5',
                    accentBg
                  )}
                >
                  <span className={cn('text-xs font-bold', accentColor)}>
                    {index + 1}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {rule}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Confirm button */}
        <div className="px-6 pb-6 pt-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              onClick={onConfirm}
              className="w-full h-12 rounded-xl text-base font-semibold gap-2"
            >
              <ShieldCheck className="h-5 w-5" />
              Tushundim
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
