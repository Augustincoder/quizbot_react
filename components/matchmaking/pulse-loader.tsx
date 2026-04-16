'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PulseLoaderProps {
  className?: string
}

export function PulseLoader({ className }: PulseLoaderProps) {
  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {/* Concentric pulse circles */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-primary/30"
          initial={{ width: 80, height: 80, opacity: 0.5 }}
          animate={{
            width: [80, 160, 200],
            height: [80, 160, 200],
            opacity: [0.5, 0.2, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.6,
            ease: 'easeOut',
          }}
        />
      ))}
      
      {/* Center circle */}
      <motion.div
        className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <motion.div
          className="h-12 w-12 rounded-full bg-primary/20"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>
    </div>
  )
}
