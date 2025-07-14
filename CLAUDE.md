# 시스템 모니터링 앱 프로젝트 구조

## 프로젝트 개요
Electron 기반 시스템 활동 모니터링 앱으로, 사용자의 앱 사용 시간을 추적하고 플로팅 타이머로 기록을 제어합니다.

## 현재 구조

### 메인 프로세스 (src/main.ts)
- **메인 창**: 상세 모니터링 정보 표시
- **플로팅 타이머 창**: 항상 최상단에 표시되는 타이머 컨트롤
- **자동 업데이트**: GitHub 릴리즈 기반 업데이트 시스템
- **활동 모니터링**: 앱 사용시간 추적 및 로그 저장

### 렌더러 프로세스 구조
```
src/renderer/
├── index.tsx              # 메인 앱 진입점
├── index.html             # 메인 창 HTML
├── Timer.tsx              # 플로팅 타이머 컴포넌트 (React)
├── timer-index.tsx        # 타이머 진입점
├── timer.html             # 타이머 창 HTML (컨테이너)
├── App.tsx                # 메인 앱 컴포넌트
├── hooks/
│   ├── useUsageMonitoring.ts    # 사용량 모니터링 훅
│   └── useAutoUpdater.ts        # 자동 업데이트 훅
└── components/
    └── UpdateNotification.tsx   # 업데이트 알림 컴포넌트
```

**파일 역할:**
- `timer.html`: 타이머 창의 HTML 컨테이너 (최소한의 구조)
- `Timer.tsx`: 실제 타이머 UI 로직 (React 컴포넌트)
- `timer-index.tsx`: 타이머 컴포넌트를 DOM에 렌더링

### 데이터 저장 형식
```json
{
  "title": "활성 창 제목",
  "app": "애플리케이션 이름", 
  "url": "URL (옵션)",
  "duration": 123,
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## 주요 기능

### 1. 플로팅 타이머
- 화면 오른쪽 상단에 고정
- 드래그 가능한 투명 창
- 시작/중지/리셋 버튼
- 타이머 동작 시 자동으로 모니터링 시작

### 2. 시스템 모니터링
- 활성 창 추적 (앱명, 제목, URL)
- 사용 시간 계산 (초 단위)
- 5초 간격으로 활동 수집
- 100개 항목마다 자동 저장

### 3. 자동 업데이트
- GitHub 릴리즈 기반
- 앱 시작 시 자동 확인
- 다운로드 진행률 표시
- 설치 후 자동 재시작

## 개발 명령어

### 개발 서버 실행
```bash
cd my-electron-app
npm run dev
```

### 빌드
```bash
npm run build
```

### 릴리즈 배포
```bash
# 버전 업데이트
npm version patch

# 태그 푸시 (GitHub Actions 자동 빌드)
git push origin main --tags
```

## 파일 구조 세부사항

### 윈도우 설정
- **메인 창**: 800x600, 일반 윈도우
- **타이머 창**: 200x80, 프레임 없음, 항상 최상단, 투명

### IPC 통신
- 모니터링: `start-monitoring`, `stop-monitoring`
- 타이머: `start-timer`, `stop-timer`, `reset-timer`
- 업데이트: `check-for-updates`, `download-update`

### 로그 저장 경로
```
{userData}/logs/
├── activity-log-{timestamp}.json
└── user-log-{timestamp}.json
```

## 다음 개발 계획
1. 플로팅 타이머를 React 컴포넌트로 구현
2. 타이머와 모니터링 시스템 통합
3. 사용자 인터페이스 개선
4. 통계 및 분석 기능 추가