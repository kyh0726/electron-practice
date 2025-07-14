import React from 'react';
import { useUsageMonitoring } from './hooks/useUsageMonitoring';
import { useAutoUpdater } from './hooks/useAutoUpdater';
import UpdateNotification from './components/UpdateNotification';

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

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <UpdateNotification />
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">시스템 활동 모니터링</h1>
          
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
    </div>
  );
};

export default App;