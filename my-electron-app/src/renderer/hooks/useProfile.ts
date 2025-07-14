import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from './useAuth'

interface UserProfile {
  id: string
  user_id: string
  full_name?: string
  preferences?: {
    work_duration?: number
    break_duration?: number
    notifications_enabled?: boolean
    auto_start_monitoring?: boolean
  }
  created_at: string
  updated_at: string
}

export const useProfile = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 프로필 불러오기
  const fetchProfile = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116: 결과 없음
        throw error
      }

      setProfile(data || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '프로필을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 프로필 생성/업데이트
  const updateProfile = async (updates: Partial<Omit<UserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user) return { error: '로그인이 필요합니다.' }

    try {
      setLoading(true)
      setError(null)

      const profileData = {
        user_id: user.id,
        ...updates,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'user_id' })
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '프로필 업데이트 중 오류가 발생했습니다.'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  // 설정 업데이트
  const updatePreferences = async (preferences: UserProfile['preferences']) => {
    return updateProfile({ preferences })
  }

  useEffect(() => {
    if (user) {
      fetchProfile()
    } else {
      setProfile(null)
    }
  }, [user])

  return {
    profile,
    loading,
    error,
    updateProfile,
    updatePreferences,
    refetch: fetchProfile
  }
}