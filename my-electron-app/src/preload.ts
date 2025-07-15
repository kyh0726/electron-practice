import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  },
  saveLog: (logData: { action: string; details: any }) => 
    ipcRenderer.invoke('save-log', logData),
  startMonitoring: () => ipcRenderer.invoke('start-monitoring'),
  stopMonitoring: () => ipcRenderer.invoke('stop-monitoring'),
  getCurrentActivity: () => ipcRenderer.invoke('get-current-activity'),
  
  // 자동 업데이트 API
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  
  // 업데이트 상태 리스너
  onUpdateStatus: (callback: (event: any, data: any) => void) => {
    ipcRenderer.on('update-status', callback);
  },
  
  // 업데이트 상태 리스너 제거
  removeUpdateStatusListener: (callback: (event: any, data: any) => void) => {
    ipcRenderer.removeListener('update-status', callback);
  },
  
  // 타이머 API
  startTimer: () => ipcRenderer.invoke('start-timer'),
  stopTimer: () => ipcRenderer.invoke('stop-timer'),
  resetTimer: () => ipcRenderer.invoke('reset-timer'),
  getTimerStatus: () => ipcRenderer.invoke('get-timer-status'),
  
  // 타이머 업데이트 리스너
  onTimerUpdate: (callback: (event: any, data: any) => void) => {
    ipcRenderer.on('timer-update', callback);
  },
  
  // 타이머 창 이동
  moveTimerWindow: (x: number, y: number) => {
    ipcRenderer.send('move-timer-window', { x, y });
  },
  
  // 포모도로 설정
  setWorkDuration: (minutes: number) => ipcRenderer.invoke('set-work-duration', minutes),
  setBreakDuration: (minutes: number) => ipcRenderer.invoke('set-break-duration', minutes),
  switchMode: (mode: 'work' | 'break') => ipcRenderer.invoke('switch-mode', mode),
  
  // 인증 콜백 리스너
  onAuthCallback: (callback: (event: any, fragment: string) => void) => {
    ipcRenderer.on('auth-callback', callback);
  }
});