'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AppShell } from '@/components/layout/app-shell'
import { TgSafeArea } from '@/components/layout/tg-safe-area'
import { ScoreSummary } from '@/components/results/score-summary'
import { AIRecheckButton } from '@/components/results/ai-recheck-button'
import { PeerVoteCard } from '@/components/results/peer-vote-card'
import { Button } from '@/components/ui/button'
import { useGameStore } from '@/store/game-store'
import { useUserStore } from '@/store/user-store'
import { useTelegram } from '@/hooks/use-telegram'
import { Crown, ArrowRight, Bot, AlertTriangle, ChevronRight } from 'lucide-react'
import confetti from 'canvas-confetti'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

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
  
  // AI Recheck Modal State
  const [isAIModalOpen, setIsAIModalOpen] = useState(false)
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)

  // Mock answered questions
  const mockAnsweredQuestions = [
    { id: 'q1', text: "Qaysi sayyora Quyosh tizimida eng katta?", userAnswer: "Jupiter", isCorrect: false, correctRate: 85 },
    { id: 'q2', text: "O'zbekistonning poytaxti qaysi shahar?", userAnswer: "Toshkent shahri", isCorrect: false, correctRate: 32 },
    { id: 'q3', text: "Kimyoviy element 'Au' ning nomi nima?", userAnswer: "Oltinn", isCorrect: false, correctRate: 90 },
  ].sort((a, b) => a.correctRate - b.correctRate) // Sort by lowest correct rate (most controversial first)

  useEffect(() => {
    if (isAIModalOpen && !selectedQuestionId) {
      // Auto-select most controversial
      setSelectedQuestionId(mockAnsweredQuestions[0].id)
    }
  }, [isAIModalOpen, selectedQuestionId, mockAnsweredQuestions])

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
              className="mb-4 flex flex-col gap-2"
            >
              <h3 className="text-sm font-medium text-foreground">Javobni qayta tekshirish</h3>
              <Button
                variant="outline"
                onClick={() => setIsAIModalOpen(true)}
                className="w-full h-12 rounded-xl gap-2 bg-card border-primary/30 text-primary hover:bg-primary/5"
              >
                <Bot className="h-5 w-5" />
                AI orqali tekshirish
              </Button>
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

        {/* AI Recheck Modal */}
        <Dialog open={isAIModalOpen} onOpenChange={setIsAIModalOpen}>
          <DialogContent className="rounded-3xl border-border/30 bg-background/98 backdrop-blur-xl sm:max-w-md p-0 flex flex-col max-h-[85vh]">
            <DialogHeader className="p-6 pb-2 text-center border-b border-border/30 shrink-0">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <DialogTitle className="text-xl">AI Tekshiruvi</DialogTitle>
              <DialogDescription className="text-sm mt-1">
                Noto&apos;g&apos;ri deb topilgan javobingizni AI qayta tekshirib berishi mumkin.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 mb-1 px-1">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Munozarali javoblar
                </span>
              </div>
              
              {mockAnsweredQuestions.map((q, index) => {
                const isSelected = selectedQuestionId === q.id
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setSelectedQuestionId(q.id)
                      setAIRecheckResult(null) // reset result when changing selection
                    }}
                    className={cn(
                      "flex flex-col text-left p-4 rounded-xl border transition-all duration-200",
                      isSelected 
                        ? "bg-primary/5 border-primary shadow-sm" 
                        : "bg-card/50 border-border/30 hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 w-full">
                      <span className="text-sm font-medium leading-snug line-clamp-2">
                        {q.text}
                      </span>
                      {index === 0 && (
                        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500">
                          {q.correctRate}% to&apos;g&apos;ri
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-2 w-full">
                      <span className="text-xs text-muted-foreground">Sizning javobingiz:</span>
                      <span className={cn(
                        "text-sm font-semibold truncate",
                        isSelected ? "text-primary" : "text-foreground"
                      )}>
                        &quot;{q.userAnswer}&quot;
                      </span>
                    </div>
                  </button>
                )
              })}

              {/* Show result if checked */}
              <AnimatePresence>
                {aiRecheckResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className={cn(
                      "mt-2 p-4 rounded-xl text-sm leading-relaxed border",
                      aiRecheckResult.isValid
                        ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                        : "bg-rose-500/10 text-rose-700 border-rose-500/30"
                    )}
                  >
                    {aiRecheckResult.explanation}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-4 border-t border-border/30 bg-background/50 shrink-0">
              <AIRecheckButton
                questionText={mockAnsweredQuestions.find(q => q.id === selectedQuestionId)?.text || ''}
                userAnswer={mockAnsweredQuestions.find(q => q.id === selectedQuestionId)?.userAnswer || ''}
                onResult={handleAIRecheckResult}
                className="w-full h-12 rounded-xl"
              />
            </div>
          </DialogContent>
        </Dialog>
      </TgSafeArea>
    </AppShell>
  )
}
