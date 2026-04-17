'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AppShell } from '@/components/layout/app-shell'
import { TgSafeArea } from '@/components/layout/tg-safe-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Trophy, Brain, Target, ShieldQuestion, Medal } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function ProfilePage() {
  const router = useRouter()
  
  // Telegram InitData integration
  const [user, setUser] = useState<{ id: string, firstName: string, lastName?: string, username?: string, photoUrl?: string } | null>(null)
  
  const [stats, setStats] = useState({
    brain_ring_score: 0,
    erudit_score: 0,
    zakovat_score: 0,
    kahoot_score: 0,
    mmr: 0
  })

  useEffect(() => {
    // 1. Extract Telegram Data
    let tgUser = null;
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user) {
      tgUser = window.Telegram.WebApp.initDataUnsafe.user;
      setUser({
        id: String(tgUser.id),
        firstName: tgUser.first_name,
        lastName: tgUser.last_name,
        username: tgUser.username,
        photoUrl: tgUser.photo_url
      });
    } else {
      // Fallback for local testing if not in Telegram (Uses store logic equivalent or mocks)
      const mockId = '1234567';
      setUser({
        id: mockId,
        firstName: 'Test',
        lastName: 'User',
      })
      tgUser = { id: mockId };
    }

    // 2. Fetch from Supabase user_profiles
    if (tgUser && tgUser.id) {
       const fetchStats = async () => {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('brain_ring_score, erudit_score, zakovat_score, kahoot_score, mmr')
            .eq('user_id', String(tgUser.id))
            .single()
            
          if (data && !error) {
             setStats({
                brain_ring_score: data.brain_ring_score || 0,
                erudit_score: data.erudit_score || 0,
                zakovat_score: data.zakovat_score || 0,
                kahoot_score: data.kahoot_score || 0,
                mmr: data.mmr || 0
             })
          }
       }
       fetchStats()
    }
  }, [])

  if (!user) return <AppShell><div className="flex-1" /></AppShell>

  const initials = (user.firstName || 'U')[0].toUpperCase();

  const statCards = [
    { name: 'Brain Ring', score: stats.brain_ring_score, icon: Brain, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    { name: 'Erudit Kvarteti', score: stats.erudit_score, icon: ShieldQuestion, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { name: 'Zakovat', score: stats.zakovat_score, icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { name: 'Kahoot', score: stats.kahoot_score, icon: Medal, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  ]

  return (
    <AppShell>
      <TgSafeArea>
        <div className="flex flex-col h-full bg-background relative overflow-hidden">
          {/* Header area */}
          <div className="flex items-center gap-3 p-4 z-10 border-b border-border/30">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl shrink-0" onClick={() => router.push('/lobby')}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold flex-1">Profil</h1>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-6 z-10 pb-12">
            
            {/* User Identity Card */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-5 p-5 bg-card/60 backdrop-blur rounded-2xl border border-border/50"
            >
              <Avatar className="h-20 w-20 border-[3px] border-primary/20 shadow-lg">
                <AvatarImage src={user.photoUrl} alt={user.firstName} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <h2 className="text-xl font-bold text-foreground">
                  {user.firstName} {user.lastName || ''}
                </h2>
                <div className="text-sm text-muted-foreground mb-2">
                  {user.username ? `@${user.username}` : `ID: ${user.id}`}
                </div>
                <div className="inline-flex items-center w-fit gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-bold text-amber-600">{stats.mmr} MMR</span>
                </div>
              </div>
            </motion.div>

            {/* Score Grid */}
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground pl-1">
              O&apos;yinlar Statistikasi
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {statCards.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + idx * 0.05 }}
                    className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border ${stat.bg} ${stat.border}`}
                  >
                    <div className={`p-2 rounded-xl bg-background/50 ${stat.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="text-xs font-semibold text-muted-foreground text-center line-clamp-1">{stat.name}</div>
                    <div className="text-2xl font-black text-foreground tabular-nums">
                      {stat.score}
                    </div>
                  </motion.div>
                )
              })}
            </div>
            
            {/* Back Button */}
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: 0.4 }}>
              <Button 
                onClick={() => router.push('/lobby')}
                className="w-full h-12 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 border-none font-semibold mt-4"
                variant="outline"
              >
                Orqaga (Lobby)
              </Button>
            </motion.div>

          </div>
        </div>
      </TgSafeArea>
    </AppShell>
  )
}
