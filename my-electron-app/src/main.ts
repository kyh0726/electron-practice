import { app, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
const activeWin = require('active-win');
const osu = require('node-os-utils');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:8080');
    // 개발자 도구를 자동으로 열지 않음
    // win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  
  // 자동 업데이트 설정
  setupAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 로그 저장 디렉토리 생성
const logDir = path.join(app.getPath('userData'), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 활동 로그 수집 변수
let activityLogs: any[] = [];
let isMonitoring = false;
let monitoringInterval: NodeJS.Timeout | null = null;
let lastActivity: { app: string; title: string; url?: string; startTime: number } | null = null;

// 자동 업데이트 설정
function setupAutoUpdater() {
  // 개발 모드에서는 자동 업데이트 비활성화
  if (process.env.NODE_ENV === 'development') {
    return;
  }
  
  // 업데이트 이벤트 리스너
  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for update...');
    sendUpdateStatus('checking-for-update');
  });
  
  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info);
    sendUpdateStatus('update-available', info);
  });
  
  autoUpdater.on('update-not-available', (info) => {
    console.log('Update not available:', info);
    sendUpdateStatus('update-not-available', info);
  });
  
  autoUpdater.on('error', (err) => {
    console.error('Update error:', err);
    sendUpdateStatus('error', { message: err.message });
  });
  
  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = `Download speed: ${progressObj.bytesPerSecond}`;
    log_message += ` - Downloaded ${progressObj.percent}%`;
    log_message += ` (${progressObj.transferred}/${progressObj.total})`;
    console.log(log_message);
    sendUpdateStatus('download-progress', progressObj);
  });
  
  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info);
    sendUpdateStatus('update-downloaded', info);
  });
  
  // 앱 시작 시 업데이트 확인
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 5000);
}

// 업데이트 상태를 렌더러에 전송
function sendUpdateStatus(event: string, data?: any) {
  const windows = BrowserWindow.getAllWindows();
  windows.forEach(win => {
    win.webContents.send('update-status', { event, data });
  });
}

// 시스템 활동 모니터링 함수
async function collectSystemActivity() {
  try {
    // 현재 활성 창 정보 가져오기
    const window = await activeWin();
    const currentTime = Date.now();
    
    if (window) {
      const currentActivity = {
        app: window.owner.name,
        title: window.title,
        url: window.url || undefined
      };
      
      // 이전 활동과 다른 경우 지속 시간 기록
      if (lastActivity && 
          (lastActivity.app !== currentActivity.app || 
           lastActivity.title !== currentActivity.title ||
           lastActivity.url !== currentActivity.url)) {
        
        // 이전 활동 저장
        const duration = currentTime - lastActivity.startTime;
        const activityRecord = {
          title: lastActivity.title,
          app: lastActivity.app,
          url: lastActivity.url,
          duration: Math.round(duration / 1000), // 초 단위
          timestamp: new Date(lastActivity.startTime).toISOString()
        };
        
        activityLogs.push(activityRecord);
        
        // 로그가 100개 이상이면 파일로 저장하고 비우기
        if (activityLogs.length >= 100) {
          await saveActivityLogs();
        }
      }
      
      // 현재 활동 업데이트
      lastActivity = {
        ...currentActivity,
        startTime: currentTime
      };
      
      return {
        activeWindow: {
          title: window.title,
          app: window.owner.name,
          url: window.url || null,
          bounds: window.bounds
        },
        system: {
          cpuUsage: await osu.cpu.usage(),
          memoryUsage: await osu.mem.info().then((mem: any) => ({
            totalMemMb: mem.totalMemMb,
            usedMemMb: mem.usedMemMb,
            freeMemPercentage: mem.freeMemPercentage
          }))
        }
      };
    }
    
    return null;
  } catch (error) {
    console.error('Failed to collect activity:', error);
    return null;
  }
}

