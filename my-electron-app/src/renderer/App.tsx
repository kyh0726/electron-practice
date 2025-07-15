import React, { useState } from 'react';
import { useUsageMonitoring } from './hooks/useUsageMonitoring';
import { useAutoUpdater } from './hooks/useAutoUpdater';
import { useAuth } from './hooks/useAuth';
import UpdateNotification from './components/UpdateNotification';
import AuthForm from './components/AuthForm';
import UserSettings from './components/UserSettings';

declare global {
  interface Window {
    electronAPI: {
      platform: string;
      versions: {
        node: string;
        chrome: string;
        electron: string;
      };
      saveLog: (logData: { action: string; details: any }) => Promise<{ success: boolean; path?: string; error?: string }>;
      startMonitoring: () => Promise<{ success: boolean; message: string }>;
      stopMonitoring: () => Promise<{ success: boolean; message: string }>;
      getCurrentActivity: () => Promise<any>;
      checkForUpdates: () => Promise<{ success: boolean; data?: any; error?: string }>;
      downloadUpdate: () => Promise<{ success: boolean; error?: string }>;
      installUpdate: () => Promise<{ success: boolean; error?: string }>;
      onUpdateStatus: (callback: (event: any, data: any) => void) => void;
      removeUpdateStatusListener: (callback: (event: any, data: any) => void) => void;
      startTimer: () => Promise<{ success: boolean; message: string }>;
      stopTimer: () => Promise<{ success: boolean; message: string }>;
      resetTimer: () => Promise<{ success: boolean; message: string }>;
      getTimerStatus: () => Promise<{ isRunning: boolean; elapsedTime: number; formattedTime: string }>;
      onTimerUpdate: (callback: (event: any, data: any) => void) => void;
      moveTimerWindow: (x: number, y: number) => void;
      setWorkDuration: (minutes: number) => Promise<{ success: boolean }>;
      setBreakDuration: (minutes: number) => Promise<{ success: boolean }>;
      switchMode: (mode: 'work' | 'break') => Promise<{ success: boolean; error?: string }>;
      onAuthCallback?: (callback: (event: any, fragment: string) => void) => void;
    };
  }
}

const App: React.FC = () => {
  const { versions } = window.electronAPI;
  const {
    isMonitoring,
    monitoringStatus,
    currentActivity,
    startMonitoring,
    stopMonitoring
  } = useUsageMonitoring();
  
  const { checkForUpdates } = useAutoUpdater();
  const { user, loading: authLoading, signOut, isAuthenticated, getCurrentSupabaseTokens, getBackendTokens, backendTokens } = useAuth();
  const [showSettings, setShowSettings] = useState(false);

  // 인증 상태 로딩 중
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
          <p className="mt-2 text-sm text-gray-500">10초 이상 지속되면 새로고침해주세요</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            새로고침
          </button>
          <button 
            onClick={() => {
              window.location.reload();
            }}
            className="mt-2 ml-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            강제 새로고침
          </button>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 경우 인증 폼 표시
  if (!isAuthenticated) {
    return <AuthForm />;
  }

  // 로그인한 사용자에게 메인 앱 표시
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <UpdateNotification />
      
      {/* 사용자 헤더 */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="bg-white rounded-lg shadow-lg p-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
              {user?.user_metadata?.full_name ? user.user_metadata.full_name[0].toUpperCase() : (user?.email?.[0] || 'U').toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {user?.user_metadata?.full_name || '사용자'}
              </h2>
              <p className="text-sm text-gray-600">{user?.email || '이메일 없음'}</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              깃허브, 구글 로그인
            </span>
            <button
              onClick={() => setShowSettings(true)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              설정
            </button>
            <button
              onClick={signOut}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">시스템 활동 모니터링</h1>
          
          {/* 디버깅 정보 */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">디버깅 정보:</h3>
            <div className="text-xs text-blue-700 space-y-1">
              <p>인증 상태: {isAuthenticated ? '✅ 인증됨' : '❌ 미인증'}</p>
              <p>사용자: {user ? '✅ 있음' : '❌ 없음'}</p>
              <p>백엔드 토큰: {backendTokens ? `✅ ${backendTokens.accessToken.substring(0, 10)}...` : '❌ 없음'}</p>
              <button 
                onClick={async () => {
                  console.log('=== 현재 상태 ===');
                  console.log('authState:', { isAuthenticated, user: !!user });
                  const supabaseTokens = await getCurrentSupabaseTokens();
                  console.log('Supabase 토큰:', supabaseTokens ? `✅ ${supabaseTokens.accessToken.substring(0, 10)}...` : '❌ 없음');
                  const backendTokens = getBackendTokens();
                  console.log('백엔드 토큰:', backendTokens ? `✅ ${backendTokens.accessToken.substring(0, 10)}...` : '❌ 없음');
                }}
                className="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded"
              >
                상태 로그 출력
              </button>
            </div>
          </div>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="text-sm text-yellow-800">
              ⚠️ 이 앱은 사용자의 시스템 활동을 모니터링합니다. 
              개인정보 보호를 위해 필요한 경우에만 사용하세요.
            </p>
          </div>

          <div className="flex gap-4 mb-6">
            <button 
              onClick={startMonitoring}
              disabled={isMonitoring}
              className={`${
                isMonitoring 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-500 hover:bg-green-600'
              } text-white font-bold py-2 px-4 rounded transition-colors`}
            >
              모니터링 시작
            </button>
            
            <button 
              onClick={stopMonitoring}
              disabled={!isMonitoring}
              className={`${
                !isMonitoring 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-red-500 hover:bg-red-600'
              } text-white font-bold py-2 px-4 rounded transition-colors`}
            >
              모니터링 중지
            </button>
            
            <button 
              onClick={checkForUpdates}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              업데이트 확인
            </button>
          </div>

          {monitoringStatus && (
            <div className={`p-4 rounded mb-6 ${
              isMonitoring ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {monitoringStatus}
            </div>
          )}

          {currentActivity && (
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-bold mb-2">현재 활동:</h3>
              {currentActivity.activeWindow && (
                <div className="space-y-1 text-sm">
                  <p><span className="font-semibold">앱:</span> {currentActivity.activeWindow.app}</p>
                  <p><span className="font-semibold">제목:</span> {currentActivity.activeWindow.title}</p>
                  {currentActivity.activeWindow.url && (
                    <p><span className="font-semibold">URL:</span> {currentActivity.activeWindow.url}</p>
                  )}
                </div>
              )}
              <div className="mt-2 text-sm">
                <p><span className="font-semibold">CPU 사용률:</span> {currentActivity.system?.cpuUsage?.toFixed(1)}%</p>
                <p><span className="font-semibold">메모리 사용:</span> {currentActivity.system?.memoryUsage?.freeMemPercentage?.toFixed(1)}% 여유</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">시스템 정보</h2>
          <div className="space-y-2 text-sm">
            <p className="text-gray-600">
              Node.js <span className="font-mono text-blue-600">{versions.node}</span>
            </p>
            <p className="text-gray-600">
              Chromium <span className="font-mono text-blue-600">{versions.chrome}</span>
            </p>
            <p className="text-gray-600">
              Electron <span className="font-mono text-blue-600">{versions.electron}</span>
            </p>
          </div>
        </div>
      </div>
      
      {/* 설정 모달 */}
      <UserSettings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </div>
  );
};

export default App;