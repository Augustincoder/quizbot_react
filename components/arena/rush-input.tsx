'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Check, X, Zap } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { triggerHaptic } from '@/lib/telegram'

interface RushSubmission {
  answer: string
  isCorrect: boolean
  timestamp: number
  position?: number // 1st, 2nd, 3rd if correct
}

interface RushInputProps {
  onSubmit: (answer: string, timestamp: number) => void
  disabled?: boolean
  lastResult?: RushSubmission | null
  className?: string
}

export function RushInput({
  onSubmit,
  disabled,
  lastResult,
  className,
}: RushInputProps) {
  const [answer, setAnswer] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const questionStartRef = useRef<number>(performance.now())

  // Reset start time when the component mounts (new question)
  useEffect(() => {
    questionStartRef.current = performance.now()
    inputRef.current?.focus()
  }, [])

  // Show feedback briefly when result changes
  useEffect(() => {
    if (lastResult) {
      setShowFeedback(true)
      const timer = setTimeout(() => {
        setShowFeedback(false)
      }, 1800)
      return () => clearTimeout(timer)
    }
  }, [lastResult])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!answer.trim() || disabled) return

    const timestamp = performance.now() - questionStartRef.current
    triggerHaptic('medium')
    onSubmit(answer.trim(), timestamp)
    setAnswer('')
    inputRef.current?.focus()
  }

  const positionLabels = ['1-chi!', '2-chi!', '3-chi!']

  return (
    <div
      className={cn(
        'border-t border-border/30',
        'bg-background/95 backdrop-blur-md',
        'px-4 py-3',
        className
      )}
    >
      {/* Inline feedback */}
      <AnimatePresence>
        {showFeedback && lastResult && (
          <motion.div
            initial={{ opacity: 0, y: 8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.25 }}
            className="mb-2 overflow-hidden"
          >
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium',
                lastResult.isCorrect
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
              )}
            >
              {lastResult.isCorrect ? (
                <>
                  <Check className="h-4 w-4 shrink-0" />
                  <span>To&apos;g&apos;ri!</span>
                  {lastResult.position && lastResult.position <= 3 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.15 }}
                      className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-xs font-bold"
                    >
                      <Zap className="h-3 w-3" />
                      {positionLabels[lastResult.position - 1]}
                    </motion.span>
                  )}
                </>
              ) : (
                <>
                  <X className="h-4 w-4 shrink-0" />
                  <span>Noto&apos;g&apos;ri — qayta urinib ko&apos;ring</span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          ref={inputRef}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Javobingizni yozing..."
          disabled={disabled}
          className="flex-1 h-11 text-base bg-card/50 border-border/50 rounded-xl"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
        />
        <Button
          type="submit"
          disabled={!answer.trim() || disabled}
          size="icon"
          className="h-11 w-11 rounded-xl shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
