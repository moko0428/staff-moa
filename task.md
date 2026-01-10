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

# 다음 할 일

포스트 해야됨!

- 매니저로 로그인 했는데 아! 아직 승인되지 않아서 새 게시물 작성 버튼이 안보이는 건가봄!

# 3. 매니저 승인 관리 기능 구현

## 완료된 내용

- ✅ 매니저 승인 관리 탭: 관리자 페이지에 "매니저 승인 관리" 탭 추가, `user_profiles`에서 `role='pending_manager'` + `company_verify_status in (null, 'pending')`인 유저만 목록 노출.
- ✅ 승인/거절 기능: 승인 시 `role='manager'`, `company_verify_status='approved'`로 업데이트, 거절 시 `role='pending_manager'` 유지 + `company_verify_status='rejected'`로 설정.
- ✅ 프로필 입력 완료도 표시: 각 매니저 카드에 전화번호/카카오ID/회사명/사업자번호/인증파일 필수 항목을 체크/✕ 아이콘으로 표시.
- ✅ 재요청 기능: 거절된 매니저가 프로필 페이지에서 재요청 버튼으로 `company_verify_status='pending'`으로 복구 가능.
- ✅ 역할별 접근 제어:
  - `pending_manager`: 프로필 관리 접근 가능, 매니저 전용 서비스 페이지(내 공고/지원자 관리/스케줄 관리) 접근 시 안내 메시지 표시.
  - `manager`: 모든 매니저 기능 접근 가능.
- ✅ 헤더 네비게이션: `pending_manager`도 매니저 메뉴(내 공고/지원자 관리/스케줄 관리) 표시, 실제 접근 시 페이지에서 제한.
- ✅ `/post` 페이지: 게시물 작성 버튼은 `role='manager'`일 때만 표시, `pending_manager`는 숨김.
- ✅ 회원 관리 탭: `user_profiles`에서 `role != 'admin'`인 유저 목록 조회, 아바타/이름/이메일/role 뱃지 표시, `member`인 경우 근태점수 배지 추가, 이름/이메일 검색 필터.

## 변경/리팩터링 사항

- ♻️ 회원가입 시 매니저 선택 → `role='pending_manager'`, `company_verify_status='pending'`로 저장.
- ♻️ `UserRole` 타입에 `pending_manager` 추가, 관련 타입/스토어 업데이트.
- ♻️ 프로필 페이지에서 `user_profiles` 테이블 우선 조회하여 role/company_verify_status 등 신뢰성 확보.
- ♻️ 관리자 승인/거절 액션을 서버 액션(`manager-actions.ts`)으로 분리, 서비스 롤 키 사용(RLS 우회).
- ♻️ 매니저 전용 페이지에 `roleHydrated` 확인 후 접근 제어하여 새로고침 시 깜빡임 방지.

## 남은 과제/주의

- ⚠️ `auth.users` 메타데이터 동기화는 서비스 롤 키가 설정되어야 정상 동작(현재는 실패 시 조용히 패스).
- ⚠️ `user_profiles.role` 체크 제약에 `pending_manager` 포함 필요(이미 적용됨).

# 4. Posts 테이블 스키마 변경

## 완료된 내용

- ✅ `work_slots` jsonb 컬럼 추가: 여러 날짜/시간/급여 묶음을 배열로 관리.
- ✅ `pay_type` 컬럼: `hourly`/`daily`/`weekly`/`monthly` 값 제한(체크 제약), NOT NULL, default 'hourly'.
- ✅ `tax_withholding` boolean 컬럼: 3.3% 공제 여부 관리.
- ✅ 기존 단일 컬럼 데이터를 `work_slots` 배열로 백필 완료.

## 남은 과제/주의

- ❌ 공고 작성 UI에서 `work_slots` 기반 다중 날짜/시간/급여 입력 폼 구현 필요.
- ❌ 스케줄/급여 페이지에서 `work_slots` 배열을 파싱하여 이벤트/금액 계산 로직 구현 필요.
