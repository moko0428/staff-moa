# 현장 관리 기능 (Feature: Event)

## 개요

워커의 현장 출퇴근·이동 상태 관리, 매니저의 스탭 포지션 배정, 도착 인증 코드 시스템을 구현한다.

---

## 1. DB 마이그레이션 — member_schedules 현장 관리 컬럼 추가

**파일:** `app/sql/migrations/0019_outgoing_vengeance.sql`

`member_schedules` 테이블에 현장 관리용 컬럼 추가. 기존에 일부 컬럼은 Supabase 대시보드에서 직접 추가되었으나 `movement_status`, `checked_out_at`이 누락되어 있었고, `posts` 테이블의 `event_positions`, `manual_staff`도 미적용 상태였음.

| 테이블 | 추가 컬럼 |
|--------|-----------|
| `member_schedules` | `staff_status`, `assigned_role`, `checkin_status`, `checked_in_at`, `arrived_at`, `manager_memo`, `movement_status`, `checked_out_at` |
| `posts` | `event_positions`, `manual_staff` |

- `IF NOT EXISTS` 패턴으로 idempotent하게 작성 (중복 실행 안전)
- `push_subscriptions` 테이블, `event_briefing` enum 값도 동일 마이그레이션에 포함

---

## 2. 워커 — 내 현장 페이지 (`/worker/my-event`)

**파일:**
- `app/(protected)/worker/my-event/page.tsx`
- `app/(protected)/worker/my-event/actions.ts`
- `app/(protected)/worker/my-event/components/MyEventClient.tsx`
- `app/(protected)/worker/my-event/components/QrScanModal.tsx`
- `app/(protected)/worker/my-event/utils/arrivalCode.ts` → `@/lib/arrivalCode` re-export

### 주요 기능
- 승인된 스케줄 목록 조회 (`getMyEventsAction`)
- 이동 상태 자기 변경: 출발 / 도착 (`updateMyMovementAction`)
- 도착 인증 코드 검증 (`verifyArrivalCodeAction`)
  - QR 스캔(BarcodeDetector API) + 6자리 코드 직접 입력 두 가지 방식 지원
  - BarcodeDetector 미지원 환경은 코드 탭으로 자동 전환
- 도착 인증 모달(`QrScanModal`) X 버튼 중복 제거: `showCloseButton={false}` 적용

---

## 3. 도착 인증 코드 — 공용 유틸 분리

**파일:** `lib/arrivalCode.ts` (신규)

```typescript
export function generateDailyCode(postId: number): string
```

- `postId + UTC 날짜` 기반 결정론적 해시 → 6자리 코드
- DB 저장 없이 서버·클라이언트 동일 값 생성
- 자정(UTC)마다 자동 갱신
- 기존 위치(`worker/my-event/utils/arrivalCode.ts`)는 re-export로 교체
- `worker/my-event/actions.ts` import 경로 `@/lib/arrivalCode`로 통일

---

## 4. 매니저 현장 관리 — 도착 코드 상시 표시

**파일:** `app/(protected)/manager/event/components/EventRosterClient.tsx`

- 메타 정보 줄(위치·인원 옆)에 당일 도착 코드 칩 추가
- `isTodayEvent(work_slots)` 헬퍼: 오늘 날짜가 `work_slots`에 포함될 때만 표시
- `generateDailyCode(post_id)` → `@/lib/arrivalCode` 에서 import
- `KeyRound` 아이콘 사용

---

## 5. 매니저 현장 관리 — 포지션 배정 저장 버그 수정

**파일:** `app/(protected)/manager/event/actions.ts`

### 문제
`member_schedules` RLS 정책이 워커 본인만 UPDATE 가능하도록 설정된 경우, 매니저의 UPDATE 호출이 에러 없이 0건 업데이트로 통과됨. 클라이언트는 성공으로 인식하지만 DB에 실제 저장되지 않아 새로고침 시 미배정으로 초기화되는 silent failure 버그.

### 수정
소유권 검증(`verifyManagerOwnsSchedule`)은 user 세션 클라이언트로 유지하고, 실제 `update()` 호출만 서비스 롤 클라이언트로 교체하여 RLS 우회.

대상 함수:
- `updateStaffPositionAction` — 포지션(역할) 배정
- `updateMovementStatusAction` — 이동/출퇴근 상태 변경
- `updateStaffMemoAction` — 메모 저장

---

## 6. 네비게이션 — 워커 내 현장 메뉴 추가

**파일:** `app/components/HeaderNav.tsx`

- 데스크탑 네비게이션: "내 현장" 링크 (`/worker/my-event`) 추가
- 모바일 드롭다운: `MapPin` 아이콘과 함께 "내 현장" 메뉴 추가
