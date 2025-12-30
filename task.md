# 1. 회원가입/로그인 기능 구현

## 완료된 내용 요약

- 회원가입: 통합 폼(일반/매니저 체크) + 간편로그인 탭, 입력값 유지, 약관 동의 검증, zod 한국어 메시지, 이메일 중복/인증 미완료 오류 분기, 이메일 인증 메일 템플릿 추가(`supabase/email-templates/confirm-signup.html`), signUp 시 `emailRedirectTo=/auth/callback`.
- 로그인: 통합 폼 + 간편로그인 섹션, 입력값 유지, 이메일 미인증 시 안내, 에러 메시지 한국어화.
- 콜백: `/auth/callback`에서 code/token_hash 세션 교환 후 성공 시 `/post`, 실패 시 `/auth/login` 리다이렉트, 로딩/에러 UI.
- Supabase 클라이언트: server/client/middleware 환경변수 검증, `cookies()` async 호출로 경고 해결.

## 후속 필요 사항

- 매니저 프로필/회사 추가·승인 플로우(별도 구현 필요).
- 소셜 로그인 실제 연동(Supabase OAuth 설정 및 액션 추가).
