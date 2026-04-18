'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AppShell } from '@/components/layout/app-shell'
import { TgSafeArea } from '@/components/layout/tg-safe-area'
import { QuestionDisplay } from '@/components/arena/question-display'
import { ProgressTimer } from '@/components/arena/progress-timer'
import { BuzzerButton } from '@/components/arena/buzzer-button'
import { AnswerInput } from '@/components/arena/answer-input'
import { PostQuestionResult } from '@/components/arena/post-question-result'
import { useGameStore } from '@/store/game-store'
import { useUserStore } from '@/store/user-store'
import { useTelegram } from '@/hooks/use-telegram'
import { useGameSocket } from '@/hooks/use-game-socket'
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

  const userId = useUserStore((state) => state.id)
  const username = useUserStore((state) => state.username)
  
  const roomId = useGameStore((state) => state.roomId)
  const mode = useGameStore((state) => state.mode)
  const matchType = useGameStore((state) => state.matchType)
  
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

  const [timeRemaining, setTimeRemaining] = useState(20)
  const [postResultData, setPostResultData] = useState<PlayerResultData[]>([])

  const isMyBuzzer = buzzerWinner === (userId || 'user')

  // Join Room On Mount to trigger server game logic
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
    return () => { mounted = false }
  }, [roomId, mode, matchType, phase, joinRoom])

  // Auto navigation when finished
  useEffect(() => {
    if (phase === 'finished') {
      router.push('/results')
    }
  }, [phase, router])

  // Process server-emitted answers into view state
  useEffect(() => {
    if (phase === 'results') {
      const data: PlayerResultData[] = [
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
      setPostResultData(data)
    }
  }, [phase, answeredPlayerId, isCorrect, pointsEarned, scores, username, userId, submittedAnswer])

  // Visual Timer Sync
  useEffect(() => {
    if (phase === 'question' && currentQuestion) {
      setTimeRemaining(currentQuestion.timeLimit)
    }
    
    // In answering phase, buzzer timeout is strict 10s backendside
    if (phase === 'answering') {
      setTimeRemaining(10)
    }

    if (phase === 'question' || phase === 'answering') {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [phase, currentQuestion])

  const handleBuzzerClick = useCallback(() => {
    haptic('impact')
    submitBuzzer()
  }, [haptic, submitBuzzer])

  const handleAnswerSubmit = useCallback((answer: string) => {
    haptic('impact')
    useGameStore.getState().submitAnswer(answer) 
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
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Brain-Ring</span>
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

          <div className="flex-1 flex flex-col relative z-0">
            {/* Split layout */}
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
                    />
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
                      mode="brain-ring"
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
