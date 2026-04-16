'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AppShell } from '@/components/layout/app-shell'
import { TgSafeArea } from '@/components/layout/tg-safe-area'
import { ScoreSummary } from '@/components/results/score-summary'
import { AIRecheckButton } from '@/components/results/ai-recheck-button'
import { PeerVoteCard } from '@/components/results/peer-vote-card'
import { Button } from '@/components/ui/button'
import { useGameStore } from '@/store/game-store'
import { useUserStore } from '@/store/user-store'
import { useTelegram } from '@/hooks/use-telegram'
import { Crown, ArrowRight } from 'lucide-react'
import confetti from 'canvas-confetti'

export default function ResultsPage() {
  const router = useRouter()
  const { haptic } = useTelegram()
  
  const userId = useUserStore((state) => state.id)
  const username = useUserStore((state) => state.username)
  const scores = useGameStore((state) => state.scores)
  const winner = useGameStore((state) => state.winner)
  const mode = useGameStore((state) => state.mode)
  const reset = useGameStore((state) => state.reset)

  const [showConfetti, setShowConfetti] = useState(false)
  const [aiRecheckResult, setAIRecheckResult] = useState<{ isValid: boolean; explanation: string } | null>(null)

  const userScore = scores[userId || 'user'] || 0
  const isWinner = winner === userId || winner === 'user'

  // Show confetti for winner
  useEffect(() => {
    if (isWinner && !showConfetti) {
      setShowConfetti(true)
      haptic('success')
      
      const duration = 3 * 1000
      const animationEnd = Date.now() + duration

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          clearInterval(interval)
          return
        }

        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#22c55e', '#3b82f6', '#f59e0b'],
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#22c55e', '#3b82f6', '#f59e0b'],
        })
      }, 100)

      return () => clearInterval(interval)
    }
  }, [isWinner, showConfetti, haptic])

  const handleAIRecheckResult = (isValid: boolean, explanation: string) => {
    setAIRecheckResult({ isValid, explanation })
  }

  const handlePeerVote = (accepted: boolean) => {
    haptic('light')
  }

  const handleContinue = () => {
    router.push('/leaderboard')
  }

  const handlePlayAgain = () => {
    reset()
    router.push('/lobby')
  }

  return (
    <AppShell>
      <TgSafeArea>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border/30 text-center">
            <h1 className="text-xl font-bold text-foreground">O&apos;yin yakunlandi</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === 'brain-ring' && 'Brain Ring'}
              {mode === 'kahoot' && 'Kahoot'}
              {mode === 'zakovat' && 'Zakovat'}
              {mode === 'erudit' && 'Erudit Kvarteti'}
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4">
            {/* Winner badge */}
            {isWinner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="flex flex-col items-center mb-6"
              >
                <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-3">
                  <Crown className="h-10 w-10 text-amber-500" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Tabriklaymiz!</h2>
                <p className="text-muted-foreground">Siz g&apos;olib bo&apos;ldingiz, {username}!</p>
              </motion.div>
            )}

            {!isWinner && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-6"
              >
                <h2 className="text-xl font-semibold text-foreground">Yaxshi o&apos;yin!</h2>
                <p className="text-muted-foreground">Keyingi safar omad, {username}!</p>
              </motion.div>
            )}

            {/* Score summary */}
            <ScoreSummary
              totalScore={userScore}
              correctAnswers={Math.max(0, Math.floor(userScore / 10))}
              totalQuestions={3}
              averageTime={5.2}
              className="mb-6"
            />

            {/* AI Recheck section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-4"
            >
              <h3 className="text-sm font-medium text-foreground mb-2">Javobni qayta tekshirish</h3>
              <div className="flex flex-col gap-2">
                <AIRecheckButton
                  questionText="Qaysi sayyora Quyosh tizimida eng katta?"
                  userAnswer="Jupiter"
                  onResult={handleAIRecheckResult}
                />
                {aiRecheckResult && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`p-3 rounded-lg text-sm ${
                      aiRecheckResult.isValid
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-600 border border-rose-500/30'
                    }`}
                  >
                    {aiRecheckResult.explanation}
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Peer vote section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-sm font-medium text-foreground mb-2">Munozarali javob</h3>
              <PeerVoteCard
                questionText="O'zbekistonning poytaxti qaysi shahar?"
                userAnswer="Toshkent shahri"
                onVote={handlePeerVote}
                votesYes={3}
                votesNo={1}
              />
            </motion.div>
          </div>

          {/* Action buttons */}
          <div className="p-4 border-t border-border/30 flex gap-3">
            <Button
              variant="outline"
              onClick={handlePlayAgain}
              className="flex-1 h-12"
            >
              Qayta o&apos;ynash
            </Button>
            <Button
              onClick={handleContinue}
              className="flex-1 h-12"
            >
              Davom etish
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </TgSafeArea>
    </AppShell>
  )
}
