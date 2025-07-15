# GitHub OAuth 설정 가이드

## 1. GitHub OAuth App 생성

1. GitHub에 로그인 후 Settings > Developer settings > OAuth Apps로 이동
2. "New OAuth App" 클릭
3. 다음 정보 입력:
   - **Application name**: `My Electron App`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `https://dwiectwmmngdmxxeoglb.supabase.co/auth/v1/callback`
4. "Register application" 클릭
5. Client ID와 Client Secret 복사

## 2. Supabase GitHub 프로바이더 설정

1. Supabase 대시보드 로그인
2. Authentication > Providers로 이동
3. GitHub 프로바이더 찾아서 활성화
4. GitHub에서 복사한 Client ID와 Client Secret 입력
5. "Save" 클릭

## 3. 현재 설정 확인

현재 Redirect URI가 `electron-app://auth/callback`으로 설정되어 있는데, 
이는 Electron 앱 내에서만 작동합니다.

GitHub OAuth App의 Authorization callback URL을 다음으로 수정해야 합니다:
```
https://dwiectwmmngdmxxeoglb.supabase.co/auth/v1/callback
```

## 4. 테스트 방법

1. 웹 브라우저에서 직접 테스트:
   ```
   https://dwiectwmmngdmxxeoglb.supabase.co/auth/v1/authorize?provider=github
   ```

2. 정상 작동하면 GitHub 로그인 페이지로 리디렉션됩니다.

## 5. Electron 앱용 최종 설정

Electron 앱에서 사용하려면 추가 설정이 필요합니다:
- 웹 브라우저에서 인증 후 결과를 Electron으로 전달하는 방식
- 또는 Custom URL Scheme 등록