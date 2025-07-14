import { useState, useCallback, useEffect } from 'react';

interface ActivityRecord {
  title: string;
  app: string;
  url?: string;
  duration: number;
  timestamp: string;
}

interface ActivityData {
  activeWindow?: {
    app: string;
    title: string;
    url?: string;
  };
  system?: {
    cpuUsage?: number;
    memoryUsage?: {
      freeMemPercentage?: number;
    };
  };
}

interface MonitoringResult {
  success: boolean;
  message: string;
}

export const useUsageMonitoring = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [monitoringStatus, setMonitoringStatus] = useState<string>('');
  const [currentActivity, setCurrentActivity] = useState<ActivityData | null>(null);

  const startMonitoring = useCallback(async (): Promise<MonitoringResult> => {
    try {
      const result = await window.electronAPI.startMonitoring();
      if (result.success) {
        setIsMonitoring(true);
        setMonitoringStatus('모니터링 시작됨 - 5초마다 활동 기록 중...');
        return { success: true, message: '모니터링이 시작되었습니다.' };
      } else {
        setMonitoringStatus(result.message);
        return { success: false, message: result.message };
      }
    } catch (error) {
      const errorMessage = `오류: ${error}`;
      setMonitoringStatus(errorMessage);
      return { success: false, message: errorMessage };
    }
  }, []);

  const stopMonitoring = useCallback(async (): Promise<MonitoringResult> => {
    try {
      const result = await window.electronAPI.stopMonitoring();
      if (result.success) {
        setIsMonitoring(false);
        setMonitoringStatus('모니터링 중지됨 - 로그가 저장되었습니다.');
        setCurrentActivity(null);
        return { success: true, message: '모니터링이 중지되었습니다.' };
      } else {
        setMonitoringStatus(result.message);
        return { success: false, message: result.message };
      }
    } catch (error) {
      const errorMessage = `오류: ${error}`;
      setMonitoringStatus(errorMessage);
      return { success: false, message: errorMessage };
    }
  }, []);

  const getCurrentActivity = useCallback(async (): Promise<ActivityData | null> => {
    if (!isMonitoring) return null;
    
    try {
      const activity = await window.electronAPI.getCurrentActivity();
      setCurrentActivity(activity);
      return activity;
    } catch (error) {
      console.error('Failed to get current activity:', error);
      return null;
    }
  }, [isMonitoring]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isMonitoring) {
      intervalId = setInterval(getCurrentActivity, 3000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isMonitoring, getCurrentActivity]);

  return {
    isMonitoring,
    monitoringStatus,
    currentActivity,
    startMonitoring,
    stopMonitoring,
    getCurrentActivity
  };
};

export type { ActivityRecord, ActivityData };