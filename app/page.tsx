'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { useTelegram } from '@/hooks/use-telegram'
import { SPLASH_DURATION } from '@/lib/constants'

export default function SplashPage() {
  const router = useRouter()
  const { isReady } = useTelegram()
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    if (!isReady) return

    const timer = setTimeout(() => {
      setShowSplash(false)
      setTimeout(() => {
        router.push('/lobby')
      }, 500)
    }, SPLASH_DURATION)

    return () => clearTimeout(timer)
  }, [isReady, router])

  return (
    <AppShell className="items-center justify-center">
      <AnimatePresence mode="wait">
        {showSplash && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col items-center gap-6"
          >
            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
              className="relative"
            >
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10">
                <Brain className="h-12 w-12 text-primary" />
              </div>
              <div className="absolute inset-0 -z-10 h-24 w-24 rounded-3xl bg-primary/20 blur-xl" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-center"
            >
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Aqliy O&apos;yinlar
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Test your knowledge
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.3 }}
              className="flex items-center gap-1"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-2 w-2 rounded-full bg-primary/50"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  )
}
