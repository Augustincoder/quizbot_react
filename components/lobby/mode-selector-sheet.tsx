'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Users, UserPlus, ChevronRight } from 'lucide-react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { triggerHaptic } from '@/lib/telegram'
import type { GameMode, MatchType } from '@/types/game'
import { GAME_MODES } from '@/types/game'

interface ModeSelectorSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedMode: GameMode | null
  onSelectMatchType: (matchType: MatchType) => void
}

const matchTypes: Array<{
  id: MatchType
  label: string
  labelUz: string
  description: string
  descriptionUz: string
  icon: typeof User
}> = [
  {
    id: 'solo',
    label: 'Solo Practice',
    labelUz: 'Yakka mashq',
    description: 'Practice against AI',
    descriptionUz: 'AI bilan mashq qiling',
    icon: User,
  },
  {
    id: '1v1',
    label: '1v1 Match',
    labelUz: '1v1 o\'yin',
    description: 'Compete against a random opponent',
    descriptionUz: 'Tasodifiy raqibga qarshi',
    icon: Users,
  },
  {
    id: 'friends',
    label: 'Play with Friends',
    labelUz: 'Do\'stlar bilan',
    description: 'Invite friends to play',
    descriptionUz: 'Do\'stlaringizni taklif qiling',
    icon: UserPlus,
  },
]

export function ModeSelectorSheet({
  open,
  onOpenChange,
  selectedMode,
  onSelectMatchType,
}: ModeSelectorSheetProps) {
  const [selected, setSelected] = useState<MatchType | null>(null)
  const modeConfig = GAME_MODES.find((m) => m.id === selectedMode)

  const handleSelect = (type: MatchType) => {
    triggerHaptic('selection')
    setSelected(type)
  }

  const handleConfirm = () => {
    if (!selected) return
    triggerHaptic('medium')
    onSelectMatchType(selected)
    onOpenChange(false)
    setSelected(null)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="rounded-t-3xl">
        <DrawerHeader className="text-center">
          <DrawerTitle className="text-xl font-semibold">
            {modeConfig?.nameUz || 'Select Mode'}
          </DrawerTitle>
          <DrawerDescription className="text-muted-foreground">
            O&apos;yin turini tanlang
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-2 px-4 pb-4">
          {matchTypes.map((type, index) => {
            const Icon = type.icon
            const isSelected = selected === type.id
            
            return (
              <motion.button
                key={type.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.2 }}
                onClick={() => handleSelect(type.id)}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl',
                  'border transition-all duration-200',
                  isSelected
                    ? 'bg-primary/10 border-primary/50'
                    : 'bg-card/50 border-border/30 hover:bg-card/70'
                )}
              >
                <div className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl',
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}>
                  <Icon className="h-6 w-6" />
                </div>
                
                <div className="flex-1 text-left">
                  <span className="block font-medium text-foreground">
                    {type.labelUz}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {type.descriptionUz}
                  </span>
                </div>
                
                <ChevronRight className={cn(
                  'h-5 w-5 transition-colors',
                  isSelected ? 'text-primary' : 'text-muted-foreground/50'
                )} />
              </motion.button>
            )
          })}
        </div>

        <div className="px-4 pb-6">
          <Button
            onClick={handleConfirm}
            disabled={!selected}
            className="w-full h-12 text-base font-medium rounded-xl"
          >
            Boshlash
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
