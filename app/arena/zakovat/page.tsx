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
import { BlurOverlay } from '@/components/arena/blur-overlay'
import { useGameStore } from '@/store/game-store'
import { useUserStore } from '@/store/user-store'
import { useTelegram } from '@/hooks/use-telegram'
import type { Question } from '@/types/game'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'

// Mock Zakovat questions (longer time, rush format)
const mockQuestions: Question[] = [
  {
    id: 'z1',
    text: 'Qaysi olim nisbiylik nazariyasini kashf etgan?',
    category: 'Fizika',
    difficulty: 'medium',
    correctAnswer: 'Albert Eynshteyn',
    timeLimit: 60,
    points: 20,
  },
  {
    id: 'z2',
    text: 'O\'zbekistondagi eng uzun daryo qaysi?',
    category: 'Geografiya',
    difficulty: 'medium',
    correctAnswer: 'Amudaryo',
    timeLimit: 60,
    points: 20,
  },
  {
    id: 'z3',
    text: 'Qaysi davlat 2022-yilda FIFA Jahon chempionatini o\'tkazdi?',
    category: 'Sport',
    difficulty: 'easy',
    correctAnswer: 'Qatar',
    timeLimit: 60,
    points: 15,
  },
]

interface BuzzerPress {
  playerId: string
  timestamp: number
  playerName: string
}

