'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AppShell } from '@/components/layout/app-shell'
import { TgSafeArea } from '@/components/layout/tg-safe-area'
import { QuestionDisplay } from '@/components/arena/question-display'
import { ProgressTimer } from '@/components/arena/progress-timer'
import { BuzzerButton } from '@/components/arena/buzze  r-button'
import { AnswerInput } from '@/components/arena/answer-input'
import { PostQuestionResult } from '@/components/arena/post-question-result'
import { Badge } from '@/components/ui/badge'
import { useGameStore } from '@/store/game-store'
import { useUserStore } from '@/store/user-store'
import { useTelegram } from '@/hooks/use-telegram'
import { useGameSocket } from '@/hooks/use-game-socket'
import { useTimer } from '@/hooks/use-timer'
import { AlertTriangle, Loader2 } from 'lucide-react'

// Render specific result struct
interface PlayerResultData {
  playerId: string
  playerName: string
  answer: string | null
  isCorrect: boolean
  pointsDelta: number
  newScore: number
  isCurrentUser?: boolean
}

export default function EruditPage() {
  const router = useRouter()
  const { haptic } = useTelegram()
  const { submitBuzzer, submitAnswer, joinRoom, requestAIRecheck } = useGameSocket()
  const { timeRemaining } = useTimer()

  const userId = useUserStore((state) => state.id)
  const username = useUserStore((state) => state.username)
  
  const phase = useGameStore((state) => state.phase)
  const buzzerWinner = useGameStore((state) => state.buzzerWinner)
  const currentQuestion = useGameStore((state) => state.currentQuestion)
  const questionNumber = useGameStore((state) => state.questionNumber)
  const totalQuestions = useGameStore((state) => state.totalQuestions)
  const scores = useGameStore((state) => state.scores)
  
  const isCorrect = useGameStore((state) => state.isCorrect)
  const pointsEarned = useGameStore((state) => state.pointsEarned)
  const answeredPlayerId = useGameStore((state) => state.answeredPlayerId)
  const submittedAnswer = useGameStore((state) => state.submittedAnswer)
  const globalCorrectAnswer = useGameStore((state) => state.correctAnswer)

  const roomId = useGameStore((state) => state.roomId)
  const mode = useGameStore((state) => state.mode)
  const matchType = useGameStore((state) => state.matchType)

  const [postResultData, setPostResultData] = useState<PlayerResultData[]>([])

  const isMyBuzzer = buzzerWinner === (userId || 'user')

  // Join Room On Mount
  useEffect(() => {
    let mounted = true
    const actRoom = roomId || `room_${Date.now()}`
    const actMode = mode || 'erudit'
    const actMatch = matchType || 'solo'

    if (mounted && phase === 'waiting') {
      if (!roomId) {
        useGameStore.getState().setRoom(actRoom, actMode, actMatch)
      }
      joinRoom(actRoom, actMode, actMatch).catch(console.error)
    }
    return () => { mounted = false }
  }, [roomId, mode, matchType, phase, joinRoom])

  // Auto navigation when finished
  useEffect(() => {
    if (phase === 'finished') {
      router.push('/results')
    }
  }, [phase, router])

  // Process server-emitted answers into view state - memoized
  const processedResultData = useMemo<PlayerResultData[]>(() => {
    if (phase !== 'results') return []
    
    return [
      {
        playerId: answeredPlayerId || 'unknown',
        playerName: answeredPlayerId === (userId || 'user') ? username : 'Raqib',
        answer: submittedAnswer,
        isCorrect: isCorrect || false,
        pointsDelta: pointsEarned,
        newScore: scores[answeredPlayerId || 'unknown'] || 0,
        isCurrentUser: answeredPlayerId === (userId || 'user'),
      }
    ]
  }, [phase, answeredPlayerId, isCorrect, pointsEarned, scores, username, userId, submittedAnswer])

  // Sync processed data to state only when it changes
  useEffect(() => {
    if (processedResultData.length > 0) {
      setPostResultData(processedResultData)
    }
  }, [processedResultData])

  // Calculate total time for timer display based on phase
  const totalTime = useMemo(() => {
    if (phase === 'answering') return 10
    if (phase === 'question' && currentQuestion) return currentQuestion.timeLimit
    return 15
  }, [phase, currentQuestion])

  const handleBuzzerClick = useCallback(() => {
    haptic('medium')
    submitBuzzer()
  }, [haptic, submitBuzzer])

  const handleAnswerSubmit = useCallback((answer: string) => {
    haptic('medium')
    useGameStore.getState().submitAnswer(answer) // Store locally so it displays on post-results nicely
    submitAnswer(answer)
  }, [haptic, submitAnswer])

  if (!currentQuestion) {
    return (
      <AppShell className="items-center justify-center">
         <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <div className="text-muted-foreground font-medium animate-pulse">
            Server kutilmoqda...
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <TgSafeArea>
        <div className="flex flex-col h-full bg-background relative overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-border/30 bg-background/80 backdrop-blur-sm z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Erudit</span>
                <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 px-2 py-0 border">
                  Poxod
                </Badge>
              </div>
              <span className="text-sm font-medium text-foreground">
                {scores[userId || 'user'] || 0} ball
              </span>
            </div>
            {(phase === 'question' || phase === 'answering') && (
              <ProgressTimer
                timeRemaining={timeRemaining}
                totalTime={phase === 'answering' ? 10 : currentQuestion.timeLimit}
                variant="bar"
              />
            )}
          </div>

          {/* Main Stage */}
          <div className="flex-1 flex flex-col relative z-0">
            {/* Split layout: Top half question, Bottom half buzzer/input */}
            <div className="h-[45%] flex flex-col justify-end p-6 border-b border-border/10 bg-gradient-to-b from-transparent to-card/30">
              <QuestionDisplay
                question={currentQuestion}
                questionNumber={questionNumber}
                totalQuestions={totalQuestions}
                compact
              />
            </div>

            <div className="h-[55%] relative w-full bg-card/20">
              {/* Buzzer Phase */}
              <AnimatePresence>
                {phase === 'question' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-card/30"
                  >
                    <BuzzerButton
                      onPress={handleBuzzerClick}
                      disabled={false}
                      className="shadow-[0_0_40px_-10px_rgba(var(--primary),0.3)] hover:shadow-[0_0_60px_-10px_rgba(var(--primary),0.5)] transition-shadow duration-500"
                    />
                    
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-8 flex items-center justify-center p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 max-w-xs"
                    >
                      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mr-2" />
                      <p className="text-[11px] leading-tight text-amber-600/90 font-medium">
                        Diqqat: Noto'g'ri javob yoki vaqtida javob bermaslik <strong className="text-amber-500">-10 ball</strong> bilan jazolanadi!
                      </p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Answer Input Phase */}
              <AnimatePresence>
                {phase === 'answering' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20, transition: { duration: 0.15 } }}
                    className="absolute inset-0 z-20 bg-background/80 backdrop-blur-md flex flex-col justify-end"
                  >
                    {isMyBuzzer ? (
                      <div className="w-full max-w-md mx-auto rounded-t-3xl bg-card border-t border-x border-border shadow-2xl p-4 pb-8 h-full flex flex-col">
                        <div className="flex items-center justify-center gap-2 mb-6 mt-2">
                          <div className="w-12 h-1 bg-border/50 rounded-full mx-auto" />
                        </div>
                        <div className="text-center mb-6">
                          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">
                            Sizning navbatingiz
                          </p>
                          <h3 className="text-xl font-bold">Javobingizni kiriting</h3>
                        </div>
                        <div className="flex-1">
                          <AnswerInput
                            timeLimit={10}
                            onSubmit={handleAnswerSubmit}
                            onTimeUp={() => handleAnswerSubmit('')}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-card/80 backdrop-blur-sm z-30">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                          <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                        <p className="text-xl font-semibold text-foreground">Raqib o'ylamoqda...</p>
                        <p className="text-sm text-muted-foreground mt-2">10 soniya vaqti bor</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Results Phase */}
              <AnimatePresence>
                {phase === 'results' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-30 bg-background flex flex-col"
                  >
                    <PostQuestionResult
                      mode="erudit"
                      correctAnswer={globalCorrectAnswer || ''}
                      results={postResultData}
                      questionText={currentQuestion.text}
                      onContinue={() => {}}
                      onAppeal={(playerId, answer) => requestAIRecheck(currentQuestion.id, answer)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </TgSafeArea>
    </AppShell>
  )
}
