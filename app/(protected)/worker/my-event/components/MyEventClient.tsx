'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Calendar,
  Car,
  Check,
  CheckCheck,
  Clock,
  MapPin,
  Navigation,
  RefreshCw,
  Tag,
  Users,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import type { MyEvent, MyEventMovementStatus } from '../actions';
import { updateMyMovementAction } from '../actions';
import QrScanModal from './QrScanModal';

// ── 설정 ──────────────────────────────────────────────────────────────

const MOVEMENT_CONFIG: Record<
  MyEventMovementStatus,
  { label: string; dot: string; badge: string }
> = {
  departing: {
    label: '출발',
    dot: 'bg-amber-400',
    badge:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
  },
  arrived: {
    label: '도착',
    dot: 'bg-blue-400',
    badge:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
  },
  checked_in: {
    label: '출근',
    dot: 'bg-emerald-400',
    badge:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
  },
  checked_out: {
    label: '퇴근',
    dot: 'bg-gray-400',
    badge:
      'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
  },
};

const SCHEDULE_STATUS_CONFIG = {
  upcoming: { label: '예정', dot: 'bg-blue-400' },
  ongoing: { label: '진행중', dot: 'bg-emerald-400' },
  completed: { label: '종료', dot: 'bg-gray-400' },
};

// ── 헬퍼 ──────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(dateStr));
}

