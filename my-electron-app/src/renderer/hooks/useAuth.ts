import { useState, useEffect } from 'react'
import { supabase, AuthState, User } from '../../lib/supabase'

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    let mounted = true

    // 초기 세션 확인
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (error) {
          console.error('Session error:', error)
          setAuthState({
            user: null,
            loading: false,
            error: error.message
          })
        } else {
          setAuthState({
            user: session?.user as User || null,
            loading: false,
            error: null
          })
        }
      } catch (error) {
        if (!mounted) return
        
        console.error('Auth error:', error)
        setAuthState({
          user: null,
          loading: false,
          error: error instanceof Error ? error.message : '인증 확인 중 오류가 발생했습니다.'
        })
      }
    }

    getSession()

    // 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return
        
        console.log('Auth state changed:', event, !!session)
        setAuthState({
          user: session?.user as User || null,
          loading: false,
          error: null
        })
      }
    )

    // GitHub 인증 콜백 처리
    const handleAuthCallback = (event: any, fragment: string) => {
      const params = new URLSearchParams(fragment.substring(1))
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')
      
      if (access_token) {
        supabase.auth.setSession({
          access_token,
          refresh_token: refresh_token || ''
        })
      }
    }

    // Electron IPC 리스너 등록
    if (window.electronAPI) {
      window.electronAPI.onAuthCallback?.(handleAuthCallback)
    }

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // 회원가입
  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setAuthState((prev: AuthState) => ({ ...prev, loading: true, error: null }))
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '회원가입 중 오류가 발생했습니다.'
      setAuthState((prev: AuthState) => ({ ...prev, loading: false, error: errorMessage }))
      return { data: null, error: errorMessage }
    }
  }

  // 로그인
  const signIn = async (email: string, password: string) => {
    try {
      setAuthState((prev: AuthState) => ({ ...prev, loading: true, error: null }))
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다.'
      setAuthState((prev: AuthState) => ({ ...prev, loading: false, error: errorMessage }))
      return { data: null, error: errorMessage }
    }
  }

  // 구글 로그인
  const signInWithGoogle = async () => {
    try {
      setAuthState((prev: AuthState) => ({ ...prev, loading: true, error: null }))
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '구글 로그인 중 오류가 발생했습니다.'
      setAuthState((prev: AuthState) => ({ ...prev, loading: false, error: errorMessage }))
      return { data: null, error: errorMessage }
    }
  }

  // GitHub 로그인
  const signInWithGithub = async () => {
    try {
      setAuthState((prev: AuthState) => ({ ...prev, loading: true, error: null }))
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: 'electron-app://auth/callback'
        }
      })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'GitHub 로그인 중 오류가 발생했습니다.'
      setAuthState((prev: AuthState) => ({ ...prev, loading: false, error: errorMessage }))
      return { data: null, error: errorMessage }
    }
  }

  // 로그아웃
  const signOut = async () => {
    try {
      setAuthState((prev: AuthState) => ({ ...prev, loading: true, error: null }))
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      return { error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '로그아웃 중 오류가 발생했습니다.'
      setAuthState((prev: AuthState) => ({ ...prev, loading: false, error: errorMessage }))
      return { error: errorMessage }
    }
  }

  // 비밀번호 재설정
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error

      return { error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '비밀번호 재설정 중 오류가 발생했습니다.'
      return { error: errorMessage }
    }
  }

  return {
    ...authState,
    signInWithGoogle,
    signInWithGithub,
    signOut
  }
}