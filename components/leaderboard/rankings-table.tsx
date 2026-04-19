'use client'

import { memo, useMemo } from 'react'
import { FixedSizeList as List, ListChildComponentProps } from 'react-window'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { Crown, Medal } from 'lucide-react'
import type { Player } from '@/types/user'

const ROW_HEIGHT = 52

interface RankingsTableProps {
  players: Array<Player & { rank: number; mmrChange: number }>
  currentUserId: string | null
  className?: string
}

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="h-5 w-5 text-amber-500" />
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />
  return <span className="text-sm font-medium text-muted-foreground">{rank}</span>
}

type RowData = {
  players: Array<Player & { rank: number; mmrChange: number }>
  currentUserId: string | null
}

const PlayerRow = memo(function PlayerRow({
  player,
  index,
  isCurrentUser,
  style,
}: {
  player: Player & { rank: number; mmrChange: number }
  index: number
  isCurrentUser: boolean
  style: React.CSSProperties
}) {
  return (
    <div
      style={style}
      className={cn(
        'grid grid-cols-[40px_1fr_80px_80px] gap-2 px-4 items-center border-b border-border/30',
        isCurrentUser && 'bg-primary/5 border-l-2 border-primary',
        index % 2 === 1 && !isCurrentUser && 'bg-muted/20',
      )}
    >
      <div className="flex items-center justify-center">{getRankIcon(player.rank)}</div>

      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="h-8 w-8">
          <AvatarImage src={player.avatar} alt={player.username} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
            {player.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span
          className={cn(
            'text-sm font-medium truncate',
            isCurrentUser ? 'text-primary' : 'text-foreground',
          )}
        >
          {player.username}
          {isCurrentUser && ' (Siz)'}
        </span>
      </div>

      <div className="text-right">
        <span className="text-sm font-semibold text-foreground">{player.score}</span>
      </div>

      <div className="text-right">
        <span
          className={cn(
            'text-sm font-medium',
            player.mmrChange > 0
              ? 'text-emerald-500'
              : player.mmrChange < 0
                ? 'text-rose-500'
                : 'text-muted-foreground',
          )}
        >
          {player.mmrChange > 0 && '+'}
          {player.mmrChange}
        </span>
      </div>
    </div>
  )
})

PlayerRow.displayName = 'PlayerRow'

function VirtualRow({ index, style, data }: ListChildComponentProps<RowData>) {
  const { players, currentUserId } = data
  const player = players[index]
  if (!player) return null
  const isCurrentUser = player.id === currentUserId
  return <PlayerRow player={player} index={index} isCurrentUser={isCurrentUser} style={style} />
}

export function RankingsTable({ players, currentUserId, className }: RankingsTableProps) {
  const itemData = useMemo<RowData>(
    () => ({ players, currentUserId }),
    [players, currentUserId],
  )

  const listHeight = Math.min(500, Math.max(players.length, 1) * ROW_HEIGHT)

  return (
    <div className={cn('rounded-xl overflow-hidden border border-border/30', className)}>
      <div className="grid grid-cols-[40px_1fr_80px_80px] gap-2 px-4 py-2 bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground font-medium">
        <span>#</span>
        <span>O&apos;yinchi</span>
        <span className="text-right">Ball</span>
        <span className="text-right">MMR</span>
      </div>

      {players.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">Hozircha ma&apos;lumot yo&apos;q</div>
      ) : (
        <List
          height={listHeight}
          itemCount={players.length}
          itemSize={ROW_HEIGHT}
          width="100%"
          itemData={itemData}
        >
          {VirtualRow}
        </List>
      )}
    </div>
  )
}
