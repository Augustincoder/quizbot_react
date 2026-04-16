'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { triggerHaptic } from '@/lib/telegram'

interface AIRecheckButtonProps {
  questionText: string
  userAnswer: string
  onResult: (isValid: boolean, explanation: string) => void
  disabled?: boolean
  className?: string
}

export function AIRecheckButton({
  questionText,
  userAnswer,
  onResult,
  disabled,
  className,
}: AIRecheckButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)

  const handleRecheck = async () => {
    if (isLoading || hasChecked || disabled) return

    triggerHaptic('light')
    setIsLoading(true)

    // Simulate AI recheck (in production, this would call an API)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock response - randomly accept or reject
    const isValid = Math.random() > 0.5
    const explanation = isValid
      ? 'Javobingiz to\'g\'ri deb topildi. Sinonim yoki alternativ javob qabul qilindi.'
      : 'Javobingiz qabul qilinmadi. Aniq javob talab qilinadi.'

    setIsLoading(false)
    setHasChecked(true)
    onResult(isValid, explanation)
    triggerHaptic(isValid ? 'success' : 'error')
  }

  return (
    <Button
      onClick={handleRecheck}
      disabled={disabled || isLoading || hasChecked}
      variant="outline"
      className={cn(
        'group relative overflow-hidden',
        'bg-card border-border/50 hover:bg-card/80',
        'transition-all duration-200',
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <motion.div
          animate={!hasChecked && !disabled ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className={cn(
            'h-4 w-4 mr-2',
            hasChecked ? 'text-muted-foreground' : 'text-amber-500'
          )} />
        </motion.div>
      )}
      <span className="text-sm font-medium">
        {isLoading ? 'Tekshirilmoqda...' : hasChecked ? 'Tekshirildi' : 'AI bilan tekshirish'}
      </span>
    </Button>
  )
}