// 활동 로그를 파일로 저장
async function saveActivityLogs() {
  if (activityLogs.length === 0) return;
  
  try {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const logFileName = `activity-log-${timestamp}.json`;
    const logPath = path.join(logDir, logFileName);
    
    fs.writeFileSync(logPath, JSON.stringify({
      startTime: activityLogs[0].timestamp,
      endTime: activityLogs[activityLogs.length - 1].timestamp,
      totalEntries: activityLogs.length,
      activities: activityLogs
    }, null, 2));
    
    activityLogs = []; // 로그 비우기
    console.log('Activity logs saved to:', logPath);
  } catch (error) {
    console.error('Failed to save activity logs:', error);
  }
}

// IPC 핸들러 - 모니터링 시작/중지
ipcMain.handle('start-monitoring', async () => {
  if (!isMonitoring) {
    isMonitoring = true;
    // 5초마다 활동 수집
    monitoringInterval = setInterval(collectSystemActivity, 5000);
    // 즉시 한 번 수집
    await collectSystemActivity();
    return { success: true, message: 'Monitoring started' };
  }
  return { success: false, message: 'Already monitoring' };
});

ipcMain.handle('stop-monitoring', async () => {
  if (isMonitoring) {
    isMonitoring = false;
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      monitoringInterval = null;
    }
    
    // 마지막 활동 저장
    if (lastActivity) {
      const duration = Date.now() - lastActivity.startTime;
      const activityRecord = {
        title: lastActivity.title,
        app: lastActivity.app,
        url: lastActivity.url,
        duration: Math.round(duration / 1000),
        timestamp: new Date(lastActivity.startTime).toISOString()
      };
      activityLogs.push(activityRecord);
      lastActivity = null;
    }
    
    // 남은 로그 저장
    await saveActivityLogs();
    return { success: true, message: 'Monitoring stopped' };
  }
  return { success: false, message: 'Not monitoring' };
});

// IPC 핸들러 - 현재 활동 가져오기
ipcMain.handle('get-current-activity', async () => {
  const activity = await collectSystemActivity();
  return activity;
});

// IPC 핸들러 - 로그 저장 (기존 핸들러 유지)
ipcMain.handle('save-log', async (event, logData) => {
  try {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const logFileName = `user-log-${timestamp}.json`;
    const logPath = path.join(logDir, logFileName);
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      action: logData.action,
      details: logData.details,
      systemInfo: {
        platform: process.platform,
        version: process.getSystemVersion(),
        arch: process.arch,
        userName: os.userInfo().username
      }
    };
    
    fs.writeFileSync(logPath, JSON.stringify(logEntry, null, 2));
    
    return { success: true, path: logPath };
  } catch (error) {
    console.error('Failed to save log:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

// IPC 핸들러 - 업데이트 관련
ipcMain.handle('check-for-updates', async () => {
  if (process.env.NODE_ENV === 'development') {
    return { success: false, message: 'Updates disabled in development mode' };
  }
  
  try {
    const result = await autoUpdater.checkForUpdates();
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('download-update', async () => {
  if (process.env.NODE_ENV === 'development') {
    return { success: false, message: 'Updates disabled in development mode' };
  }
  
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('install-update', async () => {
  if (process.env.NODE_ENV === 'development') {
    return { success: false, message: 'Updates disabled in development mode' };
  }
  
  try {
    autoUpdater.quitAndInstall();
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

// 앱 종료 시 로그 저장
app.on('before-quit', async () => {
  if (isMonitoring) {
    // 마지막 활동 저장
    if (lastActivity) {
      const duration = Date.now() - lastActivity.startTime;
      const activityRecord = {
        title: lastActivity.title,
        app: lastActivity.app,
        url: lastActivity.url,
        duration: Math.round(duration / 1000),
        timestamp: new Date(lastActivity.startTime).toISOString()
      };
      activityLogs.push(activityRecord);
    }
    await saveActivityLogs();
  }
});