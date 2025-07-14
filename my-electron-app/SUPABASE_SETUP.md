# Supabase 인증 설정 가이드

이 앱은 Supabase를 사용하여 사용자 인증과 프로필 관리를 제공합니다.

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에서 계정을 만들고 새 프로젝트를 생성하세요.
2. 프로젝트 대시보드에서 **Settings > API**로 이동하세요.
3. 다음 정보를 복사해두세요:
   - **Project URL**: `https://your-project.supabase.co`
   - **Anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 2. 데이터베이스 스키마 설정

1. Supabase 대시보드에서 **SQL Editor**로 이동하세요.
2. `supabase-schema.sql` 파일의 내용을 복사하여 실행하세요.
3. 이렇게 하면 다음이 생성됩니다:
   - `profiles` 테이블: 사용자 프로필과 설정 저장
   - Row Level Security (RLS) 정책: 사용자별 데이터 보안
   - 자동 프로필 생성 트리거

## 3. 환경 변수 설정

1. 프로젝트 루트에 `.env` 파일을 생성하세요:

```bash
# .env 파일
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

2. `.env` 파일을 `.gitignore`에 추가하여 공개되지 않도록 하세요.

## 4. 인증 설정

1. Supabase 대시보드에서 **Authentication > Settings**로 이동하세요.
2. **Site URL**을 앱의 URL로 설정하세요 (개발 시: `http://localhost:8080`)
3. 필요한 경우 **Email Templates**를 커스터마이징하세요.

## 5. 앱 기능

### 회원가입/로그인
- 이메일과 비밀번호로 회원가입
- 기존 계정으로 로그인
- 비밀번호 재설정

### 사용자 프로필
- 이름 및 개인 설정 저장
- 포모도로 타이머 설정 (작업/휴식 시간)
- 알림 및 자동 시작 설정

### 데이터 보안
- Row Level Security로 사용자별 데이터 격리
- JWT 토큰 기반 인증
- 안전한 API 통신

## 6. 개발 시 주의사항

1. **환경 변수**: `.env` 파일이 올바르게 설정되어 있는지 확인하세요.
2. **CORS**: Supabase 프로젝트 설정에서 앱의 도메인이 허용되어 있는지 확인하세요.
3. **RLS**: 데이터베이스 정책이 올바르게 설정되어 있는지 확인하세요.

## 7. 문제 해결

### 연결 오류
- 환경 변수가 올바른지 확인
- Supabase 프로젝트가 활성화되어 있는지 확인

### 인증 실패
- 이메일 확인이 완료되었는지 확인
- 비밀번호가 최소 6자 이상인지 확인

### 데이터 접근 오류
- RLS 정책이 올바르게 설정되어 있는지 확인
- 사용자가 로그인되어 있는지 확인

## 8. 추가 기능 개발

이 기본 설정을 바탕으로 다음과 같은 기능을 추가할 수 있습니다:

- 소셜 로그인 (Google, GitHub 등)
- 이메일 인증 강화
- 2FA (Two-Factor Authentication)
- 사용자 역할 관리
- 활동 로그 저장
- 팀 및 공유 기능

더 자세한 정보는 [Supabase 문서](https://supabase.com/docs)를 참조하세요.