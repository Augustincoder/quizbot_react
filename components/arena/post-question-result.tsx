'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Bot, AlertTriangle, Clock, User, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
  /** Optional explanation copy from the current question (e.g. server-provided) */
  explanation?: string
  /** When true, the parent renders the primary continue action (e.g. fixed bottom bar). */
  hideContinueButton?: boolean
  onContinue: () => void
  onAppeal?: (playerId: string, answer: string) => void
  className?: string
}

export function PostQuestionResult({
  mode,
  correctAnswer,
  results,
  questionText: _questionText,
  explanation,
  hideContinueButton = false,
  onContinue,
  onAppeal,
  className,
}: PostQuestionResultProps) {
  const isErudit = mode === 'erudit'
  const showAppeal = mode === 'brain-ring' || mode === 'erudit'

  const currentUserResult = results.find((r) => r.isCurrentUser)
  const canAppeal = showAppeal && currentUserResult && !currentUserResult.isCorrect && currentUserResult.answer

  const primaryResult = currentUserResult ?? results[0]
  const roundOutcomeKnown = Boolean(primaryResult)
  const roundIsCorrect = primaryResult?.isCorrect === true

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35 }}
      className={cn('flex flex-col gap-5 px-1', className)}
    >
      {/* 1 — Massive round outcome */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05, type: 'spring', stiffness: 260, damping: 22 }}
        className={cn(
          'rounded-3xl border-2 px-3 py-8 text-center shadow-sm',
          roundOutcomeKnown &&
            (roundIsCorrect
              ? 'border-emerald-500/40 bg-gradient-to-b from-emerald-500/12 to-emerald-500/5'
              : 'border-rose-500/35 bg-gradient-to-b from-rose-500/12 to-rose-500/5'),
          !roundOutcomeKnown && 'border-border/40 bg-muted/20',
        )}
      >
        <div className="flex flex-col items-center gap-3">
          {roundOutcomeKnown ? (
            roundIsCorrect ? (
              <>
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 ring-4 ring-emerald-500/15">
                  <CheckCircle2 className="h-12 w-12 text-emerald-600 dark:text-emerald-400" strokeWidth={2.25} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600/90">Natija</p>
                  <p className="mt-1 text-4xl font-black tracking-tight text-emerald-700 dark:text-emerald-300 sm:text-5xl">
                    To&apos;g&apos;ri
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/20 ring-4 ring-rose-500/15">
                  <XCircle className="h-12 w-12 text-rose-600 dark:text-rose-400" strokeWidth={2.25} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600/90">Natija</p>
                  <p className="mt-1 text-4xl font-black tracking-tight text-rose-700 dark:text-rose-300 sm:text-5xl">
                    Noto&apos;g&apos;ri
                  </p>
                </div>
              </>
            )
          ) : (
            <p className="text-lg font-semibold text-muted-foreground">Natija yuklanmoqda...</p>
          )}
        </div>
      </motion.div>

      {/* 2 — Correct answer */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="rounded-2xl border border-border/60 bg-card/50 px-4 py-4 shadow-sm"
      >
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          To&apos;g&apos;ri javob
        </p>
        <p className="mt-2 break-words text-center text-xl font-bold leading-snug text-foreground sm:text-2xl">
          {correctAnswer}
        </p>
      </motion.div>

      {/* 3 — Explanation (Izoh) */}
      {explanation && explanation.trim().length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
        >
          <Alert
            className={cn(
              'rounded-2xl border-sky-500/25 bg-sky-500/[0.07] text-foreground shadow-none',
              'dark:border-sky-400/30 dark:bg-sky-400/[0.08]',
            )}
          >
            <BookOpen className="text-sky-600 dark:text-sky-400" />
            <AlertTitle className="text-base font-semibold text-sky-900 dark:text-sky-100">Izoh</AlertTitle>
            <AlertDescription className="text-sm leading-relaxed text-sky-950/90 dark:text-sky-50/90">
              {explanation}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Player results */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
          Natijalar
        </span>
        {results.map((result, index) => (
          <motion.div
            key={result.playerId}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.22 + index * 0.08 }}
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl border',
              result.isCurrentUser
                ? 'bg-primary/5 border-primary/20'
                : 'bg-card/50 border-border/20',
            )}
          >
            <div
              className={cn(
                'flex items-center justify-center w-9 h-9 rounded-full shrink-0',
                result.isCorrect
                  ? 'bg-emerald-500/10'
                  : result.answer
                    ? 'bg-rose-500/10'
                    : 'bg-muted/30',
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

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span
                  className={cn(
                    'text-sm font-semibold truncate',
                    result.isCurrentUser ? 'text-primary' : 'text-foreground',
                  )}
                >
                  {result.playerName}
                  {result.isCurrentUser && (
                    <span className="text-xs font-normal text-muted-foreground ml-1">(siz)</span>
                  )}
                </span>
              </div>
              <span className="text-xs text-muted-foreground mt-0.5 block break-words">
                {result.answer ? `"${result.answer}"` : 'Javob bermadi'}
              </span>
            </div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.35 + index * 0.08, type: 'spring' }}
              className="shrink-0"
            >
              {result.pointsDelta !== 0 && (
                <span
                  className={cn(
                    'text-sm font-bold px-2.5 py-1 rounded-lg',
                    result.pointsDelta > 0
                      ? 'text-emerald-600 bg-emerald-500/10'
                      : 'text-rose-500 bg-rose-500/10',
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
          transition={{ delay: 0.45 }}
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
          transition={{ delay: 0.5 }}
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

      {/* Continue button (inline unless parent provides fixed action) */}
      {!hideContinueButton && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
        >
          <Button
            type="button"
            onClick={onContinue}
            className="w-full h-12 rounded-xl text-base font-medium"
          >
            Davom etish
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}
