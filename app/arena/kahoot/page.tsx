'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AppShell } from '@/components/layout/app-shell'
import { TgSafeArea } from '@/components/layout/tg-safe-area'
import { QuestionDisplay } from '@/components/arena/question-display'
import { ProgressTimer } from '@/components/arena/progress-timer'
import { KahootButtons } from '@/components/arena/kahoot-buttons'
import { BlurOverlay } from '@/components/arena/blur-overlay'
import { useGameStore } from '@/store/game-store'
import { useUserStore } from '@/store/user-store'
import { useTelegram } from '@/hooks/use-telegram'
import type { Question } from '@/types/game'
import { CheckCircle2, XCircle } from 'lucide-react'

// Mock Kahoot questions with options
const mockQuestions: Question[] = [
  {
    id: 'k1',
    text: 'Qaysi davlat dunyodagi eng katta maydonga ega?',
    category: 'Geografiya',
    difficulty: 'easy',
    correctAnswer: 'Rossiya',
    options: ['AQSH', 'Xitoy', 'Rossiya', 'Kanada'],
    timeLimit: 20,
    points: 10,
  },
  {
    id: 'k2',
    text: 'Qaysi element davriy jadvalda birinchi o\'rinda turadi?',
    category: 'Kimyo',
    difficulty: 'easy',
    correctAnswer: 'Vodorod',
    options: ['Geliy', 'Vodorod', 'Litiy', 'Uglerod'],
    timeLimit: 20,
    points: 10,
  },
  {
    id: 'k3',
    text: 'Qaysi yil O\'zbekiston mustaqillikka erishdi?',
    category: 'Tarix',
    difficulty: 'medium',
    correctAnswer: '1991',
    options: ['1989', '1990', '1991', '1992'],
    timeLimit: 15,
    points: 15,
  },
]

export default function KahootPage() {
  const router = useRouter()
  const { haptic } = useTelegram()
  
  const userId = useUserStore((state) => state.id)
  const setPhase = useGameStore((state) => state.setPhase)
  const setQuestion = useGameStore((state) => state.setQuestion)
  const updateScore = useGameStore((state) => state.updateScore)
  const setGameEnd = useGameStore((state) => state.setGameEnd)

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(20)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [correctIndex, setCorrectIndex] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [answered, setAnswered] = useState(false)

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
    if (!currentQuestion || answered) return

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
  }, [currentQuestion, answered])

  const handleTimeUp = useCallback(() => {
    if (answered) return
    setAnswered(true)
    setShowResult(true)
    setIsCorrect(false)
    
    const correctIdx = currentQuestion?.options?.findIndex(
      (opt) => opt === currentQuestion.correctAnswer
    ) ?? -1
    setCorrectIndex(correctIdx)
    
    haptic('error')

    setTimeout(() => {
      moveToNextQuestion()
    }, 2000)
  }, [currentQuestion, haptic, answered])

  const handleSelectAnswer = useCallback((index: number, answer: string) => {
    if (answered) return
    
    setAnswered(true)
    setSelectedIndex(index)
    
    const correct = answer === currentQuestion?.correctAnswer
    setIsCorrect(correct)
    
    const correctIdx = currentQuestion?.options?.findIndex(
      (opt) => opt === currentQuestion.correctAnswer
    ) ?? -1
    setCorrectIndex(correctIdx)

    if (correct) {
      haptic('success')
      // Score based on time remaining
      const basePoints = currentQuestion?.points || 10
      const timeBonus = Math.floor((timeRemaining / (currentQuestion?.timeLimit || 20)) * 5)
      const totalPoints = basePoints + timeBonus
      
      setScores((prev) => ({
        ...prev,
        [userId || 'user']: (prev[userId || 'user'] || 0) + totalPoints,
      }))
      updateScore(userId || 'user', totalPoints)
    } else {
      haptic('error')
    }

    setShowResult(true)

    setTimeout(() => {
      moveToNextQuestion()
    }, 2000)
  }, [currentQuestion, timeRemaining, haptic, updateScore, userId, answered])

  const moveToNextQuestion = useCallback(() => {
    setShowResult(false)
    setSelectedIndex(null)
    setCorrectIndex(null)
    setAnswered(false)

    const nextIndex = currentQuestionIndex + 1
    if (nextIndex >= mockQuestions.length) {
      setGameEnd(scores, { [userId || 'user']: 20 }, userId || 'user')
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
              <span className="text-sm font-medium text-muted-foreground">Kahoot</span>
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
          </div>

          {/* Answer buttons */}
          {currentQuestion.options && (
            <KahootButtons
              options={currentQuestion.options}
              onSelect={handleSelectAnswer}
              disabled={answered}
              selectedIndex={selectedIndex}
              correctIndex={showResult ? correctIndex : null}
            />
          )}
        </div>

        {/* Result overlay */}
        <BlurOverlay show={showResult}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            {isCorrect ? (
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
        </BlurOverlay>
      </TgSafeArea>
    </AppShell>
  )
}
