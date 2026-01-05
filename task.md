# 1. 회원가입/로그인 기능 구현

## 완료된 내용 요약

- ✅ 회원가입: 통합 폼(일반/매니저 체크) + 간편로그인 탭, 입력값 유지, 약관 동의 검증, zod 한국어 메시지, 이메일 중복/인증 미완료 오류 분기, 이메일 인증 메일 템플릿 추가(`supabase/email-templates/confirm-signup.html`), signUp 시 `emailRedirectTo=/auth/callback`.
- ✅ 로그인: 통합 폼 + 간편로그인 섹션, 입력값 유지, 이메일 미인증 시 안내, 에러 메시지 한국어화.
- ✅ 콜백: `/auth/callback`에서 code/token_hash 세션 교환 후 성공 시 `/post`, 실패 시 `/auth/login` 리다이렉트, 로딩/에러 UI.
- ✅ Supabase 클라이언트: server/client/middleware 환경변수 검증, `cookies()` async 호출로 경고 해결.

## 후속 필요 사항

- ❌ 매니저 프로필/회사 추가·승인 플로우(별도 구현 필요).
- ❌ 소셜 로그인 실제 연동(Supabase OAuth 설정 및 액션 추가).

# 2. 프로필 관리 기능 구현/변경 요약

## 완료된 내용

- ✅ 프로필 페이지 로직/상태를 커스텀 훅으로 분리: `useProfile`(비즈니스 로직/상태), `useUpload`(이미지 업로드/삭제).
- ✅ UI 컴포넌트 분리: 경력/서류/자격증/어학 섹션을 `app/(service)/profile/components/*Section.tsx`로 모듈화.
- ✅ 프로필 저장/자동 저장: Supabase `auth.updateUser` 기반, 이미지 업로드/삭제 시 스토리지 `profiles` 버킷 사용, 파일명 ASCII sanitize.
- ✅ 역할/인증 동기화: Zustand `useUserStore`로 role 전역 관리, `HeaderNav`/`profile/page`에서 스토어 구독.
- ✅ 필수 정보 누락 안내: 회원/매니저별 필수 필드 부족 시 경고 배너 노출.
- ✅ 역할별 UI: 관리자(admin)는 기본 표시만, 매니저는 회사 인증 상태, 멤버는 서류/경력/어학/자격증 입력 유지.
- ✅ 입력 UX: 저장 버튼 위치 조정(성격/특징 아래), 추가 버튼 즉시 저장(경력/서류/자격증/어학), 프로필 이미지 fallback(이름 첫 글자).

## 변경/리팩터링 사항

- ♻️ 페이지 내 중복 상태/로직 제거 → `useProfile`, `useUpload`로 이동.
- ♻️ 중복 섹션 코드를 분리해 재사용 가능 컴포넌트로 관리.
- ♻️ Supabase auth 유저 로드 중복 호출 최소화(스토어 활용) 및 async `cookies()` 문제 해결.
- ♻️ 불필요 아이콘/임포트 정리로 번들 크기 축소.

## 남은 과제/주의

- ❌ 매니저 회사 인증(상태 변경/승인 플로우) 백엔드 로직 미완.
- ❌ 소셜 로그인 실서비스 연동(현재 UI만 존재).
- ⚠️ 스토리지/RLS 정책은 `profiles` 버킷 기준으로 설정되어야 함(환경 재확인 필요).
- ⚠️ 기존 auth.user 메타데이터와 public.user_profiles 테이블 간 동기/백필은 추가 점검 필요.
