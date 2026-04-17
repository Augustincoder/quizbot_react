'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUserStore } from '@/store/user-store'
import { Trophy } from 'lucide-react'

import Link from 'next/link'

export function UserProfileCard() {
  const username = useUserStore((state) => state.username)
  const avatar = useUserStore((state) => state.avatar)
  const mmr = useUserStore((state) => state.mmr)

  const initials = username
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Link href="/profile" className="flex items-center gap-4 p-4 hover:bg-card/40 transition-colors cursor-pointer">
      <Avatar className="h-12 w-12 border-2 border-border/50">
        <AvatarImage src={avatar} alt={username} />
        <AvatarFallback className="bg-primary/10 text-primary font-medium">
          {initials || 'U'}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex flex-col">
        <span className="font-medium text-foreground">{username}</span>
        <div className="flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-sm text-muted-foreground">{mmr} MMR</span>
        </div>
      </div>
    </Link>
  )
}
