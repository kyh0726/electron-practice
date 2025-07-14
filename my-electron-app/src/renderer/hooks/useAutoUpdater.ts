import { useState, useEffect, useCallback } from 'react';

interface UpdateStatus {
  event: string;
  data?: any;
}

interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseName?: string;
  releaseNotes?: string;
}

export const useAutoUpdater = () => {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isUpdateDownloaded, setIsUpdateDownloaded] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleUpdateStatus = useCallback((event: any, data: { event: string; data?: any }) => {
    setUpdateStatus(data);
    
    switch (data.event) {
      case 'checking-for-update':
        setIsChecking(true);
        setIsUpdateAvailable(false);
        setIsUpdateDownloaded(false);
        break;
        
      case 'update-available':
        setIsChecking(false);
        setIsUpdateAvailable(true);
        setUpdateInfo(data.data);
        break;
        
      case 'update-not-available':
        setIsChecking(false);
        setIsUpdateAvailable(false);
        break;
        
      case 'download-progress':
        setIsDownloading(true);
        setDownloadProgress(data.data?.percent || 0);
        break;
        
      case 'update-downloaded':
        setIsDownloading(false);
        setIsUpdateDownloaded(true);
        setDownloadProgress(100);
        break;
        
      case 'error':
        setIsChecking(false);
        setIsDownloading(false);
        console.error('Update error:', data.data?.message);
        break;
    }
  }, []);

  useEffect(() => {
    window.electronAPI.onUpdateStatus(handleUpdateStatus);
    
    return () => {
      window.electronAPI.removeUpdateStatusListener(handleUpdateStatus);
    };
  }, [handleUpdateStatus]);

  const checkForUpdates = useCallback(async () => {
    setIsChecking(true);
    try {
      const result = await window.electronAPI.checkForUpdates();
      if (!result.success) {
        console.error('Failed to check for updates:', result.error);
        setIsChecking(false);
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      setIsChecking(false);
    }
  }, []);

  const downloadUpdate = useCallback(async () => {
    setIsDownloading(true);
    try {
      const result = await window.electronAPI.downloadUpdate();
      if (!result.success) {
        console.error('Failed to download update:', result.error);
        setIsDownloading(false);
      }
    } catch (error) {
      console.error('Error downloading update:', error);
      setIsDownloading(false);
    }
  }, []);

  const installUpdate = useCallback(async () => {
    try {
      const result = await window.electronAPI.installUpdate();
      if (!result.success) {
        console.error('Failed to install update:', result.error);
      }
    } catch (error) {
      console.error('Error installing update:', error);
    }
  }, []);

  return {
    updateStatus,
    updateInfo,
    isUpdateAvailable,
    isUpdateDownloaded,
    downloadProgress,
    isChecking,
    isDownloading,
    checkForUpdates,
    downloadUpdate,
    installUpdate
  };
};