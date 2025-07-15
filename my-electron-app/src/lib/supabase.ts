import { createClient, type User } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://dwiectwmmngdmxxeoglb.supabase.co'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aWVjdHdtbW5nZG14eGVvZ2xiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NDI2NTMsImV4cCI6MjA2ODExODY1M30.T12x9LtxYhrT5CF6mImyMoRyGRStsX2ozMpsaiYgHfo'

console.log('Supabase config:', { 
  supabaseUrl, 
  supabaseAnonKey: supabaseAnonKey.substring(0, 20) + '...',
  envUrl: process.env.SUPABASE_URL,
  envKey: process.env.SUPABASE_ANON_KEY?.substring(0, 20) + '...'
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  backendTokens?: {
    accessToken: string
    refreshToken: string
  } | null
}

export type { User }

// 백엔드 API 응답 타입
export interface BackendAuthResponse {
  isSuccess: boolean
  code: string
  message: string
  data?: {
    accessToken: string
    refreshToken: string
    user?: any
  }
}

// Supabase 토큰을 우리 백엔드로 전송하는 함수 (타임아웃 포함)
export async function authenticateWithBackend(supabaseAccessToken: string): Promise<BackendAuthResponse> {
  try {
    console.log('백엔드 인증 API 호출 중...', { 
      token: supabaseAccessToken.substring(0, 20) + '...' 
    });
    
    // 10초 타임아웃 설정
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch('https://api-develop.pawcus.dev/auth/social-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken: supabaseAccessToken
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: BackendAuthResponse = await response.json();
    console.log('백엔드 인증 응답:', result);
    
    return result;
  } catch (error) {
    console.error('백엔드 인증 에러:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('백엔드 API 요청 타임아웃 (10초)');
    }
    throw error;
  }
}

// Supabase OAuth 로그인 함수들
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

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google'
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

// Supabase 세션에서 토큰 가져오기 (세션 전용)
export const getSupabaseTokens = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session) {
    return null;
  }
  
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token
  }
}