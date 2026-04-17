import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wsvzggnhotzhmvugeyil.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_secret_nZQcnSza0XFCGy_4k1o8rw_zmJ_ISgM'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
