'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, Link2, UserPlus, Hash } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { triggerHaptic } from '@/lib/telegram'

interface RoomInviteProps {
  roomCode: string
  deepLink: string
  players: Array<{ id: string; name: string; isReady: boolean }>
  onJoinByCode?: (code: string) => void
  className?: string
}

export function RoomInvite({
  roomCode,
  deepLink,
  players,
  onJoinByCode,
  className,
}: RoomInviteProps) {
  const [copied, setCopied] = useState(false)
  const [manualCode, setManualCode] = useState('')

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(deepLink)
      setCopied(true)
      triggerHaptic('success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: copy room code
      try {
        await navigator.clipboard.writeText(roomCode)
        setCopied(true)
        triggerHaptic('success')
        setTimeout(() => setCopied(false), 2000)
      } catch {
        triggerHaptic('error')
      }
    }
  }

  const handleShareTelegram = () => {
    triggerHaptic('medium')
    const text = `🧠 Aqliy O'yinlar — Menga qo'shiling!\n\nXona kodi: ${roomCode}`
    const url = `https://t.me/share/url?url=${encodeURIComponent(deepLink)}&text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim() || manualCode.length < 6) return
    triggerHaptic('medium')
    onJoinByCode?.(manualCode.trim().toUpperCase())
    setManualCode('')
  }

  return (
    <div className={cn('flex flex-col gap-5', className)}>
      {/* Room code display */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Xona kodi
        </span>
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
          className="mt-2 flex items-center justify-center gap-1"
        >
          {roomCode.split('').map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              className="flex items-center justify-center w-10 h-12 rounded-xl bg-card border border-border/30 text-xl font-mono font-bold text-foreground"
            >
              {char}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>

      {/* Share buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleCopyLink}
          className="flex-1 h-11 rounded-xl gap-2"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald-500" />
              <span className="text-emerald-600">Nusxalandi!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Havolani nusxalash
            </>
          )}
        </Button>
        <Button
          onClick={handleShareTelegram}
          className="flex-1 h-11 rounded-xl gap-2"
        >
          <Link2 className="h-4 w-4" />
          Telegram orqali
        </Button>
      </div>

      {/* Connected players */}
      {players.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Xonada ({players.length})
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {players.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-card/50 border border-border/20"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-sm font-bold text-primary">
                    {player.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="flex-1 text-sm font-medium text-foreground truncate">
                  {player.name}
                </span>
                <span
                  className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    player.isReady
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : 'bg-amber-500/10 text-amber-600'
                  )}
                >
                  {player.isReady ? 'Tayyor' : 'Kutilmoqda'}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Manual code entry */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Kod bilan qo&apos;shilish
          </span>
        </div>
        <form onSubmit={handleJoinByCode} className="flex gap-2">
          <Input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            placeholder="ABCDEF"
            maxLength={6}
            className="flex-1 h-11 text-center font-mono text-lg tracking-[0.3em] bg-card/50 border-border/50 rounded-xl uppercase"
            autoComplete="off"
          />
          <Button
            type="submit"
            disabled={manualCode.length < 6}
            size="icon"
            className="h-11 w-11 rounded-xl shrink-0"
          >
            <UserPlus className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
