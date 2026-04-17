'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Bot, AlertTriangle, Clock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { GameMode } from '@/types/game'

interface PlayerResult {
  playerId: string
  playerName: string
  answer: string | null
  isCorrect: boolean
  pointsDelta: number
  newScore: number
  isCurrentUser?: boolean
}

interface PostQuestionResultProps {
  mode: GameMode
  correctAnswer: string
  results: PlayerResult[]
  questionText: string
  onContinue: () => void
  onAppeal?: (playerId: string, answer: string) => void
  className?: string
}

export function PostQuestionResult({
  mode,
  correctAnswer,
  results,
  questionText,
  onContinue,
  onAppeal,
  className,
}: PostQuestionResultProps) {
  const isErudit = mode === 'erudit'
  const showAppeal = mode === 'brain-ring' || mode === 'erudit'

  // Find current user result for appeal
  const currentUserResult = results.find((r) => r.isCurrentUser)
  const canAppeal = showAppeal && currentUserResult && !currentUserResult.isCorrect && currentUserResult.answer

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35 }}
      className={cn('flex flex-col gap-4 p-4', className)}
    >
      {/* Correct answer header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="text-center p-4 rounded-2xl bg-emerald-500/8 border border-emerald-500/20"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <span className="text-sm font-medium text-emerald-600">To&apos;g&apos;ri javob</span>
        </div>
        <p className="text-lg font-bold text-foreground">{correctAnswer}</p>
      </motion.div>

      {/* Player results */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
          Natijalar
        </span>
        {results.map((result, index) => (
          <motion.div
            key={result.playerId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl border',
              result.isCurrentUser
                ? 'bg-primary/5 border-primary/20'
                : 'bg-card/50 border-border/20'
            )}
          >
            {/* Status icon */}
            <div
              className={cn(
                'flex items-center justify-center w-9 h-9 rounded-full shrink-0',
                result.isCorrect
                  ? 'bg-emerald-500/10'
                  : result.answer
                    ? 'bg-rose-500/10'
                    : 'bg-muted/30'
              )}
            >
              {result.isCorrect ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : result.answer ? (
                <XCircle className="h-5 w-5 text-rose-500" />
              ) : (
                <Clock className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            {/* Player info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span
                  className={cn(
                    'text-sm font-semibold truncate',
                    result.isCurrentUser ? 'text-primary' : 'text-foreground'
                  )}
                >
                  {result.playerName}
                  {result.isCurrentUser && (
                    <span className="text-xs font-normal text-muted-foreground ml-1">(siz)</span>
                  )}
                </span>
              </div>
              <span className="text-xs text-muted-foreground mt-0.5 block truncate">
                {result.answer
                  ? `"${result.answer}"`
                  : 'Javob bermadi'}
              </span>
            </div>

            {/* Points delta */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1, type: 'spring' }}
              className="shrink-0"
            >
              {result.pointsDelta !== 0 && (
                <span
                  className={cn(
                    'text-sm font-bold px-2.5 py-1 rounded-lg',
                    result.pointsDelta > 0
                      ? 'text-emerald-600 bg-emerald-500/10'
                      : 'text-rose-500 bg-rose-500/10'
                  )}
                >
                  {result.pointsDelta > 0 ? `+${result.pointsDelta}` : result.pointsDelta}
                </span>
              )}
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Erudit penalty visual emphasis */}
      {isErudit && results.some((r) => !r.isCorrect && r.answer) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-2 px-3 py-2 bg-rose-500/8 border border-rose-500/20 rounded-xl"
        >
          <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
          <span className="text-xs text-rose-500 font-medium">
            Erudit rejimida noto&apos;g&apos;ri javob uchun -10 ball olinadi
          </span>
        </motion.div>
      )}

      {/* AI Appeal section */}
      {canAppeal && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col gap-2"
        >
          <Button
            variant="outline"
            onClick={() => {
              import('@/services/game-socket').then(({ getGameSocket }) => {
                getGameSocket().requestAIRecheck('current', currentUserResult.playerId, currentUserResult.answer!)
              })
              onAppeal?.(currentUserResult.playerId, currentUserResult.answer!)
            }}
            className="w-full h-11 rounded-xl gap-2 border-primary/30 text-primary hover:bg-primary/5"
          >
            <Bot className="h-4 w-4" />
            🤖 AI bilan tekshirish
          </Button>
          <p className="text-[11px] text-muted-foreground/70 text-center leading-relaxed px-2">
            Eslatma: Faqat imlo xatolari yoki muqobil to&apos;g&apos;ri javoblar uchun.
            Boshqa hollarda natija o&apos;zgarmaydi.
          </p>
        </motion.div>
      )}

      {/* Continue button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <Button
          onClick={onContinue}
          className="w-full h-12 rounded-xl text-base font-medium"
        >
          Davom etish
        </Button>
      </motion.div>
    </motion.div>
  )
}
