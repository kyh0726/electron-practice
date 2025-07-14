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
  }
});