export default function ZakovatPage() {
  const router = useRouter()
  const { haptic } = useTelegram()
  
  const userId = useUserStore((state) => state.id)
  const username = useUserStore((state) => state.username)
  const phase = useGameStore((state) => state.phase)
  const buzzerWinner = useGameStore((state) => state.buzzerWinner)
  const setPhase = useGameStore((state) => state.setPhase)
  const setQuestion = useGameStore((state) => state.setQuestion)
  const pressBuzzerAction = useGameStore((state) => state.pressBuzzer)
  const updateScore = useGameStore((state) => state.updateScore)
  const setGameEnd = useGameStore((state) => state.setGameEnd)
  const resetQuestion = useGameStore((state) => state.resetQuestion)

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(60)
  const [showResult, setShowResult] = useState(false)
  const [lastResult, setLastResult] = useState<{ correct: boolean; answer: string } | null>(null)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [buzzerPresses, setBuzzerPresses] = useState<BuzzerPress[]>([])
  const [questionStartTime, setQuestionStartTime] = useState<number>(0)

  const isMyBuzzer = buzzerWinner === userId

  // Start game with first question
  useEffect(() => {
    const question = mockQuestions[0]
    setCurrentQuestion(question)
    setQuestion(question, 1, mockQuestions.length)
    setPhase('question')
    setTimeRemaining(question.timeLimit)
    setQuestionStartTime(Date.now())
  }, [setQuestion, setPhase])

  // Timer countdown
  useEffect(() => {
    if (phase !== 'question' || !currentQuestion) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [phase, currentQuestion])

  const handleTimeUp = useCallback(() => {
    setPhase('results')
    setLastResult({ correct: false, answer: 'Vaqt tugadi' })
    setShowResult(true)
    haptic('error')

    setTimeout(() => {
      moveToNextQuestion()
    }, 2500)
  }, [setPhase, haptic])

  // Handle buzzer press with timestamp tracking
  const handleBuzzerPress = useCallback(() => {
    if (phase !== 'question') return
    
    const timestamp = Date.now()
    const pressTime = timestamp - questionStartTime
    
    // Record buzzer press
    setBuzzerPresses((prev) => [
      ...prev,
      { playerId: userId || 'user', timestamp: pressTime, playerName: username },
    ])
    
    pressBuzzerAction(userId || 'user', timestamp)
    setPhase('answering')
    haptic('heavy')
  }, [phase, questionStartTime, userId, username, pressBuzzerAction, setPhase, haptic])

  const handleAnswerSubmit = useCallback((answer: string) => {
    const isCorrect = currentQuestion?.correctAnswer.toLowerCase().includes(answer.toLowerCase()) ||
                     answer.toLowerCase().includes(currentQuestion?.correctAnswer.toLowerCase() || '')
    
    setLastResult({ correct: isCorrect, answer })
    setShowResult(true)

    if (isCorrect) {
      haptic('success')
      const points = currentQuestion?.points || 20
      setScores((prev) => ({
        ...prev,
        [userId || 'user']: (prev[userId || 'user'] || 0) + points,
      }))
      updateScore(userId || 'user', points)
    } else {
      haptic('error')
    }

    setTimeout(() => {
      moveToNextQuestion()
    }, 2500)
  }, [currentQuestion, haptic, updateScore, userId])

  const handleAnswerTimeUp = useCallback(() => {
    setPhase('results')
    setLastResult({ correct: false, answer: 'Javob vaqti tugadi' })
    setShowResult(true)
    haptic('error')

    setTimeout(() => {
      moveToNextQuestion()
    }, 2000)
  }, [setPhase, haptic])

  const moveToNextQuestion = useCallback(() => {
    setShowResult(false)
    setLastResult(null)
    resetQuestion()
    setBuzzerPresses([])

    const nextIndex = currentQuestionIndex + 1
    if (nextIndex >= mockQuestions.length) {
      setGameEnd(scores, { [userId || 'user']: 25 }, userId || 'user')
      router.push('/results')
      return
    }

    setCurrentQuestionIndex(nextIndex)
    const question = mockQuestions[nextIndex]
    setCurrentQuestion(question)
    setQuestion(question, nextIndex + 1, mockQuestions.length)
    setPhase('question')
    setTimeRemaining(question.timeLimit)
    setQuestionStartTime(Date.now())
  }, [currentQuestionIndex, scores, userId, setGameEnd, router, setQuestion, setPhase, resetQuestion])

  if (!currentQuestion) {
    return (
      <AppShell className="items-center justify-center">
        <div className="text-muted-foreground">Yuklanmoqda...</div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <TgSafeArea>
        <div className="flex flex-col h-full">
          {/* Header with timer */}
          <div className="p-4 border-b border-border/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Zakovat</span>
              <span className="text-sm font-medium text-foreground">
                {scores[userId || 'user'] || 0} ball
              </span>
            </div>
            <ProgressTimer
              timeRemaining={timeRemaining}
              totalTime={currentQuestion.timeLimit}
              variant="bar"
            />
          </div>

          {/* Question */}
          <div className="flex-1 flex flex-col items-center justify-center py-6">
            <AnimatePresence mode="wait">
              <QuestionDisplay
                key={currentQuestion.id}
                question={currentQuestion}
                questionNumber={currentQuestionIndex + 1}
                totalQuestions={mockQuestions.length}
              />
            </AnimatePresence>

            {/* Buzzer timestamps display */}
            {buzzerPresses.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-3 bg-card/50 rounded-xl border border-border/30"
              >
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Buzzer vaqti:</span>
                  <span className="font-mono font-semibold text-primary">
                    {(buzzerPresses[0].timestamp / 1000).toFixed(2)}s
                  </span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Buzzer area */}
          {phase === 'question' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4 pb-8"
            >
              <p className="text-sm text-muted-foreground">
                Tezkor javob uchun bosing
              </p>
              <BuzzerButton />
            </motion.div>
          )}
        </div>

        {/* Answer input overlay */}
        <AnimatePresence>
          {phase === 'answering' && isMyBuzzer && (
            <AnswerInput
              timeLimit={10}
              onSubmit={handleAnswerSubmit}
              onTimeUp={handleAnswerTimeUp}
            />
          )}
        </AnimatePresence>

        {/* Result overlay */}
        <BlurOverlay show={showResult}>
          {lastResult && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-4"
            >
              {lastResult.correct ? (
                <>
                  <CheckCircle2 className="h-16 w-16 text-emerald-500" />
                  <span className="text-xl font-semibold text-emerald-500">To&apos;g&apos;ri!</span>
                  {buzzerPresses.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      Vaqt: {(buzzerPresses[0].timestamp / 1000).toFixed(2)}s
                    </span>
                  )}
                </>
              ) : (
                <>
                  <XCircle className="h-16 w-16 text-destructive" />
                  <span className="text-xl font-semibold text-destructive">Noto&apos;g&apos;ri</span>
                  <span className="text-sm text-muted-foreground">
                    Javob: {currentQuestion.correctAnswer}
                  </span>
                </>
              )}
            </motion.div>
          )}
        </BlurOverlay>
      </TgSafeArea>
    </AppShell>
  )
}
