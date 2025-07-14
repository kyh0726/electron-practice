# 구글 OAuth 설정 가이드

이 가이드에 따라 Supabase에서 구글 OAuth를 설정하고 앱에서 구글 로그인을 사용할 수 있습니다.

## 1. Google Cloud Console 설정

### 1.1 프로젝트 생성
1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트를 생성하거나 기존 프로젝트 선택

### 1.2 OAuth 2.0 클라이언트 ID 생성
1. **APIs & Services > Credentials**로 이동
2. **+ CREATE CREDENTIALS > OAuth client ID** 클릭
3. **Application type**: Web application 선택
4. **Name**: 적절한 이름 입력 (예: "My Electron App")
5. **Authorized redirect URIs**에 다음 추가:
   ```
   https://agsrumeaczdydskvqxlr.supabase.co/auth/v1/callback
   ```
6. **CREATE** 클릭
7. **Client ID**와 **Client Secret** 복사 (나중에 사용)

## 2. Supabase 설정

### 2.1 Authentication 설정
1. [Supabase Dashboard](https://app.supabase.com)에서 프로젝트 선택
2. **Authentication > Settings**로 이동
3. **Site URL** 설정:
   - Development: `http://localhost:8080`
   - Production: 실제 앱 URL

### 2.2 Google Provider 활성화
1. **Authentication > Providers**로 이동
2. **Google** 클릭
3. **Enable sign in with Google** 토글 활성화
4. Google Cloud Console에서 복사한 정보 입력:
   - **Client ID**: Google OAuth Client ID
   - **Client Secret**: Google OAuth Client Secret
5. **Save** 클릭

## 3. 앱 설정

### 3.1 현재 구현된 기능
- ✅ 구글 OAuth 로그인만 제공
- ✅ 이메일/비밀번호 로그인 제거됨
- ✅ 간단한 UI (구글 로그인 버튼만)
- ✅ 자동 계정 생성
- ✅ 세션 관리

### 3.2 사용 방법
1. 앱 실행
2. "Google로 로그인" 버튼 클릭
3. 브라우저에서 구글 계정 선택
4. 권한 승인
5. 자동으로 앱으로 돌아와 로그인 완료

## 4. 개발 시 주의사항

### 4.1 Redirect URI
- 개발 환경: `http://localhost:8080`
- 프로덕션: 실제 도메인으로 변경 필요

### 4.2 CORS 설정
- Supabase에서 앱 도메인이 허용되어 있는지 확인
- 로컬 개발 시 `localhost:8080` 허용

### 4.3 OAuth 스코프
현재 설정된 스코프:
- `email`: 이메일 주소 접근
- `profile`: 기본 프로필 정보 접근

## 5. 문제 해결

### 5.1 OAuth 오류
- **redirect_uri_mismatch**: Google Cloud Console의 Redirect URI 확인
- **unauthorized_client**: Client ID/Secret 다시 확인
- **access_denied**: 사용자가 권한을 거부한 경우

### 5.2 Supabase 연결 오류
- 네트워크 연결 확인
- Supabase URL과 Anon Key 확인
- RLS 정책 설정 확인

### 5.3 세션 관리
- 브라우저 쿠키/로컬스토리지 확인
- 세션 만료 시 자동 갱신 처리

## 6. 보안 고려사항

1. **Client Secret 보호**: 프로덕션에서 환경 변수 사용
2. **HTTPS 사용**: 프로덕션에서 반드시 HTTPS 사용
3. **스코프 최소화**: 필요한 권한만 요청
4. **토큰 관리**: Supabase가 자동으로 처리

## 7. 추가 개선 사항

향후 추가할 수 있는 기능:
- 다른 소셜 로그인 (GitHub, Facebook 등)
- 프로필 정보 더 자세히 활용
- 오프라인 접근 권한
- 사용자 역할 관리

이제 구글 계정으로 간편하게 로그인할 수 있습니다!