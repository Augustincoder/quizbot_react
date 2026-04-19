'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AppShell } from '@/components/layout/app-shell'
import { TgSafeArea } from '@/components/layout/tg-safe-area'
import { QuestionDisplay } from '@/components/arena/question-display'
import { ProgressTimer } from '@/components/arena/progress-timer'
import { RushInput } from '@/components/arena/rush-input'
import { BlurOverlay } from '@/components/arena/blur-overlay'
import { useGameStore } from '@/store/game-store'
import { useUserStore } from '@/store/user-store'
import { useTelegram } from '@/hooks/use-telegram'
import { useGameSocket } from '@/hooks/use-game-socket'
import { useTimer } from '@/hooks/use-timer'
import {
  useGamePhase,
  useCurrentQuestion,
  useQuestionProgress,
  useAnswerState,
  usePlayerScore,
  useRoomConfig,
  useZakovatResults,
} from '@/hooks/use-game-selectors'
import { CheckCircle2, XCircle, Zap, Loader2 } from 'lucide-react'

interface RushSubmission {
  answer: string
  timestamp: number
  isCorrect?: boolean
  pointsEarned?: number
}

export default function ZakovatPage() {
  const router = useRouter()
  const { haptic } = useTelegram()
  const { submitAnswer, joinRoom } = useGameSocket()
  const { timeRemaining } = useTimer()

  const userId = useUserStore((state) => state.id)

  const { phase } = useGamePhase()
  const currentQuestion = useCurrentQuestion()
  const { questionNumber, totalQuestions } = useQuestionProgress()
  const { correctAnswer: globalCorrectAnswer } = useAnswerState()
  const zakovatResults = useZakovatResults()
  const { roomId, mode, matchType } = useRoomConfig()

  const uid = userId || 'user'
  const myScore = usePlayerScore(uid)

  const [hasAnswered, setHasAnswered] = useState(false)
  const [lastSubmission, setLastSubmission] = useState<RushSubmission | null>(null)

  useEffect(() => {
    let mounted = true
    const actRoom = roomId || `room_${Date.now()}`
    const actMode = mode || 'zakovat'
    const actMatch = matchType || 'solo'

    if (mounted && phase === 'waiting') {
      if (!roomId) {
        useGameStore.getState().setRoom(actRoom, actMode, actMatch)
      }
      joinRoom(actRoom, actMode, actMatch).catch(console.error)
    }
    return () => {
      mounted = false
    }
  }, [roomId, mode, matchType, phase, joinRoom])

  useEffect(() => {
    if (phase === 'question' && currentQuestion) {
      setHasAnswered(false)
      setLastSubmission(null)
    }

    if (phase === 'finished') {
      router.push('/results')
    }
  }, [phase, currentQuestion, router])

  const myResult = useMemo(() => {
    return zakovatResults?.find((res) => res.playerId === uid)
  }, [zakovatResults, uid])

  const isTimeUp = phase === 'results'

  const handleRushSubmit = useCallback(
    async (answer: string, clientTimestamp: number) => {
      if (!currentQuestion || hasAnswered) return

      setHasAnswered(true)

      setLastSubmission({
        answer,
        timestamp: clientTimestamp,
      })

      haptic('medium')

      await submitAnswer(answer)
    },
    [currentQuestion, hasAnswered, submitAnswer, haptic],
  )

  if (!currentQuestion) {
    return (
      <AppShell className="items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <div className="text-muted-foreground font-medium animate-pulse">Server kutilmoqda...</div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <TgSafeArea>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-border/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Zakovat</span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-600 font-medium">
                  <Zap className="h-3 w-3" />
                  Rush
                </span>
              </div>
              <span className="text-sm font-medium text-foreground">{myScore} ball</span>
            </div>
            <ProgressTimer
              timeRemaining={timeRemaining}
              totalTime={currentQuestion.timeLimit}
              variant="bar"
            />
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-6">
            <AnimatePresence mode="wait">
              <QuestionDisplay
                key={currentQuestion.id}
                question={currentQuestion}
                questionNumber={questionNumber}
                totalQuestions={totalQuestions}
              />
            </AnimatePresence>

            <AnimatePresence>
              {hasAnswered && phase === 'question' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-6 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-secondary border border-border"
                >
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    Javob qabul qilindi. Natija kutilmoqda...
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!isTimeUp && (
            <RushInput onSubmit={handleRushSubmit} disabled={hasAnswered} lastResult={null} />
          )}
        </div>

        <BlurOverlay show={isTimeUp}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-4 text-center"
          >
            {myResult?.isCorrect ? (
              <CheckCircle2 className="h-16 w-16 text-emerald-500" />
            ) : (
              <XCircle className="h-16 w-16 text-destructive" />
            )}

            <span
              className={
                myResult?.isCorrect
                  ? 'text-xl font-bold text-emerald-500'
                  : 'text-xl font-bold text-destructive'
              }
            >
              {myResult?.isCorrect ? "Tabriklaymiz, to'g'ri!" : "Vaqt tugadi / Noto'g'ri"}
            </span>

            {myResult?.isCorrect && myResult.pointsEarned !== undefined && (
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-sm font-bold border border-emerald-500/20 shadow-sm">
                +{myResult.pointsEarned} ball
              </span>
            )}

            <div className="mt-2 text-sm text-foreground bg-card/80 p-3 rounded-lg border border-border/50">
              <p className="text-muted-foreground mb-1 text-xs">To&apos;g&apos;ri javob:</p>
              <p className="font-semibold">{globalCorrectAnswer}</p>
            </div>

            {lastSubmission && (
              <div className="mt-1 text-xs text-muted-foreground">
                Sizning javobingiz: &quot;{lastSubmission.answer}&quot;
              </div>
            )}
          </motion.div>
        </BlurOverlay>
      </TgSafeArea>
    </AppShell>
  )
}
