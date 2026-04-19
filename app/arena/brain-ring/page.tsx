'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AppShell } from '@/components/layout/app-shell'
import { TgSafeArea } from '@/components/layout/tg-safe-area'
import { QuestionDisplay } from '@/components/arena/question-display'
import { ProgressTimer } from '@/components/arena/progress-timer'
import { BuzzerButton } from '@/components/arena/buzzer-button'
import { AnswerInput } from '@/components/arena/answer-input'
import { PostQuestionResult } from '@/components/arena/post-question-result'
import { Button } from '@/components/ui/button'
import { useGameStore } from '@/store/game-store'
import { useUserStore } from '@/store/user-store'
import { useTelegram } from '@/hooks/use-telegram'
import { useGameSocket } from '@/hooks/use-game-socket'
import { useTimer } from '@/hooks/use-timer'
import {
  useGamePhase,
  useCurrentQuestion,
  useQuestionProgress,
  useBuzzerState,
  useAnswerState,
  usePlayerScore,
  useRoomConfig,
} from '@/hooks/use-game-selectors'
import { Loader2 } from 'lucide-react'

interface PlayerResultData {
  playerId: string
  playerName: string
  answer: string | null
  isCorrect: boolean
  pointsDelta: number
  newScore: number
  isCurrentUser?: boolean
}

export default function BrainRingPage() {
  const router = useRouter()
  const { haptic } = useTelegram()
  const { submitBuzzer, submitAnswer, joinRoom, requestAIRecheck } = useGameSocket()
  const { timeRemaining } = useTimer()

  const userId = useUserStore((state) => state.id)
  const username = useUserStore((state) => state.username)

  const { roomId, mode, matchType } = useRoomConfig()
  const { phase, currentPhase } = useGamePhase()
  const { buzzerWinner } = useBuzzerState()
  const currentQuestion = useCurrentQuestion()
  const { questionNumber, totalQuestions } = useQuestionProgress()
  const {
    isCorrect,
    pointsEarned,
    answeredPlayerId,
    submittedAnswer,
    correctAnswer: globalCorrectAnswer,
  } = useAnswerState()

  const uid = userId || 'user'
  const myScore = usePlayerScore(uid)
  const answeredScore = usePlayerScore(answeredPlayerId ?? 'unknown')

  const [postResultData, setPostResultData] = useState<PlayerResultData[]>([])

  const isMyBuzzer = buzzerWinner === uid

  useEffect(() => {
    let mounted = true
    const actRoom = roomId || `room_${Date.now()}`
    const actMode = mode || 'brain-ring'
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
    if (phase === 'finished') {
      router.push('/results')
    }
  }, [phase, router])

  const processedResultData = useMemo<PlayerResultData[]>(() => {
    if (phase !== 'results') return []

    return [
      {
        playerId: answeredPlayerId || 'unknown',
        playerName: answeredPlayerId === uid ? username : 'Raqib',
        answer: submittedAnswer,
        isCorrect: isCorrect || false,
        pointsDelta: pointsEarned,
        newScore: answeredScore,
        isCurrentUser: answeredPlayerId === uid,
      },
    ]
  }, [
    phase,
    answeredPlayerId,
    isCorrect,
    pointsEarned,
    answeredScore,
    username,
    uid,
    submittedAnswer,
  ])

  useEffect(() => {
    if (processedResultData.length > 0) {
      setPostResultData(processedResultData)
    }
  }, [processedResultData])

  const handleBuzzerClick = useCallback(() => {
    haptic('medium')
    submitBuzzer()
  }, [haptic, submitBuzzer])

  const handleAnswerSubmit = useCallback(
    (answer: string) => {
      haptic('medium')
      submitAnswer(answer)
    },
    [haptic, submitAnswer],
  )

  const handleResultsContinue = useCallback(() => {
    import('@/services/game-socket').then(({ getGameSocket }) => {
      getGameSocket().emit('game:leaderboard_ack', {
        roomCode: roomId,
        userId: uid,
      })
    })
  }, [roomId, uid])

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

  const showHeaderTimer =
    (phase === 'question' || phase === 'answering') && currentPhase !== 'input'

  return (
    <AppShell>
      <TgSafeArea className="min-h-0">
        <div className="flex flex-col h-[100dvh] min-h-0 w-full overflow-hidden bg-background relative">
          <div className="shrink-0 p-4 border-b border-border/30 bg-background/80 backdrop-blur-sm z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Brain-Ring
              </span>
              <span className="text-sm font-medium text-foreground">{myScore} ball</span>
            </div>
            {showHeaderTimer && (
              <ProgressTimer
                timeRemaining={timeRemaining}
                totalTime={phase === 'answering' ? 10 : currentQuestion.timeLimit}
                variant="bar"
              />
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto pb-32 custom-scrollbar">
            <div className="p-4 border-b border-border/10 bg-gradient-to-b from-transparent to-card/30 min-w-0">
              <QuestionDisplay
                question={currentQuestion}
                questionNumber={questionNumber}
                totalQuestions={totalQuestions}
                compact
              />
            </div>

            <AnimatePresence mode="wait">
              {phase === 'question' && (
                <motion.div
                  key="buzzer-hint"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center py-10 px-6 text-center"
                >
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Savolni o&apos;qing. Tayyor bo&apos;lgach, pastdagi buzzer tugmasini bosing.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {phase === 'answering' && !isMyBuzzer && (
                <motion.div
                  key="opponent-wait"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center justify-center py-12 px-6"
                >
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                  <p className="text-xl font-semibold text-foreground">Raqib o&apos;ylamoqda...</p>
                  <p className="text-sm text-muted-foreground mt-2">10 soniya ichida javob beradi</p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {phase === 'results' && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22 }}
                  className="px-3 pb-6 pt-2"
                >
                  <PostQuestionResult
                    mode="brain-ring"
                    correctAnswer={globalCorrectAnswer || ''}
                    results={postResultData}
                    questionText={currentQuestion.text}
                    explanation={currentQuestion.explanation}
                    hideContinueButton
                    onContinue={handleResultsContinue}
                    onAppeal={(playerId, answer) => requestAIRecheck(currentQuestion.id, answer)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div
            className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md p-4 border-t z-50 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.1)]"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)' }}
          >
            {phase === 'question' && (
              <div className="flex justify-center py-1">
                <BuzzerButton onPress={handleBuzzerClick} disabled={false} />
              </div>
            )}

            {phase === 'answering' && isMyBuzzer && (
              <div className="w-full max-w-lg mx-auto">
                <div className="text-center mb-3">
                  <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">
                    Sizning navbatingiz
                  </p>
                  <h3 className="text-lg font-bold">Javobingizni kiriting</h3>
                </div>
                <AnswerInput
                  timeLimit={10}
                  onSubmit={handleAnswerSubmit}
                  onTimeUp={() => handleAnswerSubmit('')}
                  className="relative left-auto right-auto bottom-auto z-10 border-0 bg-transparent backdrop-blur-none px-0 pt-0 pb-0 shadow-none"
                />
              </div>
            )}

            {phase === 'results' && (
              <Button
                type="button"
                onClick={handleResultsContinue}
                className="w-full h-12 rounded-xl text-base font-medium"
              >
                Davom etish
              </Button>
            )}
          </div>
        </div>
      </TgSafeArea>
    </AppShell>
  )
}
