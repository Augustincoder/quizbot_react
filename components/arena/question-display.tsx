'use client'

import { motion } from 'framer-motion'
import { memo } from 'react'
import { cn } from '@/lib/utils'
import type { Question } from '@/types/game'

interface QuestionDisplayProps {
  question: Question
  questionNumber: number
  totalQuestions: number
  className?: string
  compact?: boolean
}

function QuestionDisplayComponent({
  question,
  questionNumber,
  totalQuestions,
  className,
  compact,
}: QuestionDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={cn('flex flex-col items-center gap-4 px-6', className)}
    >
      {/* Question counter */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          Savol {questionNumber}/{totalQuestions}
        </span>
        <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-medium">
          {question.category}
        </span>
      </div>

      {/* Question text */}
      <motion.h2
        key={question.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="text-lg md:text-xl leading-relaxed text-gray-800 font-medium text-left md:text-center break-words whitespace-pre-wrap text-balance max-w-2xl max-h-[45vh] overflow-y-auto custom-scrollbar"
      >
        {question.text}
      </motion.h2>

      {/* Difficulty badge */}
      <div
        className={cn(
          'px-3 py-1 rounded-full text-xs font-medium',
          question.difficulty === 'easy' && 'bg-emerald-500/10 text-emerald-600',
          question.difficulty === 'medium' && 'bg-amber-500/10 text-amber-600',
          question.difficulty === 'hard' && 'bg-rose-500/10 text-rose-600',
        )}
      >
        {question.difficulty === 'easy' && 'Oson'}
        {question.difficulty === 'medium' && "O'rta"}
        {question.difficulty === 'hard' && 'Qiyin'}
        {' - '}
        {question.points} ball
      </div>
    </motion.div>
  )
}

export const QuestionDisplay = memo(QuestionDisplayComponent, (prev, next) => {
  return (
    prev.question.id === next.question.id && prev.questionNumber === next.questionNumber
  )
})
