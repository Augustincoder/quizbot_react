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
import { triggerHaptic } from '@/lib/telegram'
import type { Question } from '@/types/game'
import { CheckCircle2, XCircle } from 'lucide-react'

// Mock questions for demo
const mockQuestions: Question[] = [
  {
    id: 'q1',
    text: 'Qaysi sayyora Quyosh tizimida eng katta hisoblanadi?',
    category: 'Astronomiya',
    difficulty: 'easy',
    correctAnswer: 'Yupiter',
    timeLimit: 15,
    points: 10,
  },
  {
    id: 'q2',
    text: 'O\'zbekistonning poytaxti qaysi shahar?',
    category: 'Geografiya',
    difficulty: 'easy',
    correctAnswer: 'Toshkent',
    timeLimit: 15,
    points: 10,
  },
  {
    id: 'q3',
    text: 'Kimyoviy element "Au" ning nomi nima?',
    category: 'Kimyo',
    difficulty: 'medium',
    correctAnswer: 'Oltin',
    timeLimit: 15,
    points: 15,
  },
]

export default function BrainRingPage() {
  const router = useRouter()
  const { haptic } = useTelegram()
  
  const userId = useUserStore((state) => state.id)
  const phase = useGameStore((state) => state.phase)
  const buzzerWinner = useGameStore((state) => state.buzzerWinner)
  const setPhase = useGameStore((state) => state.setPhase)
  const setQuestion = useGameStore((state) => state.setQuestion)
  const submitAnswer = useGameStore((state) => state.submitAnswer)
  const setAnswerResult = useGameStore((state) => state.setAnswerResult)
  const updateScore = useGameStore((state) => state.updateScore)
  const setGameEnd = useGameStore((state) => state.setGameEnd)

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(15)
  const [showResult, setShowResult] = useState(false)
  const [lastResult, setLastResult] = useState<{ correct: boolean; answer: string } | null>(null)
  const [scores, setScores] = useState<Record<string, number>>({})

  const isMyBuzzer = buzzerWinner === userId

  // Start game with first question
  useEffect(() => {
    const question = mockQuestions[0]
    setCurrentQuestion(question)
    setQuestion(question, 1, mockQuestions.length)
    setPhase('question')
    setTimeRemaining(question.timeLimit)
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

    // Move to next question after delay
    setTimeout(() => {
      moveToNextQuestion()
    }, 2000)
  }, [setPhase, haptic])

  const handleAnswerSubmit = useCallback((answer: string) => {
    submitAnswer(answer)
    
    // Check if answer is correct (simple comparison for demo)
    const isCorrect = currentQuestion?.correctAnswer.toLowerCase() === answer.toLowerCase()
    setAnswerResult(isCorrect, currentQuestion?.correctAnswer || '')
    setLastResult({ correct: isCorrect, answer })
    setShowResult(true)

    if (isCorrect) {
      haptic('success')
      const points = currentQuestion?.points || 10
      setScores((prev) => ({
        ...prev,
        [userId || 'user']: (prev[userId || 'user'] || 0) + points,
      }))
      updateScore(userId || 'user', points)
    } else {
      haptic('error')
    }

    // Move to next question after delay
    setTimeout(() => {
      moveToNextQuestion()
    }, 2500)
  }, [currentQuestion, submitAnswer, setAnswerResult, haptic, updateScore, userId])

  const handleAnswerTimeUp = useCallback(() => {
    setPhase('results')
    setLastResult({ correct: false, answer: 'Vaqt tugadi' })
    setShowResult(true)
    haptic('error')

    setTimeout(() => {
      moveToNextQuestion()
    }, 2000)
  }, [setPhase, haptic])

  const moveToNextQuestion = useCallback(() => {
    setShowResult(false)
    setLastResult(null)

    const nextIndex = currentQuestionIndex + 1
    if (nextIndex >= mockQuestions.length) {
      // Game finished
      setGameEnd(scores, { [userId || 'user']: 15 }, userId || 'user')
      router.push('/results')
      return
    }

    setCurrentQuestionIndex(nextIndex)
    const question = mockQuestions[nextIndex]
    setCurrentQuestion(question)
    setQuestion(question, nextIndex + 1, mockQuestions.length)
    setPhase('question')
    setTimeRemaining(question.timeLimit)
  }, [currentQuestionIndex, scores, userId, setGameEnd, router, setQuestion, setPhase])

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
              <span className="text-sm font-medium text-muted-foreground">Brain Ring</span>
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
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <AnimatePresence mode="wait">
              <QuestionDisplay
                key={currentQuestion.id}
                question={currentQuestion}
                questionNumber={currentQuestionIndex + 1}
                totalQuestions={mockQuestions.length}
              />
            </AnimatePresence>
          </div>

          {/* Buzzer area */}
          {phase === 'question' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4 pb-8"
            >
              <p className="text-sm text-muted-foreground">
                Javob berish uchun bosing
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
