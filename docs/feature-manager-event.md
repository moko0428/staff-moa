# 현장 관리 (Manager Event OS)

매니저가 행사 당일 현장 인원을 운영하는 기능. 공고 선택 → 확정 인원 명단 확인 → 역할 배정 → 상태 추적 → 브리핑 발송 흐름을 지원한다.

---

## 라우트

| 경로 | 설명 |
|------|------|
| `/manager/event` | 현장 관리 메인 (EventRosterClient) |
| `/worker/checkin?postId=:id` | 워커 QR 체크인 페이지 |

---

## 파일 구조

```
app/(protected)/manager/event/
├── page.tsx                          # 서버 컴포넌트, getEventRosterAction 호출
├── actions.ts                        # 서버 액션 전체
└── components/
    └── EventRosterClient.tsx         # 클라이언트 UI

app/(protected)/worker/checkin/
├── page.tsx                          # Suspense 래핑된 QR 체크인 화면
└── actions.ts                        # workerCheckinAction (updateMovementStatusAction 래핑)
```

---

## DB 스키마 변경

### `member_schedules` 추가 컬럼

```sql
ALTER TABLE member_schedules
  ADD COLUMN IF NOT EXISTS staff_status     text NOT NULL DEFAULT 'waiting'
    CHECK (staff_status IN ('waiting', 'assigned')),
  ADD COLUMN IF NOT EXISTS assigned_role    text,
  ADD COLUMN IF NOT EXISTS checkin_status   text NOT NULL DEFAULT 'not_checked'
    CHECK (checkin_status IN ('not_checked', 'checked_in')),
  ADD COLUMN IF NOT EXISTS checked_in_at    timestamptz,
  ADD COLUMN IF NOT EXISTS arrived_at       timestamptz,
  ADD COLUMN IF NOT EXISTS manager_memo     text,
  ADD COLUMN IF NOT EXISTS movement_status  text
    CHECK (movement_status IS NULL OR movement_status IN
      ('departing', 'arrived', 'checked_in', 'checked_out')),
  ADD COLUMN IF NOT EXISTS checked_out_at   timestamptz;

-- 기존 checkin_status 데이터 이전
UPDATE member_schedules
  SET movement_status = 'checked_in'
  WHERE checkin_status = 'checked_in' AND movement_status IS NULL;

-- 레거시 'departing' staff_status 정리
UPDATE member_schedules SET staff_status = 'waiting' WHERE staff_status = 'departing';
```

### `posts` 추가 컬럼

```sql
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS event_positions  text[]        NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS manual_staff     jsonb         NOT NULL DEFAULT '[]';
```

### `notification_type` enum 추가

```sql
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'event_briefing';
```

---

## 상태 모델

### 포지션 (`staff_status` 컬럼)

역할명(assigned_role) 배정 여부에 따라 자동 결정. 매니저가 직접 토글 불가.

| 값 | 표시 | 색상 | 조건 |
|----|------|------|------|
| `waiting` | 대기 | 회색 | 역할 미배정 |
| `assigned` | 배치완료 | 초록 | 역할 배정됨 |

### 이동 상태 (`movement_status` 컬럼)

배지로만 표시 (읽기 전용 — 매니저가 카드에서 직접 변경 불가).

| 값 | 표시 | 색상 | 변경 주체 |
|----|------|------|----------|
| `departing` | 출발 | 황색 | 워커 (미구현, Phase 3) |
| `arrived` | 도착 | 파랑 | 워커 (미구현, Phase 3) |
| `checked_in` | 출근 | 초록 | 매니저 QR |
| `checked_out` | 퇴근 | 회색 | 매니저 QR |

`checkedIn` (UI 파생값) = `movement_status === 'checked_in' || 'checked_out'` || 레거시 `checkin_status === 'checked_in'`

---

## 서버 액션 (`actions.ts`)

| 액션 | 설명 |
|------|------|
| `getEventRosterAction()` | 매니저 공고 전체 + 확정 참가자 조회. 신규 컬럼 없으면 기본 쿼리로 폴백 |
| `saveManualStaffAction(postId, records)` | 수동 추가 스탭 JSONB 저장 (`posts.manual_staff`) |
| `saveEventPositionsAction(postId, positions)` | 행사 역할 목록 저장 (`posts.event_positions`) |
| `updateStaffPositionAction(scheduleId, role)` | 역할명 변경 + `staff_status` 자동 설정 |
| `updateMovementStatusAction(scheduleId, status)` | 이동 상태 변경 + 타임스탬프 자동 기록 |
| `updateStaffMemoAction(scheduleId, memo)` | 매니저 메모 저장 |
| `sendEventBriefingAction(postId, title, message, targetIds?)` | `event_briefing` 알림 대량 발송 |
| `updateStaffCheckinAction(scheduleId)` | `updateMovementStatusAction('checked_in')` 래핑 (레거시 호환) |
| `updatePositionStateAction(scheduleId, state)` | `staff_status` 직접 변경 (현재 UI에서 미사용, 내부용) |
| `getRosterEventsAction()` | 이벤트 목록 + 일정 상태 (upcoming/ongoing/completed) 조회 |

---

## UI 주요 패턴

### Optimistic Update + 백그라운드 서버 동기화

모든 상태 변경은 로컬 state를 먼저 업데이트하고, 서버 액션은 비동기로 실행. 실패 시 toast.error 표시.

```ts
updateStaff(id, { positionState: 'assigned' });  // 즉시 UI 반영
updateStaffPositionAction(id, role).then(r => {   // 백그라운드 저장
  if (!r.ok) toast.error('역할 저장 실패');
});
```

### 수동 스탭 자동 저장 (디바운스 1초)

`posts.manual_staff` JSONB에 자동 저장. JSON 비교로 불필요한 저장 방지.

### 메모 자동 저장 (디바운스 1.2초)

`member_schedules.manager_memo`에 자동 저장.

### 폴백 쿼리

`event_positions`, `manual_staff`, `movement_status` 컬럼이 없는 환경(SQL 마이그레이션 전)에서도 기본 공고/참가자 목록은 정상 표시.

---

## 알림 (`event_briefing`)

- 타입: `event_briefing`
- 아이콘: `MapPin` (violet)
- `createBulkNotificationsAction` 활용
- 전체 발송 또는 선택된 멤버만 발송 지원

---

## 미구현 (Phase 3)

- **워커 자기 상태 변경**: 워커가 직접 `departing` / `arrived` 설정
- ~~**실시간 현황판**: Supabase Realtime + `member_schedules` postgres_changes 구독~~ ✅ 완료
- **워커 자기 체크인 코드**: TTL 기반 6자리 코드로 `checked_in` 자동 처리
