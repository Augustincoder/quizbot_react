'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AppShell } from '@/components/layout/app-shell'
import { TgSafeArea } from '@/components/layout/tg-safe-area'
import { UserProfileCard } from '@/components/lobby/user-profile-card'
import { ModeGrid } from '@/components/lobby/mode-grid'
import { ModeSelectorSheet } from '@/components/lobby/mode-selector-sheet'
import { useGameStore } from '@/store/game-store'
import type { GameMode, MatchType } from '@/types/game'

export default function LobbyPage() {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null)
  const setRoom = useGameStore((state) => state.setRoom)

  const handleSelectMode = (mode: GameMode) => {
    setSelectedMode(mode)
    setSheetOpen(true)
  }

  const handleSelectMatchType = (matchType: MatchType) => {
    if (!selectedMode) return
    
    // Generate a mock room ID
    const roomId = `room_${Date.now()}`
    setRoom(roomId, selectedMode, matchType)
    
    // Navigate to matchmaking
    router.push('/matchmaking')
  }

  return (
    <AppShell>
      <TgSafeArea>
        <div className="flex flex-col h-full">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="border-b border-border/30"
          >
            <UserProfileCard />
          </motion.div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="p-4"
            >
              <h2 className="text-lg font-semibold text-foreground mb-1">
                O&apos;yin rejimini tanlang
              </h2>
              <p className="text-sm text-muted-foreground">
                4 xil rejimda bilimingizni sinab ko&apos;ring
              </p>
            </motion.div>

            <ModeGrid onSelectMode={handleSelectMode} />
          </div>
        </div>

        {/* Mode Selector Bottom Sheet */}
        <ModeSelectorSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          selectedMode={selectedMode}
          onSelectMatchType={handleSelectMatchType}
        />
      </TgSafeArea>
    </AppShell>
  )
}
