import { createClient, type User } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://dwiectwmmngdmxxeoglb.supabase.co'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aWVjdHdtbW5nZG14eGVvZ2xiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MDE1NDksImV4cCI6MjA2ODA3NzU0OX0.62Fn8T8e9W_pcmhbo0dxZtDp-7MlMm-o2Y-D5V0RhKU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export type { User }

export async function signInWithGithub() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: 'electron-app://auth/callback'
    }
  })
  
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}