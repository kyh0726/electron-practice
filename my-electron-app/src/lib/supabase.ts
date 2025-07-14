import { createClient } from '@supabase/supabase-js'

// Supabase 설정
const supabaseUrl = 'https://dwiectwmmngdmxxeoglb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aWVjdHdtbW5nZG14eGVvZ2xiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MDE1NDksImV4cCI6MjA2ODA3NzU0OX0.62Fn8T8e9W_pcmhbo0dxZtDp-7MlMm-o2Y-D5V0RhKU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})

// 사용자 타입 정의
export interface User {
  id: string
  email: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

// 인증 관련 타입
export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}