function isoToHHmm(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getTodayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isEventDay(event: MyEvent): boolean {
  return event.slot_dates.includes(getTodayDateStr());
}

function getScheduleStatus(
  event: MyEvent,
): 'upcoming' | 'ongoing' | 'completed' {
  if (!event.slot_dates.length) return 'upcoming';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sorted = [...event.slot_dates].sort();
  const first = new Date(sorted[0]);
  first.setHours(0, 0, 0, 0);
  const last = new Date(sorted[sorted.length - 1]);
  last.setHours(0, 0, 0, 0);
  if (today < first) return 'upcoming';
  if (today <= last) return 'ongoing';
  return 'completed';
}

const SCHEDULE_SORT_ORDER = { today: 0, upcoming: 1, completed: 2 };

function getEventSortKey(event: MyEvent): number {
  const todayStr = getTodayDateStr();
  if (event.slot_dates.includes(todayStr)) return SCHEDULE_SORT_ORDER.today;
  const status = getScheduleStatus(event);
  if (status === 'completed') return SCHEDULE_SORT_ORDER.completed;
  return SCHEDULE_SORT_ORDER.upcoming;
}

function sortEvents(events: MyEvent[]): MyEvent[] {
  return [...events].sort((a, b) => {
    const diff = getEventSortKey(a) - getEventSortKey(b);
    if (diff !== 0) return diff;
    // 같은 그룹 내에서는 가장 빠른 날짜 기준 정렬
    const aDate = a.slot_dates[0] ?? '';
    const bDate = b.slot_dates[0] ?? '';
    return aDate.localeCompare(bDate);
  });
}

// ── 메인 ──────────────────────────────────────────────────────────────

export default function MyEventClient({ events }: { events: MyEvent[] }) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const sortedEvents = sortEvents(events);

  // 당일 행사가 있으면 자동 선택, 없으면 첫 번째 행사
  const defaultId =
    sortedEvents.length > 0 ? sortedEvents[0].member_schedule_id : '';
  const [selectedId, setSelectedId] = useState(defaultId);

  // 선택된 행사의 이동 상태 (optimistic)
  const [movementOverride, setMovementOverride] = useState<
    Record<string, MyEventMovementStatus | null>
  >({});
  const [arrivedAtOverride, setArrivedAtOverride] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(false);
  const [showArrivalModal, setShowArrivalModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkedInAtOverride, setCheckedInAtOverride] = useState<Record<string, string>>({});

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <Users className="size-10 mb-3 opacity-20" />
        <p className="text-sm">참여 확정된 행사가 없습니다</p>
        <p className="text-xs mt-1 opacity-60">
          공고에 지원하고 승인을 기다려주세요
        </p>
      </div>
    );
  }

  const event =
    sortedEvents.find((e) => e.member_schedule_id === selectedId) ??
    sortedEvents[0];
  const scheduleStatus = getScheduleStatus(event);
  const scheduleCfg = SCHEDULE_STATUS_CONFIG[scheduleStatus];

  const movementStatus: MyEventMovementStatus | null =
    selectedId in movementOverride
      ? movementOverride[selectedId]
      : event.movement_status;

  const arrivedAt = arrivedAtOverride[selectedId] ?? event.arrived_at;
  const checkedInAt = checkedInAtOverride[selectedId] ?? event.checked_in_at;

  const isEventToday = isEventDay(event);

  const handleMovement = async (status: 'departing' | 'arrived') => {
    setLoading(true);
    setMovementOverride((prev) => ({ ...prev, [selectedId]: status }));
    if (status === 'arrived') {
      setArrivedAtOverride((prev) => ({
        ...prev,
        [selectedId]: new Date().toISOString(),
      }));
    }
    const result = await updateMyMovementAction(
      event.member_schedule_id,
      status,
    );
    setLoading(false);
    if (!result.ok) {
      toast.error(result.message);
      setMovementOverride((prev) => ({
        ...prev,
        [selectedId]: event.movement_status,
      }));
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* 행사 셀렉터 */}
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="행사를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {sortedEvents.map((e) => {
              const isToday = e.slot_dates.includes(getTodayDateStr());
              const st = getScheduleStatus(e);
              const stCfg = SCHEDULE_STATUS_CONFIG[st];
              return (
                <SelectItem
                  key={e.member_schedule_id}
                  value={e.member_schedule_id}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`size-1.5 rounded-full shrink-0 ${isToday ? 'bg-amber-400' : stCfg.dot}`}
                    />
                    {e.title}
                    {isToday && (
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        오늘
                      </span>
                    )}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* 행사 메타 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-base">{event.title}</span>
            <span
              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                scheduleStatus === 'ongoing'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700'
                  : scheduleStatus === 'upcoming'
                    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
                    : 'bg-muted text-muted-foreground border-border'
              }`}
            >
              <span className={`size-1.5 rounded-full ${scheduleCfg.dot}`} />
              {scheduleCfg.label}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5 shrink-0" />
                {event.location}
              </span>
            )}
            {event.work_date && (
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5 shrink-0" />
                {formatDate(event.work_date)}
                {event.slot_dates.length > 1 &&
                  ` 외 ${event.slot_dates.length - 1}일`}
              </span>
            )}
            {(event.work_time_start || event.work_time_end) && (
              <span className="flex items-center gap-1">
                <Clock className="size-3.5 shrink-0" />
                {event.work_time_start} ~ {event.work_time_end}
              </span>
            )}
          </div>
        </div>

        {/* 포지션 + 이동상태 */}
        <div className="flex items-center gap-2 flex-wrap">
          {event.assigned_role ? (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/8 border border-primary/20 text-primary font-medium">
              <Tag className="size-3" />
              {event.assigned_role}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground">
              포지션 미배정
            </span>
          )}
          {movementStatus && (
            <span
              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${MOVEMENT_CONFIG[movementStatus].badge}`}
            >
              <span
                className={`size-1.5 rounded-full shrink-0 ${MOVEMENT_CONFIG[movementStatus].dot}`}
              />
              {MOVEMENT_CONFIG[movementStatus].label}
            </span>
          )}
        </div>

        {/* 타임스탬프 */}
        {(arrivedAt || checkedInAt || event.checked_out_at) && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            {arrivedAt && (
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <Navigation className="size-3" />
                {isoToHHmm(arrivedAt)} 도착
              </span>
            )}
            {checkedInAt && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Check className="size-3" />
                {isoToHHmm(checkedInAt)} 출근
              </span>
            )}
            {event.checked_out_at && (
              <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <Clock className="size-3" />
                {isoToHHmm(event.checked_out_at)} 퇴근
              </span>
            )}
          </div>
        )}

        {/* 이동 상태 액션 */}
        {scheduleStatus !== 'completed' && (
          <div className="pt-1">
            {!movementStatus && (
              <>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    if (!isEventToday) {
                      toast.info('행사 당일이 아닙니다');
                      return;
                    }
                    handleMovement('departing');
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isEventToday
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : 'bg-amber-500 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <Car className="size-4" />
                  출발하기
                </button>
                {!isEventToday && (
                  <p className="text-center text-xs text-muted-foreground mt-1.5">
                    행사 당일에 활성화됩니다
                  </p>
                )}
              </>
            )}
            {movementStatus === 'departing' && (
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowArrivalModal(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                <Navigation className="size-4" />
                도착했어요
              </button>
            )}
            {movementStatus === 'arrived' && (
              <div className="space-y-2">
                <p className="text-center text-xs text-muted-foreground py-2.5 border border-dashed rounded-xl">
                  도착이 확인됐습니다.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCheckinModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors"
                >
                  <CheckCheck className="size-4" />
                  출근 코드 입력
                </button>
              </div>
            )}
            {movementStatus === 'checked_in' && (
              <p className="text-center text-xs text-emerald-600 dark:text-emerald-400 py-2.5 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                출근이 확인됐습니다.
              </p>
            )}
            {movementStatus === 'checked_out' && (
              <p className="text-center text-xs text-muted-foreground py-2.5 border border-dashed rounded-xl">
                수고하셨습니다!
              </p>
            )}
          </div>
        )}
      </div>

      {/* 플로팅 새로고침 */}
      <button
        type="button"
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="fixed bottom-6 right-6 z-40 size-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center disabled:opacity-70"
        aria-label="새로고침"
      >
        <RefreshCw className={`size-5 ${isRefreshing ? 'animate-spin' : ''}`} />
      </button>

      <QrScanModal
        open={showArrivalModal}
        onClose={() => setShowArrivalModal(false)}
        postId={event.post_id}
        memberScheduleId={event.member_schedule_id}
        onVerified={(arrivedAt) => {
          setShowArrivalModal(false);
          setMovementOverride((prev) => ({ ...prev, [selectedId]: 'arrived' }));
          setArrivedAtOverride((prev) => ({
            ...prev,
            [selectedId]: arrivedAt,
          }));
        }}
      />
      <QrScanModal
        mode="checkin"
        open={showCheckinModal}
        onClose={() => setShowCheckinModal(false)}
        postId={event.post_id}
        memberScheduleId={event.member_schedule_id}
        onVerified={(checkedInAt) => {
          setShowCheckinModal(false);
          setMovementOverride((prev) => ({ ...prev, [selectedId]: 'checked_in' }));
          setCheckedInAtOverride((prev) => ({ ...prev, [selectedId]: checkedInAt }));
        }}
      />
    </>
  );
}
