'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AppShell } from '@/components/layout/app-shell'
import { TgSafeArea } from '@/components/layout/tg-safe-area'
import { QuestionDisplay } from '@/components/arena/question-display'
import { ProgressTimer } from '@/components/arena/progress-timer'
import { KahootButtons } from '@/components/arena/kahoot-buttons'
import { KahootLeaderboard } from '@/components/arena/kahoot-leaderboard'
import { BlurOverlay } from '@/components/arena/blur-overlay'
import { useGameStore } from '@/store/game-store'
import { useUserStore } from '@/store/user-store'
import { useTelegram } from '@/hooks/use-telegram'
import { useGameSocket } from '@/hooks/use-game-socket'
import { useTimer } from '@/hooks/use-timer'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

// Mock opponent data (will be synced via RoomManager in Phase 4)
const mockPlayers = [
  { id: 'bot1', name: 'Jasur_AI' },
  { id: 'bot2', name: 'Malika_Bot' },
]

export default function KahootPage() {
  const router = useRouter()
  const { haptic } = useTelegram()
  const { submitAnswer, joinRoom } = useGameSocket()
  const { timeRemaining } = useTimer()

  const userId = useUserStore((state) => state.id)
  const username = useUserStore((state) => state.username)
  
  const roomId = useGameStore((state) => state.roomId)
  const mode = useGameStore((state) => state.mode)
  const matchType = useGameStore((state) => state.matchType)
  
  const phase = useGameStore((state) => state.phase)
  const currentQuestion = useGameStore((state) => state.currentQuestion)
  const questionNumber = useGameStore((state) => state.questionNumber)
  const totalQuestions = useGameStore((state) => state.totalQuestions)
  const scores = useGameStore((state) => state.scores)
  
  const isCorrect = useGameStore((state) => state.isCorrect)
  const pointsEarned = useGameStore((state) => state.pointsEarned)
  const answeredPlayerId = useGameStore((state) => state.answeredPlayerId)
  const submittedAnswer = useGameStore((state) => state.submittedAnswer)
  const globalCorrectAnswer = useGameStore((state) => state.correctAnswer)

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [correctIndex, setCorrectIndex] = useState<number | null>(null)
  
  // Local Kahoot phase for rendering the inter-question leaderboard
  const [kahootPhase, setKahootPhase] = useState<'question' | 'leaderboard'>('question')
  const [lastPointsDelta, setLastPointsDelta] = useState<Record<string, number>>({})

  // Track if we answered locally to disable buttons
  const [answered, setAnswered] = useState(false)

  // Join Room On Mount
  useEffect(() => {
    let mounted = true
    const actRoom = roomId || `room_${Date.now()}`
    const actMode = mode || 'kahoot'
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

  // Handle server broadcasting results
  useEffect(() => {
    if (phase === 'results' && currentQuestion) {
      // Find the correct index to highlight
      if (globalCorrectAnswer && currentQuestion.options) {
        const cIndex = currentQuestion.options.findIndex((opt) => opt === globalCorrectAnswer)
        setCorrectIndex(cIndex !== -1 ? cIndex : null)
      }

      // Record point deltas for the leaderboard
      if (answeredPlayerId && pointsEarned !== undefined) {
        setLastPointsDelta(prev => ({
          ...prev,
          [answeredPlayerId]: pointsEarned,
        }))
      }

      // After 2.5s showing the correct answer overlay, transit locally to leaderboard
      const timer = setTimeout(() => {
        setKahootPhase('leaderboard')
      }, 2500)

      return () => clearInterval(timer)
    }
  }, [phase, globalCorrectAnswer, currentQuestion, answeredPlayerId, pointsEarned])

  // Process incoming question from server
  useEffect(() => {
    if (phase === 'question' && currentQuestion) {
      setKahootPhase('question')
      setSelectedIndex(null)
      setCorrectIndex(null)
      setAnswered(false)
    }
  }, [phase, currentQuestion])

  // Memoize leaderboard entries to prevent recalculation
  const leaderboardEntries = useMemo(() => {
    if (kahootPhase !== 'leaderboard' || phase !== 'results') return []
    
    return [
      {
        playerId: userId || 'user',
        playerName: username,
        score: scores[userId || 'user'] || 0,
        delta: lastPointsDelta[userId || 'user'] || 0,
        isCurrentUser: true,
      },
      ...mockPlayers.map((p) => ({
        playerId: p.id,
        playerName: p.name,
        score: scores[p.id] || 0,
        delta: lastPointsDelta[p.id] || 0,
      })),
    ]
  }, [kahootPhase, phase, userId, username, scores, lastPointsDelta])

  const handleSelectAnswer = useCallback(
    (index: number) => {
      if (answered || !currentQuestion || !currentQuestion.options) return
      
      haptic('medium')
      setAnswered(true)
      setSelectedIndex(index)
      
      const answerText = currentQuestion.options[index]
      useGameStore.getState().submitAnswer(answerText)
      submitAnswer(answerText)
    },
    [answered, currentQuestion, haptic, submitAnswer]
  )

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

  // Inter-question Leaderboard Mode
  if (kahootPhase === 'leaderboard' && phase === 'results') {
    return (
      <AppShell>
        <TgSafeArea>
          <KahootLeaderboard
            entries={leaderboardEntries}
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
            // Auto continue isn't fired locally, the server handles it and will emit `question_start`
            // So onContinue just waits
            onContinue={() => {}}
          />
        </TgSafeArea>
      </AppShell>
    )
  }

  const isTimeUpOrResults = phase === 'results'

  return (
    <AppShell>
      <TgSafeArea>
        <div className="flex flex-col h-full">
          {/* Header with timer */}
          <div className="p-4 border-b border-border/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Kahoot</span>
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
                questionNumber={questionNumber}
                totalQuestions={totalQuestions}
              />
            </AnimatePresence>
          </div>

          {/* Answer buttons */}
          {currentQuestion.options && (
            <KahootButtons
              options={currentQuestion.options}
              onSelect={handleSelectAnswer}
              disabled={answered || isTimeUpOrResults}
              selectedIndex={selectedIndex}
              correctIndex={isTimeUpOrResults ? correctIndex : null}
            />
          )}
        </div>

        {/* Result overlay */}
        <BlurOverlay show={isTimeUpOrResults && kahootPhase === 'question'}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-4 text-center"
          >
            {answeredPlayerId === (userId || 'user') ? (
              isCorrect ? (
                <>
                  <CheckCircle2 className="h-16 w-16 text-emerald-500" />
                  <span className="text-xl font-semibold text-emerald-500">To&apos;g&apos;ri!</span>
                  <span className="text-sm text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full font-bold border border-emerald-500/20">
                    +{pointsEarned} ball
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-16 w-16 text-destructive" />
                  <span className="text-xl font-semibold text-destructive">Noto&apos;g&apos;ri</span>
                  <div className="mt-2 text-sm text-foreground bg-card/80 p-3 rounded-lg border border-border/50">
                    <span className="text-muted-foreground mr-1">To'g'ri javob:</span>
                    <span className="font-semibold">{globalCorrectAnswer}</span>
                  </div>
                </>
              )
            ) : (
              <>
                <XCircle className="h-16 w-16 text-muted-foreground" />
                <span className="text-xl font-semibold text-foreground">Vaqt tugadi</span>
                <div className="mt-2 text-sm text-foreground bg-card/80 p-3 rounded-lg border border-border/50">
                  <span className="text-muted-foreground mr-1">To'g'ri javob:</span>
                  <span className="font-semibold">{globalCorrectAnswer}</span>
                </div>
              </>
            )}
          </motion.div>
        </BlurOverlay>
      </TgSafeArea>
    </AppShell>
  )
}
