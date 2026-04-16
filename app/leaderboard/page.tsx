'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AppShell } from '@/components/layout/app-shell'
import { TgSafeArea } from '@/components/layout/tg-safe-area'
import { RankingsTable } from '@/components/leaderboard/rankings-table'
import { MMRChangeBadge } from '@/components/leaderboard/mmr-change-badge'
import { Button } from '@/components/ui/button'
import { useGameStore } from '@/store/game-store'
import { useUserStore } from '@/store/user-store'
import { useTelegram } from '@/hooks/use-telegram'
import { Home, RotateCcw } from 'lucide-react'
import type { Player } from '@/types/user'

export default function LeaderboardPage() {
  const router = useRouter()
  const { showBack, hideBack } = useTelegram()
  
  const userId = useUserStore((state) => state.id)
  const username = useUserStore((state) => state.username)
  const mmr = useUserStore((state) => state.mmr)
  const updateMMR = useUserStore((state) => state.updateMMR)
  
  const players = useGameStore((state) => state.players)
  const scores = useGameStore((state) => state.scores)
  const mmrChanges = useGameStore((state) => state.mmrChanges)
  const mode = useGameStore((state) => state.mode)
  const reset = useGameStore((state) => state.reset)

  const userMMRChange = mmrChanges?.[userId || 'user'] || 15

  // Update user MMR
  useEffect(() => {
    if (userMMRChange !== 0) {
      updateMMR(userMMRChange)
    }
  }, [userMMRChange, updateMMR])

  // Setup back button
  useEffect(() => {
    showBack(() => {
      reset()
      router.push('/lobby')
    })
    return () => hideBack()
  }, [showBack, hideBack, reset, router])

  // Create ranked players list
  const rankedPlayers: Array<Player & { rank: number; mmrChange: number }> = [
    {
      id: userId || 'user',
      username: username,
      avatar: '',
      mmr: mmr,
      gamesPlayed: 1,
      wins: userMMRChange > 0 ? 1 : 0,
      losses: userMMRChange < 0 ? 1 : 0,
      isReady: true,
      score: scores[userId || 'user'] || 0,
      connected: true,
      rank: 1,
      mmrChange: userMMRChange,
    },
    ...players
      .filter((p) => p.id !== userId && p.id !== 'user')
      .map((player, index) => ({
        ...player,
        score: scores[player.id] || Math.floor(Math.random() * 30),
        rank: index + 2,
        mmrChange: Math.floor(Math.random() * 40) - 20,
      })),
  ]
    .sort((a, b) => b.score - a.score)
    .map((player, index) => ({ ...player, rank: index + 1 }))

  const handlePlayAgain = () => {
    reset()
    router.push('/lobby')
  }

  const handleGoHome = () => {
    reset()
    router.push('/lobby')
  }

  return (
    <AppShell>
      <TgSafeArea>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border/30 text-center">
            <h1 className="text-xl font-bold text-foreground">Natijalar jadvali</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === 'brain-ring' && 'Brain Ring'}
              {mode === 'kahoot' && 'Kahoot'}
              {mode === 'zakovat' && 'Zakovat'}
              {mode === 'erudit' && 'Erudit Kvarteti'}
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4">
            {/* MMR Change */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <MMRChangeBadge
                oldMMR={mmr - userMMRChange}
                newMMR={mmr}
              />
            </motion.div>

            {/* Rankings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-sm font-medium text-muted-foreground mb-3">
                O&apos;yin reytingi
              </h2>
              <RankingsTable
                players={rankedPlayers}
                currentUserId={userId}
              />
            </motion.div>
          </div>

          {/* Action buttons */}
          <div className="p-4 border-t border-border/30 flex gap-3">
            <Button
              variant="outline"
              onClick={handleGoHome}
              className="flex-1 h-12"
            >
              <Home className="h-4 w-4 mr-2" />
              Bosh sahifa
            </Button>
            <Button
              onClick={handlePlayAgain}
              className="flex-1 h-12"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Qayta o&apos;ynash
            </Button>
          </div>
        </div>
      </TgSafeArea>
    </AppShell>
  )
}
