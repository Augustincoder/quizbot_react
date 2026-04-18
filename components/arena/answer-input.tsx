'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Send } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ProgressTimer } from './progress-timer'
import { cn } from '@/lib/utils'
import { triggerHaptic } from '@/lib/telegram'

import { useGameStore } from '@/store/game-store'
import { useUserStore } from '@/store/user-store'

interface AnswerInputProps {
  timeLimit: number
  onSubmit: (answer: string) => void
  onTimeUp: () => void
  disabled?: boolean
  className?: string
}

export function AnswerInput({
  timeLimit,
  onSubmit,
  onTimeUp,
  disabled,
  className,
}: AnswerInputProps) {
  const [answer, setAnswer] = useState('')
  const [timeRemaining, setTimeRemaining] = useState(timeLimit)
  const inputRef = useRef<HTMLInputElement>(null)

  const currentPhase = useGameStore((state) => state.currentPhase)
  const mode = useGameStore((state) => state.mode)
  const buzzerLockedBy = useGameStore((state) => state.buzzerLockedBy)
  const userId = useUserStore((state) => state.id)
  const activeUserId = userId || 'user'

  const isZakovat = mode === 'zakovat'
  


  useEffect(() => {
    // Focus input on mount, after a slight delay to let Framer Motion animations play out
    // and to ensure mobile WebView has time to paint before focusing
    const focusTimer = setTimeout(() => {
      inputRef.current?.focus()
    }, 150)
    
    return () => clearTimeout(focusTimer)
  }, [])

  useEffect(() => {
    if (disabled) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          onTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [disabled, onTimeUp])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!answer.trim() || disabled) return
    
    triggerHaptic('medium')
    onSubmit(answer.trim())
  }

  if (!isZakovat && (currentPhase !== 'input' || buzzerLockedBy !== activeUserId)) {
     return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-background/95 backdrop-blur-md',
        'border-t border-border/50',
        'px-4 pb-safe pt-4',
        className
      )}
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)' }}
    >
      {/* Timer */}
      <div className="flex justify-center mb-4">
        <ProgressTimer
          timeRemaining={timeRemaining}
          totalTime={timeLimit}
          variant="circle"
        />
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          ref={inputRef}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Javobingizni yozing..."
          disabled={disabled}
          className="flex-1 h-12 text-lg bg-card/50 border-border/50"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
        />
        <Button
          type="submit"
          disabled={!answer.trim() || disabled}
          size="icon"
          className="h-12 w-12 rounded-xl"
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </motion.div>
  )
}
