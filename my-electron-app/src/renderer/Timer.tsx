import React, { useState, useEffect } from 'react';

interface TimerData {
  isRunning: boolean;
  elapsedTime: number;
  remainingTime?: number;
  formattedTime: string;
  mode?: 'work' | 'break';
  isAfk?: boolean;
  cycleCount?: number;
  totalWorkTime?: number;
  progress?: number;
}

const Timer: React.FC = () => {
  const [timerData, setTimerData] = useState<TimerData>({
    isRunning: false,
    elapsedTime: 0,
    remainingTime: 25 * 60 * 1000, // 25분
    formattedTime: '25:00',
    mode: 'work',
    isAfk: false,
    cycleCount: 0,
    totalWorkTime: 0,
    progress: 0
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // 타이머 업데이트 리스너
    const handleTimerUpdate = (event: any, data: TimerData) => {
      setTimerData(data);
    };

    if (window.electronAPI) {
      window.electronAPI.onTimerUpdate(handleTimerUpdate);
      
      // 초기 상태 가져오기
      window.electronAPI.getTimerStatus().then((data: TimerData) => {
        setTimerData(data);
      });
    }

    return () => {
      // 클린업은 필요시 추가
    };
  }, []);

  const handleStart = () => {
    if (window.electronAPI) {
      window.electronAPI.startTimer();
    }
  };

  const handleStop = () => {
    if (window.electronAPI) {
      window.electronAPI.resetTimer();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && window.electronAPI) {
      const deltaX = e.screenX - dragOffset.x;
      const deltaY = e.screenY - dragOffset.y;
      window.electronAPI.moveTimerWindow(deltaX, deltaY);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getModeColor = () => {
    if (timerData.isAfk) return '#ffc107'; // 노란색 (AFK)
    return timerData.mode === 'work' ? '#28a745' : '#17a2b8'; // 초록색 (작업) / 파란색 (휴식)
  };

  const getModeText = () => {
    if (timerData.isAfk) return 'AFK';
    return timerData.mode === 'work' ? 'WORK' : 'BREAK';
  };

  return (
    <div 
      className="timer-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '200px',
        height: '100px',
        padding: '10px',
        margin: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: 'rgba(0, 0, 0, 0.9)',
        borderRadius: '12px',
        color: 'white',
        cursor: 'move',
        userSelect: 'none',
        boxSizing: 'border-box',
        border: `2px solid ${getModeColor()}`,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
      }}
    >
      {/* 상태 및 사이클 정보 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: '8px',
        fontSize: '10px',
        opacity: 0.8
      }}>
        <span style={{ 
          color: getModeColor(),
          fontWeight: 'bold',
          fontSize: '11px'
        }}>
          {getModeText()}
        </span>
        <span>
          사이클: {timerData.cycleCount} | 총 {timerData.totalWorkTime}분
        </span>
      </div>

      {/* 타이머 표시 */}
      <div 
        className="timer-display"
        style={{
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '8px',
          textAlign: 'center',
          fontFamily: '"Courier New", monospace',
          color: timerData.isAfk ? '#ffc107' : 'white'
        }}
      >
        {timerData.formattedTime}
      </div>

      {/* 진행률 바 */}
      {timerData.isRunning && (
        <div style={{
          width: '100%',
          height: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '2px',
          marginBottom: '8px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${Math.min(timerData.progress || 0, 100)}%`,
            height: '100%',
            backgroundColor: getModeColor(),
            transition: 'width 1s ease'
          }} />
        </div>
      )}
      
      {/* 컨트롤 버튼 */}
      <div 
        className="timer-controls"
        style={{
          display: 'flex',
          gap: '12px',
          opacity: 0.7,
          transition: 'opacity 0.2s'
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.opacity = '0.7';
        }}
      >
        <button
          onClick={handleStart}
          disabled={timerData.isRunning}
          style={{
            width: '24px',
            height: '24px',
            border: 'none',
            borderRadius: '50%',
            cursor: timerData.isRunning ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            background: timerData.isRunning ? '#6c757d' : '#28a745',
            color: 'white',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            if (!timerData.isRunning) {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          }}
        >
          ▶
        </button>
        
        <button
          onClick={handleStop}
          disabled={!timerData.isRunning}
          style={{
            width: '24px',
            height: '24px',
            border: 'none',
            borderRadius: '50%',
            cursor: !timerData.isRunning ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            background: !timerData.isRunning ? '#6c757d' : '#dc3545',
            color: 'white',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            if (timerData.isRunning) {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          }}
        >
          ⏹
        </button>
      </div>
    </div>
  );
};

export default Timer;