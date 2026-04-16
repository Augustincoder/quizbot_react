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
import { Badge } from '@/components/ui/badge'
import { useGameStore } from '@/store/game-store'
import { useUserStore } from '@/store/user-store'
import { useTelegram } from '@/hooks/use-telegram'
import type { Question } from '@/types/game'
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

// Mock Erudit questions
const mockQuestions: Question[] = [
  {
    id: 'e1',
    text: 'Qaysi matematik "Pi" sonining dastlabki hisob-kitoblarini amalga oshirgan?',
    category: 'Matematika',
    difficulty: 'hard',
    correctAnswer: 'Arximed',
    timeLimit: 15,
    points: 15,
  },
  {
    id: 'e2',
    text: 'Qaysi mamlakatda birinchi olimpiya o\'yinlari o\'tkazilgan?',
    category: 'Tarix',
    difficulty: 'medium',
    correctAnswer: 'Gretsiya',
    timeLimit: 15,
    points: 15,
  },
  {
    id: 'e3',
    text: 'Qaysi element inson tanasida eng ko\'p uchraydi?',
    category: 'Biologiya',
    difficulty: 'medium',
    correctAnswer: 'Kislorod',
    timeLimit: 15,
    points: 15,
  },
]

const WRONG_ANSWER_PENALTY = -10

export default function EruditPage() {
  const router = useRouter()
  const { haptic } = useTelegram()
  
  const userId = useUserStore((state) => state.id)
  const phase = useGameStore((state) => state.phase)
  const buzzerWinner = useGameStore((state) => state.buzzerWinner)
  const setPhase = useGameStore((state) => state.setPhase)
  const setQuestion = useGameStore((state) => state.setQuestion)
  const updateScore = useGameStore((state) => state.updateScore)
  const setGameEnd = useGameStore((state) => state.setGameEnd)
  const resetQuestion = useGameStore((state) => state.resetQuestion)

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(15)
  const [showResult, setShowResult] = useState(false)
  const [lastResult, setLastResult] = useState<{ correct: boolean; answer: string; penalty?: number } | null>(null)
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

    setTimeout(() => {
      moveToNextQuestion()
    }, 2000)
  }, [setPhase, haptic])

  const handleAnswerSubmit = useCallback((answer: string) => {
    const isCorrect = currentQuestion?.correctAnswer.toLowerCase() === answer.toLowerCase()
    
    if (isCorrect) {
      haptic('success')
      const points = currentQuestion?.points || 15
      setScores((prev) => ({
        ...prev,
        [userId || 'user']: (prev[userId || 'user'] || 0) + points,
      }))
      updateScore(userId || 'user', points)
      setLastResult({ correct: true, answer })
    } else {
      haptic('error')
      // Apply penalty for wrong answer in Erudit mode
      setScores((prev) => ({
        ...prev,
        [userId || 'user']: (prev[userId || 'user'] || 0) + WRONG_ANSWER_PENALTY,
      }))
      updateScore(userId || 'user', WRONG_ANSWER_PENALTY)
      setLastResult({ correct: false, answer, penalty: WRONG_ANSWER_PENALTY })
    }

    setShowResult(true)

    setTimeout(() => {
      moveToNextQuestion()
    }, 2500)
  }, [currentQuestion, haptic, updateScore, userId])

  const handleAnswerTimeUp = useCallback(() => {
    setPhase('results')
    // Apply penalty for no answer
    setScores((prev) => ({
      ...prev,
      [userId || 'user']: (prev[userId || 'user'] || 0) + WRONG_ANSWER_PENALTY,
    }))
    updateScore(userId || 'user', WRONG_ANSWER_PENALTY)
    setLastResult({ correct: false, answer: 'Javob vaqti tugadi', penalty: WRONG_ANSWER_PENALTY })
    setShowResult(true)
    haptic('error')

    setTimeout(() => {
      moveToNextQuestion()
    }, 2000)
  }, [setPhase, haptic, updateScore, userId])

  const moveToNextQuestion = useCallback(() => {
    setShowResult(false)
    setLastResult(null)
    resetQuestion()

    const nextIndex = currentQuestionIndex + 1
    if (nextIndex >= mockQuestions.length) {
      setGameEnd(scores, { [userId || 'user']: scores[userId || 'user'] > 0 ? 20 : -10 }, userId || 'user')
      router.push('/results')
      return
    }

    setCurrentQuestionIndex(nextIndex)
    const question = mockQuestions[nextIndex]
    setCurrentQuestion(question)
    setQuestion(question, nextIndex + 1, mockQuestions.length)
    setPhase('question')
    setTimeRemaining(question.timeLimit)
  }, [currentQuestionIndex, scores, userId, setGameEnd, router, setQuestion, setPhase, resetQuestion])

  if (!currentQuestion) {
    return (
      <AppShell className="items-center justify-center">
        <div className="text-muted-foreground">Yuklanmoqda...</div>
      </AppShell>
    )
  }

  const currentScore = scores[userId || 'user'] || 0

  return (
    <AppShell>
      <TgSafeArea>
        <div className="flex flex-col h-full">
          {/* Header with timer */}
          <div className="p-4 border-b border-border/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Erudit Kvarteti</span>
                <Badge variant="outline" className="text-xs bg-rose-500/10 text-rose-500 border-rose-500/30">
                  -10 jazo
                </Badge>
              </div>
              <span className={`text-sm font-medium ${currentScore < 0 ? 'text-destructive' : 'text-foreground'}`}>
                {currentScore} ball
              </span>
            </div>
            <ProgressTimer
              timeRemaining={timeRemaining}
              totalTime={currentQuestion.timeLimit}
              variant="bar"
            />
          </div>

          {/* Warning banner */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3"
          >
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <span className="text-sm text-amber-600">
              Noto&apos;g&apos;ri javob uchun -10 ball olinadi!
            </span>
          </motion.div>

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
          </div>

          {/* Buzzer area */}
          {phase === 'question' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4 pb-8"
            >
              <p className="text-sm text-muted-foreground">
                Ishonchingiz komil bo&apos;lsagina bosing
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
                  <span className="text-lg font-bold text-emerald-500">+{currentQuestion.points} ball</span>
                </>
              ) : (
                <>
                  <XCircle className="h-16 w-16 text-destructive" />
                  <span className="text-xl font-semibold text-destructive">Noto&apos;g&apos;ri</span>
                  {lastResult.penalty && (
                    <span className="text-lg font-bold text-destructive">{lastResult.penalty} ball</span>
                  )}
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
