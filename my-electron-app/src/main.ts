import { app, BrowserWindow, BrowserView, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { getAccessToken } from './api/config/axios';
const activeWin = require('active-win');
const osu = require('node-os-utils');

// 상수 정의
const PRIMARY_WINDOW_PRELOAD_WEBPACK_ENTRY = path.join(__dirname, 'preload.js');
const primaryConstants = {
  ONTOL_CLINIC_WEB_ADMIN_PATH: 'https://web-develop.pawcus.dev'
};

// elog 로깅 시스템 (간단한 구현)
const elog = {
  verbose: (message: string) => {
    console.log(`[VERBOSE] ${message}`);
  },
  info: (message: string) => {
    console.log(`[INFO] ${message}`);
  },
  error: (message: string) => {
    console.error(`[ERROR] ${message}`);
  }
};

let mainWindow: BrowserWindow | null = null;
let timerWindow: BrowserWindow | null = null;
let webView: BrowserView | null = null;


// 새로운 createMainWindow 함수
export const createMainWindow = (): void => {
  elog.verbose("[Main] create main window");
  if (mainWindow == null || mainWindow.isDestroyed()) {
    mainWindow = new BrowserWindow({
      minHeight: 600,
      minWidth: 800,
      height: 600,
      width: 1400,
      autoHideMenuBar: true,
      trafficLightPosition: { x: 10, y: 10 },
      webPreferences: {
        preload: PRIMARY_WINDOW_PRELOAD_WEBPACK_ENTRY,
        webSecurity: false,
        webviewTag: true,
        nodeIntegration: true,
        contextIsolation: true, // contextBridge로 안전하게 IPC (보안 강화)
      },
    });

    mainWindow.loadURL(primaryConstants.ONTOL_CLINIC_WEB_ADMIN_PATH);

    // 메인 창 로드 완료 후 토큰 초기화
    mainWindow.webContents.once('did-finish-load', async () => {
      try {
        const accessToken = getAccessToken();
        console.log('Access Token:', accessToken);
        
        if (accessToken && mainWindow) {
          // 메인 창에서 직접 initAccessToken 호출
          const result = await mainWindow.webContents.executeJavaScript(`
            (function() {
              try {
                if (typeof window.initAccessToken === 'function') {
                  window.initAccessToken('${accessToken}', "Windows");
                  return { success: true, message: 'initAccessToken called successfully' };
                } else {
                  return { success: false, error: 'initAccessToken function not found' };
                }
              } catch (error) {
                return { success: false, error: error.message };
              }
            })();
          `);
          
          if (result.success) {
            elog.info('[MainWindow] initAccessToken called successfully');
          } else {
            elog.error(`[MainWindow] initAccessToken failed: ${result.error}`);
          }
        }
      } catch (error) {
        elog.error(`[MainWindow] Failed to call initAccessToken: ${error}`);
      }
    });

    if (!app.isPackaged) {
      mainWindow.webContents.openDevTools();
    }
  } else {
    mainWindow.show();
  }
};

function createTimerWindow() {
  timerWindow = new BrowserWindow({
    width: 220,
    height: 120,
    frame: false, // 타이틀바 제거
    alwaysOnTop: true, // 항상 최상단
    resizable: false,
    movable: true,
    minimizable: false,
    maximizable: false,
    closable: false,
    skipTaskbar: true, // 작업표시줄에 표시 안함
    transparent: true, // 투명 배경
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // 화면 오른쪽 상단에 위치
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  timerWindow.setPosition(width - 240, 20);

  if (process.env.NODE_ENV === 'development') {
    timerWindow.loadURL('http://localhost:3000/timer.html');
  } else {
    timerWindow.loadFile(path.join(__dirname, 'timer.html'));
  }

  // 타이머 창이 닫히면 null로 설정
  timerWindow.on('closed', () => {
    timerWindow = null;
  });
}

app.whenReady().then(() => {
  createMainWindow(); // 새로운 webview 기반 메인 창 생성
  createTimerWindow(); // 타이머 창도 함께 생성
  
  // 자동 업데이트 설정
  setupAutoUpdater();

  // Supabase 인증 콜백 처리를 위한 프로토콜 핸들러
  app.setAsDefaultProtocolClient('electron-app');

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow(); // 기존 createWindow 대신 createMainWindow 사용
      createTimerWindow();
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

// 타이머 관련 변수
let timerStartTime: number | null = null;
let timerInterval: NodeJS.Timeout | null = null;
let elapsedTime = 0;

// 포모도로 관련 변수
type TimerMode = 'work' | 'break';
let currentMode: TimerMode = 'work';
let workDuration = 25 * 60 * 1000; // 25분 (기본값)
let breakDuration = 5 * 60 * 1000; // 5분 (기본값)
let cycleCount = 0;
let totalWorkTime = 0;

// AFK 관련 변수
let lastActivityTime = Date.now();
let afkThreshold = 2 * 60 * 1000; // 2분
let isAfk = false;
let afkCheckInterval: NodeJS.Timeout | null = null;

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

// 타이머 상태를 타이머 창에 전송
function sendTimerUpdate(data: any) {
  if (timerWindow) {
    timerWindow.webContents.send('timer-update', data);
  }
}

// 시스템 활동 모니터링 함수
async function collectSystemActivity() {
  try {
    // 현재 활성 창 정보 가져오기
    const window = await activeWin();
    const currentTime = Date.now();
    
    // 활동 감지 시 lastActivityTime 업데이트
    if (window) {
      lastActivityTime = currentTime;
    }
    
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

// AFK 체크 시작
function startAfkCheck() {
  if (!afkCheckInterval) {
    afkCheckInterval = setInterval(checkAfkStatus, 10000); // 10초마다 체크
  }
}

// AFK 체크 중지
function stopAfkCheck() {
  if (afkCheckInterval) {
    clearInterval(afkCheckInterval);
    afkCheckInterval = null;
  }
}

// AFK 상태 확인
function checkAfkStatus() {
  const now = Date.now();
  const timeSinceLastActivity = now - lastActivityTime;
  
  const targetDuration = currentMode === 'work' ? workDuration : breakDuration;
  const remainingTime = targetDuration - elapsedTime;
  
  if (timeSinceLastActivity > afkThreshold && !isAfk) {
    isAfk = true;
    sendTimerUpdate({
      isRunning: timerInterval !== null,
      elapsedTime: elapsedTime,
      remainingTime: remainingTime,
      formattedTime: formatTime(remainingTime),
      mode: currentMode,
      isAfk: true,
      cycleCount: cycleCount,
      totalWorkTime: Math.floor(totalWorkTime / 1000 / 60)
    });
  } else if (timeSinceLastActivity <= afkThreshold && isAfk) {
    isAfk = false;
    sendTimerUpdate({
      isRunning: timerInterval !== null,
      elapsedTime: elapsedTime,
      remainingTime: remainingTime,
      formattedTime: formatTime(remainingTime),
      mode: currentMode,
      isAfk: false,
      cycleCount: cycleCount,
      totalWorkTime: Math.floor(totalWorkTime / 1000 / 60)
    });
  }
}

// 포모도로 타이머 시작
function startTimer() {
  if (!timerStartTime) {
    // 새로운 타이머 시작 시 elapsedTime을 0으로 리셋
    elapsedTime = 0;
    timerStartTime = Date.now();
    
    // 초기 상태 즉시 전송 (0초부터 시작)
    const targetDuration = currentMode === 'work' ? workDuration : breakDuration;
    sendTimerUpdate({
      isRunning: true,
      elapsedTime: 0,
      remainingTime: targetDuration,
      formattedTime: formatTime(targetDuration),
      mode: currentMode,
      isAfk: isAfk,
      cycleCount: cycleCount,
      totalWorkTime: Math.floor(totalWorkTime / 1000 / 60),
      progress: 0
    });
    
    // 타이머 업데이트 함수 - 1초씩 증가하는 방식으로 변경
    const updateTimer = () => {
      // elapsedTime을 1초씩 증가 (실제 시간 기반이 아닌 카운터 기반)
      elapsedTime += 1000;
      
      // 작업 시간일 때 총 작업 시간 누적
      if (currentMode === 'work') {
        totalWorkTime += 1000;
      }
      
      // 포모도로 시간 체크
      const targetDuration = currentMode === 'work' ? workDuration : breakDuration;
      const remainingTime = targetDuration - elapsedTime;
      
      if (remainingTime <= 0) {
        // 시간 완료 - 다이얼로그 표시
        showTransitionDialog();
        return;
      }
      
      sendTimerUpdate({
        isRunning: true,
        elapsedTime: elapsedTime,
        remainingTime: remainingTime,
        formattedTime: formatTime(remainingTime),
        mode: currentMode,
        isAfk: isAfk,
        cycleCount: cycleCount,
        totalWorkTime: Math.floor(totalWorkTime / 1000 / 60),
        progress: (elapsedTime / targetDuration) * 100
      });
    };
    
    // 1초 간격으로 반복 실행
    timerInterval = setInterval(updateTimer, 1000);
    
    // AFK 체크만 시작 (모니터링은 별도로 제어)
    startAfkCheck();
  }
}

// 전환 다이얼로그 표시
function showTransitionDialog() {
  const { dialog } = require('electron');
  
  stopTimer();
  
  if (currentMode === 'work') {
    // 작업 완료 - 휴식 제안
    cycleCount++;
    const options = {
      type: 'info' as const,
      title: '작업 시간 완료!',
      message: `${Math.floor(workDuration / 60000)}분 작업을 완료했습니다.\n휴식을 취하시겠습니까?`,
      buttons: ['휴식 시작', '+5분 연장', '계속 작업'],
      defaultId: 0,
      timeout: 10000 // 10초 후 자동으로 기본값 선택
    };
    
    dialog.showMessageBox(mainWindow!, options).then((result: any) => {
      if (result.response === 0) {
        // 휴식 시작
        switchToBreak();
      } else if (result.response === 1) {
        // +5분 연장
        extendWorkTime(5);
      } else {
        // 계속 작업 (새로운 포모도로 시작)
        resetForNewPomodoro();
      }
    });
  } else {
    // 휴식 완료 - 작업 제안
    const options = {
      type: 'info' as const,
      title: '휴식 시간 완료!',
      message: `${Math.floor(breakDuration / 60000)}분 휴식을 마쳤습니다.\n작업을 시작하시겠습니까?`,
      buttons: ['작업 시작', '휴식 연장', '대기'],
      defaultId: 2, // 기본값: 대기
      timeout: 10000
    };
    
    dialog.showMessageBox(mainWindow!, options).then((result: any) => {
      if (result.response === 0) {
        // 작업 시작
        switchToWork();
      } else if (result.response === 1) {
        // 휴식 연장
        extendBreakTime(5);
      } else {
        // 대기 (아무것도 하지 않음)
        resetTimer();
      }
    });
  }
}

// 작업 시간 연장
function extendWorkTime(minutes: number) {
  elapsedTime = 0;
  timerStartTime = null;
  workDuration += minutes * 60 * 1000;
  startTimer();
}

// 휴식 시간 연장  
function extendBreakTime(minutes: number) {
  elapsedTime = 0;
  timerStartTime = null;
  breakDuration += minutes * 60 * 1000;
  startTimer();
}

// 휴식으로 전환
function switchToBreak() {
  currentMode = 'break';
  resetForNewSession();
  startTimer();
}

// 작업으로 전환
function switchToWork() {
  currentMode = 'work';
  resetForNewSession();
  startTimer();
}

// 새로운 포모도로를 위한 리셋
function resetForNewPomodoro() {
  resetForNewSession();
  startTimer();
}

// 새로운 세션을 위한 리셋
function resetForNewSession() {
  elapsedTime = 0;
  timerStartTime = null;
  
  // 기본 지속 시간으로 복원
  workDuration = 25 * 60 * 1000;
  breakDuration = 5 * 60 * 1000;
}

// 타이머 중지
function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    
    stopAfkCheck();
    
    const targetDuration = currentMode === 'work' ? workDuration : breakDuration;
    const remainingTime = targetDuration - elapsedTime;
    
    sendTimerUpdate({
      isRunning: false,
      elapsedTime: elapsedTime,
      remainingTime: remainingTime,
      formattedTime: formatTime(remainingTime),
      mode: currentMode,
      isAfk: isAfk,
      cycleCount: cycleCount,
      totalWorkTime: Math.floor(totalWorkTime / 1000 / 60)
    });
    
    // 모니터링은 별도로 제어됨
  }
}

// 타이머 리셋
function resetTimer() {
  stopTimer();
  elapsedTime = 0;
  timerStartTime = null;
  currentMode = 'work';
  cycleCount = 0;
  totalWorkTime = 0;
  isAfk = false;
  
  // 기본 지속 시간으로 복원
  workDuration = 25 * 60 * 1000;
  breakDuration = 5 * 60 * 1000;
  
  sendTimerUpdate({
    isRunning: false,
    elapsedTime: 0,
    remainingTime: workDuration,
    formattedTime: formatTime(workDuration), // 25:00으로 표시
    mode: currentMode,
    isAfk: false,
    cycleCount: 0,
    totalWorkTime: 0,
    progress: 0
  });
}

// 시간 포맷팅
function formatTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  const displaySeconds = seconds % 60;
  const displayMinutes = minutes % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${displayMinutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
  } else {
    return `${displayMinutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
  }
}

// 모니터링 시작 함수
function startMonitoring() {
  if (!isMonitoring) {
    isMonitoring = true;
    monitoringInterval = setInterval(collectSystemActivity, 5000);
    collectSystemActivity();
  }
}

// 모니터링 중지 함수
async function stopMonitoring() {
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
    
    await saveActivityLogs();
  }
}

// IPC 핸들러 - 모니터링 시작/중지
ipcMain.handle('start-monitoring', async () => {
  startMonitoring();
  return { success: true, message: 'Monitoring started' };
});

ipcMain.handle('stop-monitoring', async () => {
  await stopMonitoring();
  return { success: true, message: 'Monitoring stopped' };
});

// IPC 핸들러 - 타이머 제어
ipcMain.handle('start-timer', async () => {
  startTimer();
  return { success: true, message: 'Timer started' };
});

ipcMain.handle('stop-timer', async () => {
  stopTimer();
  return { success: true, message: 'Timer stopped' };
});

ipcMain.handle('reset-timer', async () => {
  resetTimer();
  return { success: true, message: 'Timer reset' };
});

ipcMain.handle('get-timer-status', async () => {
  const targetDuration = currentMode === 'work' ? workDuration : breakDuration;
  const remainingTime = targetDuration - elapsedTime;
  
  return {
    isRunning: timerInterval !== null,
    elapsedTime: elapsedTime,
    remainingTime: remainingTime,
    formattedTime: formatTime(remainingTime),
    mode: currentMode,
    isAfk: isAfk,
    cycleCount: cycleCount,
    totalWorkTime: Math.floor(totalWorkTime / 1000 / 60),
    progress: (elapsedTime / targetDuration) * 100
  };
});

// 포모도로 설정 핸들러
ipcMain.handle('set-work-duration', async (event, minutes) => {
  workDuration = minutes * 60 * 1000;
  
  // 현재 작업 모드이고 타이머가 정지된 상태라면 즉시 반영
  if (currentMode === 'work' && !timerInterval) {
    elapsedTime = 0;
    sendTimerUpdate({
      isRunning: false,
      elapsedTime: 0,
      remainingTime: workDuration,
      formattedTime: formatTime(workDuration),
      mode: currentMode,
      isAfk: false,
      cycleCount: cycleCount,
      totalWorkTime: Math.floor(totalWorkTime / 1000 / 60),
      progress: 0
    });
  }
  
  return { success: true };
});

ipcMain.handle('set-break-duration', async (event, minutes) => {
  breakDuration = minutes * 60 * 1000;
  
  // 현재 휴식 모드이고 타이머가 정지된 상태라면 즉시 반영
  if (currentMode === 'break' && !timerInterval) {
    elapsedTime = 0;
    sendTimerUpdate({
      isRunning: false,
      elapsedTime: 0,
      remainingTime: breakDuration,
      formattedTime: formatTime(breakDuration),
      mode: currentMode,
      isAfk: false,
      cycleCount: cycleCount,
      totalWorkTime: Math.floor(totalWorkTime / 1000 / 60),
      progress: 0
    });
  }
  
  return { success: true };
});

ipcMain.handle('switch-mode', async (event, mode) => {
  if (mode === 'work' || mode === 'break') {
    currentMode = mode;
    resetForNewSession();
    return { success: true };
  }
  return { success: false, error: 'Invalid mode' };
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

// IPC 핸들러 - 타이머 창 이동
ipcMain.on('move-timer-window', (event, { x, y }) => {
  if (timerWindow) {
    timerWindow.setPosition(x, y);
  }
});

// 웹뷰에서 initAccessToken 함수 호출 (재시도 로직 포함)
async function callInitAccessTokenInWebview(accessToken: string, retryCount: number = 5): Promise<boolean> {
  try {
    if (!webView) {
      elog.error('[WebView] No webview available for initAccessToken');
      return false;
    }

    // 웹뷰가 로드될 때까지 대기
    while (webView.webContents.isLoading()) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 재시도 로직
    for (let i = 0; i < retryCount; i++) {
      try {
        // 웹뷰에서 initAccessToken 함수 호출
        const result = await webView.webContents.executeJavaScript(`
          (function() {
            try {
              if (typeof window.initAccessToken === 'function') {
                window.initAccessToken('${accessToken}', "Windows");
                return { success: true, message: 'initAccessToken called successfully' };
              } else {
                return { success: false, error: 'initAccessToken function not found' };
              }
            } catch (error) {
              return { success: false, error: error.message };
            }
          })();
        `);

        if (result.success) {
          elog.info('[WebView] initAccessToken called successfully');
          return true;
        } else {
          elog.error(`[WebView] initAccessToken failed (attempt ${i + 1}): ${result.error}`);
          
          // 함수가 아직 로드되지 않았다면 잠시 대기 후 재시도
          if (result.error === 'initAccessToken function not found' && i < retryCount - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // 점진적 지연
            continue;
          }
          
          return false;
        }
      } catch (error) {
        elog.error(`[WebView] Failed to call initAccessToken (attempt ${i + 1}): ${error}`);
        if (i < retryCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // 점진적 지연
        }
      }
    }

    return false;
  } catch (error) {
    elog.error(`[WebView] Failed to call initAccessToken: ${error}`);
    return false;
  }
}

// 웹뷰에서 전역 함수 호출 (범용)
async function executeWebviewFunction(functionName: string, ...args: any[]): Promise<any> {
  try {
    if (!webView) {
      throw new Error('No webview available');
    }

    // 웹뷰가 로드될 때까지 대기
    while (webView.webContents.isLoading()) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 인자를 JSON 문자열로 변환하여 안전하게 전달
    const argsJson = JSON.stringify(args);
    
    const result = await webView.webContents.executeJavaScript(`
      (function() {
        try {
          if (typeof window.${functionName} === 'function') {
            const args = ${argsJson};
            const result = window.${functionName}(...args);
            return { success: true, result: result };
          } else {
            return { success: false, error: '${functionName} function not found' };
          }
        } catch (error) {
          return { success: false, error: error.message };
        }
      })();
    `);

    return result;
  } catch (error) {
    elog.error(`[WebView] Failed to execute ${functionName}: ${error}`);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// WebView 관련 IPC 핸들러
ipcMain.handle('create-webview', async (event, url) => {
  try {
    if (!mainWindow) {
      return { success: false, error: 'Main window not available' };
    }

    // 기존 webview가 있으면 제거
    if (webView) {
      mainWindow.removeBrowserView(webView);
      webView = null;
    }

    // 새로운 BrowserView 생성
    webView = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true
      }
    });

    // 메인 창에 webview 추가
    mainWindow.setBrowserView(webView);

    // 메인 창의 webContents 완전히 숨기기
    mainWindow.webContents.executeJavaScript(`
      document.body.style.display = 'none';
      document.documentElement.style.display = 'none';
    `);
    
    // webview 크기 설정 (전체 화면)
    const bounds = mainWindow.getBounds();
    webView.setBounds({ 
      x: 0, 
      y: 0, 
      width: bounds.width, 
      height: bounds.height 
    });

    // 자동 리사이즈 설정
    webView.setAutoResize({ width: true, height: true });

    // URL 로드
    await webView.webContents.loadURL(url);

    // 웹뷰 로드 완료 후 토큰 초기화 (비동기적으로 실행)
    setTimeout(async () => {
      // 로딩이 완료될 때까지 대기
      while (webView && webView.webContents.isLoading()) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // 추가 지연 후 토큰 초기화
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const accessToken = await getAccessToken();
      if (accessToken && webView) {
        await callInitAccessTokenInWebview(accessToken as string);
      }
    }, 500); // 초기 지연

    return { success: true };
  } catch (error) {
    console.error('Failed to create webview:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('hide-webview', async () => {
  try {
    if (webView && mainWindow) {
      mainWindow.removeBrowserView(webView);
      webView = null;
      return { success: true };
    }
    return { success: false, error: 'No webview to hide' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('webview-navigate', async (event, url) => {
  try {
    if (!webView) {
      return { success: false, error: 'No webview available' };
    }
    
    await webView.webContents.loadURL(url);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

// 웹뷰에서 initAccessToken 함수 호출 IPC 핸들러
ipcMain.handle('webview-init-access-token', async (event, accessToken) => {
  try {
    const result = await callInitAccessTokenInWebview(accessToken);
    return { success: result, message: result ? 'initAccessToken called successfully' : 'Failed to call initAccessToken' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

// 웹뷰에서 전역 함수 호출 IPC 핸들러
ipcMain.handle('webview-execute-function', async (event, functionName, ...args) => {
  try {
    const result = await executeWebviewFunction(functionName, ...args);
    return result;
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

// 웹뷰에서 현재 유효한 토큰으로 initAccessToken 호출
ipcMain.handle('webview-refresh-token', async () => {
  try {
    const accessToken = await getAccessToken();
    if (accessToken) {
      const result = await callInitAccessTokenInWebview(accessToken as string);
      return { success: result, message: result ? 'Token refreshed in webview' : 'Failed to refresh token in webview' };
    } else {
      return { success: false, error: 'No valid access token available' };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

// 메인 창에서 initAccessToken 호출
ipcMain.handle('mainwindow-init-access-token', async (event, accessToken) => {
  try {
    if (!mainWindow) {
      return { success: false, error: 'Main window not available' };
    }

    const result = await mainWindow.webContents.executeJavaScript(`
      (function() {
        try {
          if (typeof window.initAccessToken === 'function') {
            window.initAccessToken('${accessToken}', "Windows");
            return { success: true, message: 'initAccessToken called successfully' };
          } else {
            return { success: false, error: 'initAccessToken function not found' };
          }
        } catch (error) {
          return { success: false, error: error.message };
        }
      })();
    `);

    return result;
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

// 메인 창에서 현재 유효한 토큰으로 initAccessToken 호출
ipcMain.handle('mainwindow-refresh-token', async () => {
  try {
    const accessToken = getAccessToken();
    if (accessToken) {
      if (!mainWindow) {
        return { success: false, error: 'Main window not available' };
      }

      const result = await mainWindow.webContents.executeJavaScript(`
        (function() {
          try {
            if (typeof window.initAccessToken === 'function') {
              window.initAccessToken('${accessToken}', "Windows");
              return { success: true, message: 'initAccessToken called successfully' };
            } else {
              return { success: false, error: 'initAccessToken function not found' };
            }
          } catch (error) {
            return { success: false, error: error.message };
          }
        })();
      `);

      return result;
    } else {
      return { success: false, error: 'No valid access token available' };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

// Supabase 인증 콜백 URL 처리
app.on('open-url', (event, url) => {
  event.preventDefault();
  
  if (url.startsWith('electron-app://auth/callback')) {
    // URL에서 access token과 refresh token 추출
    const urlParts = new URL(url);
    const fragment = urlParts.hash;
    
    if (fragment) {
      // 메인 창에 인증 결과 전송
      if (mainWindow) {
        mainWindow.webContents.send('auth-callback', fragment);
      }
    }
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