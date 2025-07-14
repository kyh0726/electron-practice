import React, { useState, useEffect } from 'react'
import { useProfile } from '../hooks/useProfile'

interface UserSettingsProps {
  isOpen: boolean
  onClose: () => void
}

const UserSettings: React.FC<UserSettingsProps> = ({ isOpen, onClose }) => {
  const { profile, updatePreferences, loading } = useProfile()
  const [formData, setFormData] = useState({
    work_duration: 25,
    break_duration: 5,
    notifications_enabled: true,
    auto_start_monitoring: false
  })
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (profile?.preferences) {
      setFormData({
        work_duration: profile.preferences.work_duration || 25,
        break_duration: profile.preferences.break_duration || 5,
        notifications_enabled: profile.preferences.notifications_enabled ?? true,
        auto_start_monitoring: profile.preferences.auto_start_monitoring ?? false
      })
    }
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    const { error } = await updatePreferences(formData)
    
    if (!error) {
      setMessage('설정이 저장되었습니다.')
      // Electron 앱에 설정 적용
      if (window.electronAPI) {
        await window.electronAPI.setWorkDuration(formData.work_duration)
        await window.electronAPI.setBreakDuration(formData.break_duration)
      }
    } else {
      setMessage(`오류: ${error}`)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">사용자 설정</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 포모도로 타이머 설정 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">포모도로 타이머</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="work_duration" className="block text-sm font-medium text-gray-700 mb-1">
                  작업 시간 (분)
                </label>
                <input
                  type="number"
                  id="work_duration"
                  min="5"
                  max="60"
                  step="5"
                  value={formData.work_duration}
                  onChange={(e) => setFormData({ ...formData, work_duration: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="break_duration" className="block text-sm font-medium text-gray-700 mb-1">
                  휴식 시간 (분)
                </label>
                <input
                  type="number"
                  id="break_duration"
                  min="5"
                  max="30"
                  step="5"
                  value={formData.break_duration}
                  onChange={(e) => setFormData({ ...formData, break_duration: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* 일반 설정 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">일반 설정</h3>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notifications_enabled"
                  checked={formData.notifications_enabled}
                  onChange={(e) => setFormData({ ...formData, notifications_enabled: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="notifications_enabled" className="ml-2 block text-sm text-gray-900">
                  알림 활성화
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="auto_start_monitoring"
                  checked={formData.auto_start_monitoring}
                  onChange={(e) => setFormData({ ...formData, auto_start_monitoring: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="auto_start_monitoring" className="ml-2 block text-sm text-gray-900">
                  앱 시작 시 자동으로 모니터링 시작
                </label>
              </div>
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? '저장 중...' : '저장'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              취소
            </button>
          </div>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded-md ${
            message.startsWith('오류') 
              ? 'bg-red-50 text-red-800 border border-red-200' 
              : 'bg-green-50 text-green-800 border border-green-200'
          }`}>
            <p className="text-sm">{message}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserSettings