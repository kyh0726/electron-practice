import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // 인증 콜백 리스너
  onAuthCallback: (callback: (event: any, fragment: string) => void) => {
    ipcRenderer.on('auth-callback', callback);
  },
  
  // 웹뷰 API
  createWebview: (url: string) => ipcRenderer.invoke('create-webview', url),
  hideWebview: () => ipcRenderer.invoke('hide-webview'),
  webviewNavigate: (url: string) => ipcRenderer.invoke('webview-navigate', url),
  
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
  setBreakDuration: (minutes: number) => ipcRenderer.invoke('set-break-duration', minutes)
});