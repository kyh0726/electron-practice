import React, { useState, useEffect } from 'react';

interface TimerData {
  isRunning: boolean;
  elapsedTime: number;
  formattedTime: string;
}

const Timer: React.FC = () => {
  const [timerData, setTimerData] = useState<TimerData>({
    isRunning: false,
    elapsedTime: 0,
    formattedTime: '00:00'
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
      window.electronAPI.stopTimer();
    }
  };

  const handleReset = () => {
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
        height: '80px',
        padding: '0 10px',
        margin: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: 'rgba(0, 0, 0, 0.8)',
        borderRadius: '10px',
        color: 'white',
        cursor: 'move',
        userSelect: 'none',
        boxSizing: 'border-box'
      }}
    >
      <div 
        className="timer-display"
        style={{
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '5px',
          textAlign: 'center',
          fontFamily: '"Courier New", monospace'
        }}
      >
        {timerData.formattedTime}
      </div>
      
      <div 
        className="timer-controls"
        style={{
          display: 'flex',
          gap: '5px',
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
            width: '20px',
            height: '20px',
            border: 'none',
            borderRadius: '50%',
            cursor: timerData.isRunning ? 'not-allowed' : 'pointer',
            fontSize: '10px',
            fontWeight: 'bold',
            background: '#28a745',
            color: 'white',
            opacity: timerData.isRunning ? 0.5 : 1,
            transition: 'all 0.2s'
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
            width: '20px',
            height: '20px',
            border: 'none',
            borderRadius: '50%',
            cursor: !timerData.isRunning ? 'not-allowed' : 'pointer',
            fontSize: '10px',
            fontWeight: 'bold',
            background: '#dc3545',
            color: 'white',
            opacity: !timerData.isRunning ? 0.5 : 1,
            transition: 'all 0.2s'
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
          ⏸
        </button>
        
        <button
          onClick={handleReset}
          disabled={timerData.isRunning}
          style={{
            width: '20px',
            height: '20px',
            border: 'none',
            borderRadius: '50%',
            cursor: timerData.isRunning ? 'not-allowed' : 'pointer',
            fontSize: '10px',
            fontWeight: 'bold',
            background: '#6c757d',
            color: 'white',
            opacity: timerData.isRunning ? 0.5 : 1,
            transition: 'all 0.2s'
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
          ⏹
        </button>
      </div>
    </div>
  );
};

export default Timer;