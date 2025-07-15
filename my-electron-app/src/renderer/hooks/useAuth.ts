import { useState, useEffect, useRef } from 'react'
import { 
  supabase, 
  AuthState, 
  User, 
  getSupabaseTokens,
  authenticateWithBackend,
  BackendAuthResponse
} from '../../lib/supabase'

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
    backendTokens: null
  })
  
  const authInProgressRef = useRef(false)

  useEffect(() => {
    let mounted = true

    // Supabase 세션만 확인하는 초기화
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('세션 확인 에러:', error);
          if (mounted) {
            setAuthState({
              user: null,
              loading: false,
              error: '세션 확인 중 오류가 발생했습니다.',
              isAuthenticated: false,
              backendTokens: null
            });
          }
          return;
        }
        
        if (session) {
          // 세션이 있으면 onAuthStateChange에서 처리하도록 위임
          console.log('기존 세션 발견, onAuthStateChange에서 처리됩니다...');
          // 초기 로딩 상태는 onAuthStateChange가 해결할 때까지 유지
        } else {
          // 세션이 없으면 로그인 필요
          if (mounted) {
            setAuthState({
              user: null,
              loading: false,
              error: null,
              isAuthenticated: false,
              backendTokens: null
            });
          }
        }
      } catch (error) {
        console.error('초기화 에러:', error);
        if (mounted) {
          setAuthState({
            user: null,
            loading: false,
            error: '초기화 중 오류가 발생했습니다.',
            isAuthenticated: false,
            backendTokens: null
          });
        }
      }
    }

    initializeAuth();

    // 간단한 onAuthStateChange 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth 상태 변경:', event);
        
        if (event === 'SIGNED_IN' && session) {
          // 중복 호출 방지
          if (authInProgressRef.current) {
            console.log('이미 인증 진행 중, 요청 무시');
            return;
          }
          
          authInProgressRef.current = true;
          
          try {
            console.log('Auth 상태 변경: SIGNED_IN, 백엔드 인증 시작...');
            
            // Supabase 세션에서 토큰 추출
            const supabaseAccessToken = session.access_token;
            
            if (!supabaseAccessToken) {
              throw new Error('Supabase 토큰을 찾을 수 없습니다.');
            }
            
            console.log('백엔드 API 호출 중...');
            
            // 백엔드 API에 토큰 전송
            const backendResponse = await authenticateWithBackend(supabaseAccessToken);
            
            if (backendResponse.isSuccess && backendResponse.data) {
              console.log('백엔드 인증 성공!');
              
              if (mounted) {
                setAuthState({
                  user: session.user as User,
                  loading: false,
                  error: null,
                  isAuthenticated: true,
                  backendTokens: {
                    accessToken: backendResponse.data.accessToken,
                    refreshToken: backendResponse.data.refreshToken
                  }
                });
              }
            } else {
              throw new Error(backendResponse.message || '백엔드 인증 실패');
            }
            
          } catch (error) {
            console.error('백엔드 인증 실패:', error);
            
            // 백엔드 인증 실패 시 Supabase 세션도 정리
            await supabase.auth.signOut();
            
            if (mounted) {
              setAuthState({
                user: null,
                loading: false,
                error: error instanceof Error ? error.message : '인증 처리 중 오류가 발생했습니다.',
                isAuthenticated: false,
                backendTokens: null
              });
            }
          } finally {
            authInProgressRef.current = false;
          }
        } else if (event === 'SIGNED_OUT') {
          authInProgressRef.current = false;
          setAuthState({
            user: null,
            loading: false,
            error: null,
            isAuthenticated: false,
            backendTokens: null
          });
        }
      }
    )

    // GitHub OAuth 콜백 처리 (Electron 전용)
    const handleAuthCallback = async (event: any, fragment: string) => {
      const params = new URLSearchParams(fragment.substring(1));
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      
      if (access_token) {
        // Supabase 세션 설정하면 onAuthStateChange가 자동 실행
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token: refresh_token || ''
        });
        
        if (error) {
          console.error('세션 설정 실패:', error);
          setAuthState(prev => ({
            ...prev,
            loading: false,
            error: '로그인 처리 중 오류가 발생했습니다.',
            backendTokens: null
          }));
        }
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

  // 회원가입 - 간단한 버전
  const signUp = async (email: string, password: string, fullName?: string) => {
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

    // onAuthStateChange가 자동으로 처리
    return { data, error }
  }

  // 로그인 - 간단한 버전
  const signIn = async (email: string, password: string) => {
    setAuthState((prev: AuthState) => ({ ...prev, loading: true, error: null }))
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    // onAuthStateChange가 자동으로 처리
    return { data, error }
  }

  // Google OAuth 로그인 (보편적인 방식)
  const signInWithGoogle = async () => {
    setAuthState((prev: AuthState) => ({ ...prev, loading: true, error: null }))
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    })

    if (error) {
      setAuthState((prev: AuthState) => ({ 
        ...prev, 
        loading: false, 
        error: error.message 
      }))
    }
    
    return { data, error }
  }

  // GitHub OAuth 로그인 (Electron 커스텀 프로토콜)
  const signInWithGithub = async () => {
    setAuthState((prev: AuthState) => ({ ...prev, loading: true, error: null }))
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: 'electron-app://auth/callback'
      }
    })

    if (error) {
      setAuthState((prev: AuthState) => ({ 
        ...prev, 
        loading: false, 
        error: error.message 
      }))
    }
    
    return { data, error }
  }

  // 로그아웃 - 세션만 정리
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    
    // onAuthStateChange가 자동으로 상태 초기화
    return { error };
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

  // 현재 세션에서 Supabase 토큰 가져오기
  const getCurrentSupabaseTokens = async () => {
    return await getSupabaseTokens();
  }

  // 백엔드 토큰 가져오기
  const getBackendTokens = () => {
    return authState.backendTokens;
  }

  return {
    ...authState,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithGithub,
    signOut,
    resetPassword,
    getCurrentSupabaseTokens,
    getBackendTokens
  }
}