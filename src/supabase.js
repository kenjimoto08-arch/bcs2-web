import { createClient } from '@supabase/supabase-js'

// ✅ 여기에 본인 Supabase 프로젝트 URL과 anon key를 넣으세요
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
