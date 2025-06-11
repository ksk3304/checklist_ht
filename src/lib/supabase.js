import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// progressスキーマをデフォルトに設定
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'progress' },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// 認証状態の変更を監視するヘルパー
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback)
}