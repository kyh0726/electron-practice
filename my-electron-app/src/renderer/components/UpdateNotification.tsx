import React from 'react';
import { useAutoUpdater } from '../hooks/useAutoUpdater';

const UpdateNotification: React.FC = () => {
  const {
    updateInfo,
    isUpdateAvailable,
    isUpdateDownloaded,
    downloadProgress,
    isChecking,
    isDownloading,
    checkForUpdates,
    downloadUpdate,
    installUpdate
  } = useAutoUpdater();

  if (!isUpdateAvailable && !isUpdateDownloaded && !isChecking) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 max-w-md bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
      {isChecking && (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span className="text-sm text-gray-700">업데이트 확인 중...</span>
        </div>
      )}

      {isUpdateAvailable && !isUpdateDownloaded && !isDownloading && (
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <h3 className="font-semibold text-gray-800">새 업데이트 사용 가능</h3>
          </div>
          {updateInfo && (
            <div className="text-sm text-gray-600 mb-3">
              <p>버전: {updateInfo.version}</p>
              {updateInfo.releaseName && (
                <p className="font-medium">{updateInfo.releaseName}</p>
              )}
              {updateInfo.releaseNotes && (
                <p className="mt-1 text-xs bg-gray-50 p-2 rounded">
                  {updateInfo.releaseNotes}
                </p>
              )}
            </div>
          )}
          <div className="flex space-x-2">
            <button
              onClick={downloadUpdate}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
            >
              다운로드
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
            >
              나중에
            </button>
          </div>
        </div>
      )}

      {isDownloading && (
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <h3 className="font-semibold text-gray-800">업데이트 다운로드 중</h3>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">{Math.round(downloadProgress)}% 완료</p>
        </div>
      )}

      {isUpdateDownloaded && (
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <h3 className="font-semibold text-gray-800">업데이트 준비 완료</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            업데이트가 다운로드되었습니다. 지금 재시작하여 새 버전을 설치하시겠습니까?
          </p>
          <div className="flex space-x-2">
            <button
              onClick={installUpdate}
              className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
            >
              지금 재시작
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
            >
              나중에
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateNotification;