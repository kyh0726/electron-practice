import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import AuthForm from './components/AuthForm';
import UserSettings from './components/UserSettings';

declare global {
  interface Window {
    electronAPI: {
      onAuthCallback?: (callback: (event: any, fragment: string) => void) => void;
      createWebview: (url: string) => Promise<{ success: boolean; error?: string }>;
      hideWebview: () => Promise<{ success: boolean; error?: string }>;
      webviewNavigate: (url: string) => Promise<{ success: boolean; error?: string }>;
      // 타이머 관련 API
      startTimer: () => Promise<{ success: boolean; message: string }>;
      stopTimer: () => Promise<{ success: boolean; message: string }>;
      resetTimer: () => Promise<{ success: boolean; message: string }>;
      getTimerStatus: () => Promise<{ isRunning: boolean; elapsedTime: number; formattedTime: string }>;
      onTimerUpdate: (callback: (event: any, data: any) => void) => void;
      moveTimerWindow: (x: number, y: number) => void;
      setWorkDuration: (minutes: number) => Promise<{ success: boolean }>;
      setBreakDuration: (minutes: number) => Promise<{ success: boolean }>;
    };
  }
}

const App: React.FC = () => {
  const { user, loading: authLoading, signOut, isAuthenticated } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [webviewUrl, setWebviewUrl] = useState('https://web-develop.pawcus.dev');
  const [showWebview, setShowWebview] = useState(false);

  // 로그인 성공 후 자동으로 웹뷰 생성
  React.useEffect(() => {
    if (isAuthenticated) {
      handleCreateWebview();
    }
  }, [isAuthenticated]);

  // 웹뷰 관련 함수들
  const handleCreateWebview = async () => {
    try {
      const result = await window.electronAPI.createWebview(webviewUrl);
      if (result.success) {
        setShowWebview(true);
      } else {
        console.error(`웹뷰 생성 실패: ${result.error}`);
      }
    } catch (error) {
      console.error(`웹뷰 생성 중 오류 발생: ${error}`);
    }
  };

  const handleHideWebview = async () => {
    try {
      const result = await window.electronAPI.hideWebview();
      if (result.success) {
        setShowWebview(false);
      } else {
        console.error(`웹뷰 숨기기 실패: ${result.error}`);
      }
    } catch (error) {
      console.error(`웹뷰 숨기기 중 오류 발생: ${error}`);
    }
  };

  // 인증 상태 로딩 중
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 경우 인증 폼 표시
  if (!isAuthenticated) {
    return <AuthForm />;
  }

  // 로그인한 사용자에게 웹뷰 표시 (BrowserView 방식)
  if (showWebview) {
    return null; // BrowserView가 전체 화면을 덮음
  }

  // 기본 UI - 웹뷰가 숨겨진 경우만 표시
  return (
    <div className="min-h-screen bg-gray-100 p-8">
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
          <h1 className="text-3xl font-bold text-gray-800 mb-6">웹뷰 앱</h1>
          
          {/* 웹뷰 URL 입력 */}
          <div className="bg-purple-50 border-l-4 border-purple-400 p-4 mb-6">
            <h3 className="text-lg font-bold text-purple-800 mb-4">웹뷰 설정</h3>
            <div className="flex gap-2">
              <input
                type="url"
                value={webviewUrl}
                onChange={(e) => setWebviewUrl(e.target.value)}
                placeholder="https://example.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleCreateWebview}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded transition-colors"
              >
                웹뷰 열기
              </button>
            </div>
          </div>

          {showWebview && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
              <p className="text-green-800">✅ 웹뷰가 활성화되었습니다.</p>
              <button
                onClick={handleHideWebview}
                className="mt-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors"
              >
                웹뷰 숨기기
              </button>
            </div>
          )}
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