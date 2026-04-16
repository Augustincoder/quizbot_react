'use client'

import { motion } from 'framer-motion'
import { Triangle, Diamond, Circle, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { triggerHaptic } from '@/lib/telegram'

interface KahootButtonsProps {
  options: string[]
  onSelect: (index: number, answer: string) => void
  disabled?: boolean
  selectedIndex?: number | null
  correctIndex?: number | null
  className?: string
}

const buttonConfig = [
  {
    color: 'bg-rose-400/80 hover:bg-rose-400/90 active:bg-rose-500/90',
    selectedColor: 'bg-rose-500',
    icon: Triangle,
    label: 'A',
  },
  {
    color: 'bg-sky-400/80 hover:bg-sky-400/90 active:bg-sky-500/90',
    selectedColor: 'bg-sky-500',
    icon: Diamond,
    label: 'B',
  },
  {
    color: 'bg-amber-300/80 hover:bg-amber-300/90 active:bg-amber-400/90',
    selectedColor: 'bg-amber-400',
    icon: Circle,
    label: 'C',
  },
  {
    color: 'bg-emerald-400/80 hover:bg-emerald-400/90 active:bg-emerald-500/90',
    selectedColor: 'bg-emerald-500',
    icon: Square,
    label: 'D',
  },
]

export function KahootButtons({
  options,
  onSelect,
  disabled,
  selectedIndex,
  correctIndex,
  className,
}: KahootButtonsProps) {
  const handleSelect = (index: number) => {
    if (disabled) return
    triggerHaptic('medium')
    onSelect(index, options[index])
  }

  return (
    <div className={cn('grid grid-cols-2 gap-3 p-4', className)}>
      {options.slice(0, 4).map((option, index) => {
        const config = buttonConfig[index]
        const Icon = config.icon
        const isSelected = selectedIndex === index
        const isCorrect = correctIndex === index
        const isWrong = selectedIndex === index && correctIndex !== null && correctIndex !== index

        return (
          <motion.button
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.2 }}
            onClick={() => handleSelect(index)}
            disabled={disabled}
            className={cn(
              'relative flex flex-col items-center justify-center gap-2',
              'aspect-[4/3] rounded-2xl p-4',
              'transition-all duration-200',
              'active:scale-[0.97]',
              'text-white font-semibold',
              isCorrect
                ? 'bg-emerald-500 ring-4 ring-emerald-400/50'
                : isWrong
                ? 'bg-rose-600 ring-4 ring-rose-400/50 opacity-60'
                : isSelected
                ? config.selectedColor
                : config.color,
              disabled && !isSelected && 'opacity-50'
            )}
          >
            {/* Shape icon */}
            <Icon className="h-6 w-6 opacity-60" />
            
            {/* Answer text */}
            <span className="text-sm text-center leading-tight line-clamp-3">
              {option}
            </span>

            {/* Letter badge */}
            <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
              {config.label}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
