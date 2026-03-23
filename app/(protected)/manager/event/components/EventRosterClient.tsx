'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Bell,
  Check,
  ChevronDown,
  Clock,
  MapPin,
  MessageSquare,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import type { ManualStaffRecord, MovementStatus, PostRoster, RosterParticipant, StaffPosition } from '../actions';
import {
  saveEventPositionsAction,
  saveManualStaffAction,
  sendEventBriefingAction,
  updateMovementStatusAction,
  updateStaffMemoAction,
  updateStaffPositionAction,
} from '../actions';

// ── Types ─────────────────────────────────────────────────────────────

type FilterCheckin = 'all' | 'checked' | 'unchecked';

type StaffEntry = {
  id: string;         // member_schedule_id
  memberId: string;   // member_id (profile id, for notifications)
  name: string;
  phone: string | null;
  avatar: string | null;
  attendanceScore: number | null;
  position: string;             // 역할명 (안내, 주차 등)
  positionState: StaffPosition; // 대기 | 배치완료
  movementStatus: MovementStatus | null; // 출발 | 도착 | 출근 | 퇴근
  checkedIn: boolean;           // movementStatus에서 파생
  checkedInAt: string | null;   // HH:mm
  checkedOutAt: string | null;  // HH:mm
  arrivedAt: string | null;     // HH:mm
  memo: string;
  isManual: boolean;
};

type CoManagerRole = '팀장' | '보조 매니저';

type CoManager = {
  id: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  role: CoManagerRole;
  addedAt: string;
};

// ── Constants ─────────────────────────────────────────────────────────

const POSITION_CONFIG: Record<
  StaffPosition,
  { label: string; dot: string; badge: string; cardBg: string }
> = {
  waiting: {
    label: '대기',
    dot: 'bg-gray-400',
    badge:
      'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    cardBg: '',
  },
  assigned: {
    label: '배치완료',
    dot: 'bg-green-400',
    badge:
      'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
    cardBg: 'bg-green-50/60 dark:bg-green-900/10',
  },
};

const MOVEMENT_CONFIG: Record<
  MovementStatus,
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

const CO_MANAGER_ROLE_COLORS: Record<CoManagerRole, string> = {
  팀장: 'bg-primary/10 text-primary border-primary/20',
  '보조 매니저': 'bg-muted text-muted-foreground border-border',
};

const CO_MANAGER_ROLES: CoManagerRole[] = ['팀장', '보조 매니저'];

// ── Helpers ───────────────────────────────────────────────────────────

function nowHHmm(): string {
  return new Date().toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function isoToHHmm(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatPhone(phone: string | null): string {
  if (!phone) return '';
  return phone.replace(/^(\d{3})(\d{3,4})(\d{4})$/, '$1-$2-$3');
}

function fromParticipant(p: RosterParticipant): StaffEntry {
  const movementStatus = p.movement_status ?? null;
  const checkedIn =
    movementStatus === 'checked_in' ||
    movementStatus === 'checked_out' ||
    p.checkin_status === 'checked_in';
  return {
    id: p.member_schedule_id,
    memberId: p.member_id,
    name: p.name ?? '이름 없음',
    phone: p.phone,
    avatar: p.avatar,
    attendanceScore: p.attendance_score,
    position: p.assigned_role ?? '',
    positionState: p.position_status ?? 'waiting',
    movementStatus,
    checkedIn,
    checkedInAt: isoToHHmm(p.checked_in_at),
    checkedOutAt: isoToHHmm(p.checked_out_at),
    arrivedAt: isoToHHmm(p.arrived_at),
    memo: p.manager_memo ?? '',
    isManual: false,
  };
}

function fromManualStaffRecord(m: ManualStaffRecord): StaffEntry {
  // 레거시 포맷 호환 (구 `status` 필드 → positionState)
  const legacy = m as unknown as { status?: string };
  const positionState: StaffPosition =
    m.positionState ?? (legacy.status === 'assigned' ? 'assigned' : 'waiting');
  const movementStatus = m.movementStatus ?? null;
  const checkedIn =
    movementStatus === 'checked_in' || movementStatus === 'checked_out' || m.checkedIn || false;
  return {
    id: m.id,
    memberId: '',
    name: m.name || '이름 없음',
    phone: m.phone,
    avatar: null,
    attendanceScore: null,
    position: m.position || '',
    positionState,
    movementStatus,
    checkedIn,
    checkedInAt: m.checkedInAt || null,
    checkedOutAt: null,
    arrivedAt: m.arrivedAt || null,
    memo: m.memo || '',
    isManual: true,
  };
}

function toManualStaffRecord(entry: StaffEntry): ManualStaffRecord {
  return {
    id: entry.id,
    name: entry.name,
    phone: entry.phone,
    position: entry.position,
    positionState: entry.positionState,
    movementStatus: entry.movementStatus,
    checkedIn: entry.checkedIn,
    checkedInAt: entry.checkedInAt,
    arrivedAt: entry.arrivedAt,
    memo: entry.memo,
  };
}

// ── Atoms ─────────────────────────────────────────────────────────────

function AvatarCircle({
  name,
  avatar,
  size = 'md',
}: {
  name: string;
  avatar: string | null;
  size?: 'sm' | 'md';
}) {
  const sizeClass = size === 'sm' ? 'size-7 text-xs' : 'size-10 text-base';
  if (avatar) {
    return (
      <Image
        src={avatar}
        alt={name}
        width={size === 'sm' ? 28 : 40}
        height={size === 'sm' ? 28 : 40}
        unoptimized
        className={`${sizeClass} rounded-full object-cover shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${sizeClass} rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-semibold select-none`}
    >
      {name.slice(0, 1)}
    </div>
  );
}

function MovementBadge({ status }: { status: MovementStatus }) {
  const cfg = MOVEMENT_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border font-semibold shrink-0 ${cfg.badge}`}
    >
      <span className={`size-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── Position Badge (미배정=대기, 역할배정=배치완료 — 읽기 전용) ──────────

function PositionBadge({ value }: { value: StaffPosition }) {
  const cfg = POSITION_CONFIG[value];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${cfg.badge}`}
    >
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── Position Dropdown ──────────────────────────────────────────────────

function PositionDropdown({
  value,
  positions,
  onChange,
}: {
  value: string;
  positions: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs transition-colors group"
      >
        <span
          className={
            value ? 'text-foreground font-medium' : 'text-muted-foreground'
          }
        >
          {value || '미배정'}
        </span>
        <ChevronDown className="size-3 opacity-40 group-hover:opacity-70 transition-opacity" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-30 bg-popover border rounded-xl shadow-lg p-1 min-w-[120px]">
          <button
            type="button"
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent rounded-lg transition-colors text-muted-foreground"
          >
            미배정
            {!value && <Check className="size-3 ml-auto text-primary" />}
          </button>
          {positions.length > 0 && <div className="border-t my-1" />}
          {positions.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                onChange(p);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent rounded-lg transition-colors"
            >
              {p}
              {p === value && <Check className="size-3 ml-auto text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── QR Modal ──────────────────────────────────────────────────────────

function QRModal({
  checkinUrl,
  staff,
  onCheckin,
  onClose,
}: {
  checkinUrl: string;
  staff: StaffEntry[];
  onCheckin: (id: string) => void;
  onClose: () => void;
}) {
  const unchecked = staff.filter((s) => !s.checkedIn);
  const checkedCount = staff.length - unchecked.length;
  const qrImageUrl = checkinUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(checkinUrl)}&size=200x200&margin=10`
    : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center overflow-y-auto py-10 px-6 gap-8"
      onClick={onClose}
    >
      {/* 헤더 */}
      <div
        className="text-center space-y-1"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-white/50 text-xs tracking-widest uppercase">
          출근 체크
        </p>
        <h2 className="text-white text-2xl font-bold">QR 스캔</h2>
        <p className="text-white/50 text-xs">
          스탭이 이 QR을 스캔하면 출근이 기록됩니다
        </p>
      </div>

      {/* QR 코드 */}
      <div
        className="bg-white rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-3 w-full max-w-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {qrImageUrl ? (
          <Image
            src={qrImageUrl}
            alt="출근 QR"
            width={200}
            height={200}
            unoptimized
            className="rounded-xl"
          />
        ) : (
          <QrCode className="size-44 text-black" strokeWidth={0.75} />
        )}
        {staff.length > 0 && (
          <p className="text-xs text-gray-500 font-medium">
            출근 {checkedCount} / {staff.length}명
          </p>
        )}
      </div>

      {/* 스캔 시뮬레이션 (미출근 스탭 수동 처리) */}
      {unchecked.length > 0 && (
        <div
          className="w-full max-w-xs space-y-2"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-white/50 text-xs text-center">
            — 미출근 스탭 ({unchecked.length}명) —
          </p>
          {unchecked.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onCheckin(s.id)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-colors text-left"
            >
              <AvatarCircle name={s.name} avatar={s.avatar} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {s.name}
                </p>
                {s.position && (
                  <p className="text-white/50 text-xs truncate">{s.position}</p>
                )}
              </div>
              <span className="text-xs text-white/60 border border-white/20 rounded-full px-2.5 py-1 shrink-0">
                출근
              </span>
            </button>
          ))}
        </div>
      )}

      {unchecked.length === 0 && staff.length > 0 && (
        <div
          className="text-center space-y-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Check className="size-8 mx-auto text-emerald-400" />
          <p className="text-white text-sm font-medium">전원 출근 완료</p>
        </div>
      )}

      <button
        type="button"
        onClick={onClose}
        className="flex items-center gap-2 text-white/70 hover:text-white text-sm border border-white/20 hover:border-white/40 rounded-full px-6 py-2.5 transition-colors"
      >
        <X className="size-4" />
        닫기
      </button>
    </div>
  );
}

// ── Notice Modal ──────────────────────────────────────────────────────

const QUICK_TEMPLATES = [
  '곧 행사가 시작됩니다',
  '배치 장소로 이동해주세요',
  '잠시 대기해주세요',
  '수고 많으셨습니다',
];

function NoticeModal({
  totalCount,
  selectedCount,
  onSend,
  onClose,
}: {
  totalCount: number;
  selectedCount: number;
  onSend: (message: string, target: 'all' | 'selected') => Promise<void>;
  onClose: () => void;
}) {
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<'all' | 'selected'>('all');
  const [sending, setSending] = useState(false);

  const targets = [
    { key: 'all' as const, label: `전체 (${totalCount}명)`, disabled: false },
    {
      key: 'selected' as const,
      label: `선택됨 (${selectedCount}명)`,
      disabled: selectedCount === 0,
    },
  ];

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    await onSend(message.trim(), target);
    setSending(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base">공지 발송</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="flex gap-2">
            {targets.map(({ key, label, disabled }) => (
              <button
                key={key}
                type="button"
                onClick={() => !disabled && setTarget(key)}
                disabled={disabled}
                className={`flex-1 text-sm py-2 rounded-xl border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  target === key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {QUICK_TEMPLATES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setMessage(t)}
                className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/70 transition-colors"
              >
                {t}
              </button>
            ))}
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="공지 내용을 입력하세요"
            autoFocus
            className="w-full border rounded-xl p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-ring bg-background"
            rows={4}
          />
          <button
            type="button"
            disabled={!message.trim() || sending}
            onClick={handleSend}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
          >
            <Bell className="size-4" />
            {sending ? '발송 중...' : '발송하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Invite Manager Modal ───────────────────────────────────────────────

function InviteManagerModal({
  coManagers,
  onAdd,
  onRemove,
  onClose,
}: {
  coManagers: CoManager[];
  onAdd: (manager: CoManager) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [managerRole, setManagerRole] = useState<CoManagerRole>('팀장');

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({
      id: `co-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim() || null,
      avatar: null,
      role: managerRole,
      addedAt: nowHHmm(),
    });
    setName('');
    setPhone('');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base">현장 매니저 초대</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                role이 manager인 유저를 현장 운영에 초대합니다
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>

          {coManagers.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">
                초대된 매니저 ({coManagers.length}명)
              </p>
              {coManagers.map((cm) => (
                <div
                  key={cm.id}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/50 border border-border"
                >
                  <AvatarCircle name={cm.name} avatar={cm.avatar} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">
                      {cm.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {cm.role} · {cm.addedAt} 초대
                      {cm.phone && ` · ${formatPhone(cm.phone)}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(cm.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="border-t pt-4 space-y-3">
            <p className="text-xs text-muted-foreground font-medium">
              매니저 검색 및 추가
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="이름 또는 전화번호 검색"
                className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg bg-card outline-none focus:ring-1 focus:ring-ring"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
                <Search className="size-5 mx-auto mb-1.5 opacity-30" />
                서버 연동 후 검색 결과가 여기에 표시됩니다
              </div>
            )}
            <div className="flex gap-2">
              {CO_MANAGER_ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setManagerRole(r)}
                  className={`flex-1 text-sm py-2 rounded-xl border transition-colors ${
                    managerRole === r
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름"
                className="flex-1 px-3 py-2 text-sm border rounded-lg bg-card outline-none focus:ring-1 focus:ring-ring"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="전화번호 (선택)"
                className="flex-1 px-3 py-2 text-sm border rounded-lg bg-card outline-none focus:ring-1 focus:ring-ring"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <button
              type="button"
              disabled={!name.trim()}
              onClick={handleAdd}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
            >
              <UserPlus className="size-4" />
              초대하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Staff Card ────────────────────────────────────────────────────────

function StaffCard({
  entry,
  positions,
  isSelected,
  memoOpen,
  onSelect,
  onPositionChange,
  onMemoToggle,
  onMemoChange,
  onNameChange,
  onPhoneChange,
}: {
  entry: StaffEntry;
  positions: string[];
  isSelected: boolean;
  memoOpen: boolean;
  onSelect: () => void;
  onPositionChange: (v: string) => void;
  onMemoToggle: () => void;
  onMemoChange: (v: string) => void;
  onNameChange?: (v: string) => void;
  onPhoneChange?: (v: string) => void;
}) {
  const positionCfg = POSITION_CONFIG[entry.positionState];
  const phone = formatPhone(entry.phone);

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        isSelected
          ? `border-primary/40 ${positionCfg.cardBg || 'bg-card'}`
          : `border-border ${positionCfg.cardBg || 'bg-card'}`
      }`}
    >
      <div className="flex items-start gap-3">
        {/* 체크박스 */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="mt-1 size-4 cursor-pointer accent-primary shrink-0"
        />

        {/* 아바타 */}
        <AvatarCircle name={entry.name} avatar={entry.avatar} />

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              {/* 이름 + 이동상태 뱃지 */}
              {onNameChange ? (
                <input
                  type="text"
                  value={entry.name}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder="이름"
                  autoFocus={!entry.name}
                  className="font-semibold text-sm bg-transparent outline-none border-b border-border focus:border-primary min-w-[60px] w-full max-w-[160px]"
                />
              ) : (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-sm leading-snug">
                    {entry.name}
                  </span>
                  {entry.attendanceScore !== null && (
                    <span className="text-xs font-normal text-muted-foreground">
                      ({entry.attendanceScore}점)
                    </span>
                  )}
                  {entry.movementStatus ? (
                    <MovementBadge status={entry.movementStatus} />
                  ) : (
                    <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border font-medium shrink-0">
                      대기중
                    </span>
                  )}
                </div>
              )}

              {/* 역할 + 전화번호 */}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {positions.length > 0 ? (
                  <PositionDropdown
                    value={entry.position}
                    positions={positions}
                    onChange={onPositionChange}
                  />
                ) : (
                  <input
                    type="text"
                    value={entry.position}
                    onChange={(e) => onPositionChange(e.target.value)}
                    placeholder="역할"
                    className="text-xs text-muted-foreground bg-transparent outline-none border-b border-transparent hover:border-border focus:border-primary w-20 transition-colors"
                  />
                )}
                {onPhoneChange ? (
                  <>
                    {positions.length > 0 && (
                      <span className="text-muted-foreground/30 text-xs">·</span>
                    )}
                    <input
                      type="text"
                      value={entry.phone ?? ''}
                      onChange={(e) => onPhoneChange(e.target.value)}
                      placeholder="전화번호"
                      className="text-xs text-muted-foreground bg-transparent outline-none border-b border-transparent hover:border-border focus:border-primary w-28 transition-colors"
                    />
                  </>
                ) : (
                  phone && (
                    <>
                      <span className="text-muted-foreground/30 text-xs">·</span>
                      <a
                        href={`tel:${entry.phone}`}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        {phone}
                      </a>
                    </>
                  )
                )}
              </div>
            </div>

            {/* 포지션 배지 (미배정=대기, 역할배정=배치완료) */}
            <PositionBadge value={entry.positionState} />
          </div>

          {/* 시간 기록 */}
          {(entry.arrivedAt || entry.checkedInAt || entry.checkedOutAt) && (
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
              {entry.arrivedAt && (
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <MapPin className="size-3" />
                  {entry.arrivedAt} 도착
                </span>
              )}
              {entry.checkedInAt && (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Check className="size-3" />
                  {entry.checkedInAt} 출근
                </span>
              )}
              {entry.checkedOutAt && (
                <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                  <Clock className="size-3" />
                  {entry.checkedOutAt} 퇴근
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 메모 */}
      <div className="mt-2.5 pl-[calc(1rem+2.5rem+0.75rem)]">
        <button
          type="button"
          onClick={onMemoToggle}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageSquare
            className={`size-3 ${entry.memo ? 'text-primary' : ''}`}
          />
          <span className={entry.memo ? 'text-foreground/70' : ''}>
            {entry.memo
              ? entry.memo.length > 50
                ? `${entry.memo.slice(0, 50)}…`
                : entry.memo
              : '메모 추가'}
          </span>
        </button>
        {memoOpen && (
          <textarea
            value={entry.memo}
            onChange={(e) => onMemoChange(e.target.value)}
            placeholder="행사 종료 후 근태 점수 산정에 참고됩니다"
            autoFocus
            className="mt-2 w-full text-xs border rounded-xl p-3 bg-background resize-none outline-none focus:ring-1 focus:ring-ring"
            rows={3}
          />
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────

export default function EventRosterClient({
  rosters,
}: {
  rosters: PostRoster[];
}) {
  const [selectedPostId, setSelectedPostId] = useState(
    rosters.length > 0 ? String(rosters[0].post_id) : '',
  );
  const [staffByPost, setStaffByPost] = useState<Record<string, StaffEntry[]>>({});
  const [positionsByPost, setPositionsByPost] = useState<Record<string, string[]>>({});
  const [coManagersByPost, setCoManagersByPost] = useState<Record<string, CoManager[]>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterPositionState, setFilterPositionState] = useState<StaffPosition | null>(null);
  const [filterPosition, setFilterPosition] = useState('all');
  const [filterCheckin, setFilterCheckin] = useState<FilterCheckin>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openMemoId, setOpenMemoId] = useState<string | null>(null);
  const [showNotice, setShowNotice] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [addingPosition, setAddingPosition] = useState(false);
  const [newPositionName, setNewPositionName] = useState('');
  const positionInputRef = useRef<HTMLInputElement>(null);
  const memoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manualStaffTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevManualJsonRef = useRef<string>('');
  const lastManualPostIdRef = useRef<string>('');

  const selected = rosters.find((r) => String(r.post_id) === selectedPostId);

  // 공고 진입 시 서버 데이터로 초기화
  useEffect(() => {
    if (!selected) return;
    const key = String(selected.post_id);
    setStaffByPost((prev) => {
      if (prev[key]) return prev;
      return {
        ...prev,
        [key]: [
          ...selected.participants.map(fromParticipant),
          ...(selected.manual_staff ?? []).map(fromManualStaffRecord),
        ],
      };
    });
    setPositionsByPost((prev) => {
      if (prev[key]) return prev;
      return { ...prev, [key]: selected.event_positions ?? [] };
    });
  }, [selected]);

  // 수동 추가 스탭 변경 시 자동 저장 (디바운스 1초)
  const staffList = staffByPost[selectedPostId];
  useEffect(() => {
    // 공고 전환 시 비교 기준 초기화
    if (lastManualPostIdRef.current !== selectedPostId) {
      lastManualPostIdRef.current = selectedPostId;
      prevManualJsonRef.current = '';
    }

    const manualStaff = (staffList ?? []).filter((s) => s.isManual);
    const json = JSON.stringify(manualStaff.map(toManualStaffRecord));

    if (json === prevManualJsonRef.current) return;

    if (manualStaffTimerRef.current) clearTimeout(manualStaffTimerRef.current);
    manualStaffTimerRef.current = setTimeout(() => {
      prevManualJsonRef.current = json;
      if (!selectedPostId) return;
      saveManualStaffAction(Number(selectedPostId), JSON.parse(json)).catch(() => {});
    }, 1000);
  }, [staffList, selectedPostId]);

  useEffect(() => {
    if (addingPosition) positionInputRef.current?.focus();
  }, [addingPosition]);

  const currentStaff = staffByPost[selectedPostId] ?? [];
  const currentPositions = positionsByPost[selectedPostId] ?? [];
  const currentCoManagers = coManagersByPost[selectedPostId] ?? [];

  const positionsForFilter =
    currentPositions.length > 0
      ? currentPositions
      : Array.from(new Set(currentStaff.map((s) => s.position).filter(Boolean)));

  const checkedInCount = currentStaff.filter((s) => s.checkedIn).length;

  // 필터 + 정렬
  const filteredSorted = currentStaff
    .filter((s) => {
      if (filterPositionState && s.positionState !== filterPositionState) return false;
      if (filterPosition !== 'all' && s.position !== filterPosition) return false;
      if (filterCheckin === 'checked' && !s.checkedIn) return false;
      if (filterCheckin === 'unchecked' && s.checkedIn) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !s.name.toLowerCase().includes(q) &&
          !(s.phone ?? '').includes(q) &&
          !s.position.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.checkedIn !== b.checkedIn) return a.checkedIn ? -1 : 1;
      return a.name.localeCompare(b.name, 'ko');
    });

  const positionStateCounts = (['waiting', 'assigned'] as StaffPosition[]).reduce(
    (acc, s) => ({
      ...acc,
      [s]: currentStaff.filter((e) => e.positionState === s).length,
    }),
    {} as Record<StaffPosition, number>,
  );

  const positionCounts = currentPositions.reduce(
    (acc, p) => ({
      ...acc,
      [p]: currentStaff.filter((s) => s.position === p).length,
    }),
    {} as Record<string, number>,
  );

  // ── 스탭 업데이트 ─────────────────────────────────────────────────

  const updateStaff = (id: string, patch: Partial<StaffEntry>) =>
    setStaffByPost((prev) => ({
      ...prev,
      [selectedPostId]: (prev[selectedPostId] ?? []).map((s) =>
        s.id === id ? { ...s, ...patch } : s,
      ),
    }));

  const handlePositionChange = (id: string, role: string) => {
    const entry = currentStaff.find((s) => s.id === id);
    updateStaff(id, { position: role, positionState: role ? 'assigned' : 'waiting' });
    if (!entry?.isManual) {
      updateStaffPositionAction(id, role).then((r) => {
        if (!r.ok) toast.error('역할 저장 실패');
      });
    }
  };

  const handleBulkPositionChange = (position: string) => {
    const targets = currentStaff.filter((s) => selectedIds.has(s.id));
    setStaffByPost((prev) => ({
      ...prev,
      [selectedPostId]: (prev[selectedPostId] ?? []).map((s) => {
        if (!selectedIds.has(s.id)) return s;
        return { ...s, position, positionState: (position ? 'assigned' : 'waiting') as StaffPosition };
      }),
    }));

    const serverTargets = targets.filter((s) => !s.isManual);
    if (serverTargets.length > 0) {
      Promise.all(serverTargets.map((s) => updateStaffPositionAction(s.id, position))).then(
        (results) => {
          if (results.some((r) => !r.ok)) toast.error('일부 역할 저장 실패');
        },
      );
    }
  };

  const handleBulkDelete = () => {
    setStaffByPost((prev) => ({
      ...prev,
      [selectedPostId]: (prev[selectedPostId] ?? []).filter(
        (s) => !selectedIds.has(s.id),
      ),
    }));
    setSelectedIds(new Set());
  };

  // 출근 처리 (QR 모달에서 매니저가 수동 처리)
  const handleCheckin = (id: string) => {
    updateStaff(id, { checkedIn: true, checkedInAt: nowHHmm(), movementStatus: 'checked_in' });
    const entry = currentStaff.find((s) => s.id === id);
    if (!entry?.isManual) {
      updateMovementStatusAction(id, 'checked_in').then((r) => {
        if (!r.ok) toast.error('출근 처리 실패');
      });
    }
  };

  // 메모 (디바운스 저장)
  const handleMemoChange = (id: string, value: string) => {
    updateStaff(id, { memo: value });
    if (memoTimerRef.current) clearTimeout(memoTimerRef.current);
    const entry = currentStaff.find((s) => s.id === id);
    if (!entry?.isManual) {
      memoTimerRef.current = setTimeout(() => {
        updateStaffMemoAction(id, value).then((r) => {
          if (!r.ok) toast.error('메모 저장 실패');
        });
      }, 1200);
    }
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleAddStaff = () => {
    const newEntry: StaffEntry = {
      id: `manual-${Date.now()}`,
      memberId: '',
      name: '',
      phone: null,
      avatar: null,
      attendanceScore: null,
      position: '',
      positionState: 'waiting',
      movementStatus: null,
      checkedIn: false,
      checkedInAt: null,
      checkedOutAt: null,
      arrivedAt: null,
      memo: '',
      isManual: true,
    };
    setStaffByPost((prev) => ({
      ...prev,
      [selectedPostId]: [...(prev[selectedPostId] ?? []), newEntry],
    }));
  };

  // ── 포지션 관리 ───────────────────────────────────────────────────

  const handleAddPosition = () => {
    const name = newPositionName.trim();
    if (!name || currentPositions.includes(name)) {
      setNewPositionName('');
      setAddingPosition(false);
      return;
    }
    const newPositions = [...currentPositions, name];
    setPositionsByPost((prev) => ({
      ...prev,
      [selectedPostId]: newPositions,
    }));
    saveEventPositionsAction(Number(selectedPostId), newPositions).then((r) => {
      if (!r.ok) toast.error('포지션 저장 실패');
    });
    setNewPositionName('');
    setAddingPosition(false);
  };

  const handleRemovePosition = (pos: string) => {
    const newPositions = currentPositions.filter((p) => p !== pos);
    setPositionsByPost((prev) => ({
      ...prev,
      [selectedPostId]: newPositions,
    }));
    setStaffByPost((prev) => ({
      ...prev,
      [selectedPostId]: (prev[selectedPostId] ?? []).map((s) =>
        s.position === pos ? { ...s, position: '' } : s,
      ),
    }));
    if (filterPosition === pos) setFilterPosition('all');
    saveEventPositionsAction(Number(selectedPostId), newPositions).then((r) => {
      if (!r.ok) toast.error('포지션 삭제 실패');
    });
  };

  // ── 공지 발송 ─────────────────────────────────────────────────────

  const handleSendNotice = async (message: string, target: 'all' | 'selected') => {
    const targetMemberIds =
      target === 'selected'
        ? currentStaff
            .filter((s) => selectedIds.has(s.id) && !s.isManual && s.memberId)
            .map((s) => s.memberId)
        : undefined;

    const result = await sendEventBriefingAction(
      Number(selectedPostId),
      '현장 공지',
      message,
      targetMemberIds,
    );

    if (result.ok) {
      const count = targetMemberIds ? targetMemberIds.length : currentStaff.filter((s) => !s.isManual).length;
      toast.success(`${count}명에게 공지를 발송했습니다`);
    } else {
      toast.error('공지 발송 실패: ' + result.message);
    }
  };

  // ── 매니저 초대 ───────────────────────────────────────────────────

  const handleAddCoManager = (manager: CoManager) => {
    setCoManagersByPost((prev) => ({
      ...prev,
      [selectedPostId]: [...(prev[selectedPostId] ?? []), manager],
    }));
  };

  const handleRemoveCoManager = (id: string) => {
    setCoManagersByPost((prev) => ({
      ...prev,
      [selectedPostId]: (prev[selectedPostId] ?? []).filter((m) => m.id !== id),
    }));
  };

  const handlePostChange = (id: string) => {
    setSelectedPostId(id);
    setSelectedIds(new Set());
    setFilterPositionState(null);
    setFilterPosition('all');
    setFilterCheckin('all');
    setSearchQuery('');
    setAddingPosition(false);
    setNewPositionName('');
  };

  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // 현재 공고 상태 초기화 → 새로고침 후 서버 데이터로 재초기화
    setStaffByPost((prev) => {
      const next = { ...prev };
      delete next[selectedPostId];
      return next;
    });
    setPositionsByPost((prev) => {
      const next = { ...prev };
      delete next[selectedPostId];
      return next;
    });
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const selectedCount = selectedIds.size;

  // QR 체크인 URL (브라우저에서만 생성)
  const checkinUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/worker/checkin?postId=${selectedPostId}`
      : '';

  if (rosters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Users className="size-10 mb-3 opacity-20" />
        <p className="text-sm">등록된 공고가 없습니다</p>
        <p className="text-xs mt-1 opacity-60">
          공고를 작성하면 여기에 표시됩니다
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* 공고 선택 + 매니저 초대 + QR */}
        <div className="flex items-center gap-2">
          <Select value={selectedPostId} onValueChange={handlePostChange}>
            <SelectTrigger className="flex-1 max-w-sm">
              <SelectValue placeholder="공고를 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {rosters.map((r) => (
                <SelectItem key={r.post_id} value={String(r.post_id)}>
                  {r.title} · {r.participants.length}명
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            type="button"
            onClick={() => setShowInvite(true)}
            className="relative flex items-center gap-1.5 text-sm px-3 py-2 border rounded-lg bg-card hover:bg-accent transition-colors shrink-0"
            title="현장 매니저 초대"
          >
            <UserPlus className="size-4" />
            <span className="hidden sm:inline">매니저</span>
            {currentCoManagers.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {currentCoManagers.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowQR(true)}
            className="relative flex items-center gap-1.5 text-sm px-3 py-2 border rounded-lg bg-card hover:bg-accent transition-colors shrink-0"
          >
            <QrCode className="size-4" />
            QR
            {currentStaff.length > 0 && (
              <span
                className={`absolute -top-1.5 -right-1.5 min-w-4 h-4 px-0.5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  checkedInCount === currentStaff.length
                    ? 'bg-emerald-500 text-white'
                    : 'bg-muted text-muted-foreground border border-border'
                }`}
              >
                {checkedInCount}
              </span>
            )}
          </button>
        </div>

        {selected && (
          <>
            {/* 메타 */}
            {(selected.location || selected.recruit_count) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {selected.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {selected.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="size-3.5" />
                  {currentStaff.length}명
                  {selected.recruit_count
                    ? ` / 모집 ${selected.recruit_count}명`
                    : ''}
                </span>
              </div>
            )}

            {/* 현장 매니저 */}
            {currentCoManagers.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {currentCoManagers.map((cm) => (
                  <div
                    key={cm.id}
                    className={`flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full border text-xs ${CO_MANAGER_ROLE_COLORS[cm.role]}`}
                  >
                    <AvatarCircle name={cm.name} avatar={cm.avatar} size="sm" />
                    <span className="font-medium">{cm.name}</span>
                    <span className="opacity-60">{cm.role}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCoManager(cm.id)}
                      className="ml-0.5 opacity-40 hover:opacity-100 transition-opacity"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setShowInvite(true)}
                  className="flex items-center gap-1 pl-2 pr-2.5 py-1 rounded-full border border-dashed border-border text-xs text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                >
                  <Plus className="size-3" />
                  추가
                </button>
              </div>
            )}

            {/* 포지션 설정 */}
            <div className="rounded-xl border border-border bg-card p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Tag className="size-3.5" />
                포지션 설정
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {currentPositions.map((pos) => (
                  <span
                    key={pos}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/8 border border-primary/20 text-xs font-medium text-primary"
                  >
                    {pos}
                    <span className="text-primary/50">
                      {positionCounts[pos] ?? 0}명
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePosition(pos)}
                      className="opacity-40 hover:opacity-100 transition-opacity"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
                {addingPosition ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      ref={positionInputRef}
                      type="text"
                      value={newPositionName}
                      onChange={(e) => setNewPositionName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddPosition();
                        if (e.key === 'Escape') {
                          setAddingPosition(false);
                          setNewPositionName('');
                        }
                      }}
                      placeholder="포지션명"
                      className="text-xs border rounded-lg px-2.5 py-1 bg-background outline-none focus:ring-1 focus:ring-ring w-24"
                    />
                    <button
                      type="button"
                      onClick={handleAddPosition}
                      disabled={!newPositionName.trim()}
                      className="p-1 text-primary hover:bg-primary/10 rounded-md transition-colors disabled:opacity-30"
                    >
                      <Check className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddingPosition(false);
                        setNewPositionName('');
                      }}
                      className="p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingPosition(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-border text-xs text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    <Plus className="size-3" />
                    포지션 추가
                  </button>
                )}
              </div>
            </div>

            {/* 상태 필터 + 출근 토글 */}
            {(() => {
              const next: Record<FilterCheckin, FilterCheckin> = {
                all: 'checked',
                checked: 'unchecked',
                unchecked: 'all',
              };
              const checkinCfg = {
                all: {
                  label: '출근 전체',
                  className: 'bg-card text-muted-foreground border-border',
                },
                checked: {
                  label: `출근 ${checkedInCount}`,
                  className:
                    'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700 font-semibold',
                },
                unchecked: {
                  label: `미출근 ${currentStaff.length - checkedInCount}`,
                  className:
                    'bg-muted text-foreground border-foreground/20 font-semibold',
                },
              };
              return (
                <div className="flex items-center gap-2">
                  <div className="overflow-x-auto pb-0.5 flex-1">
                    <div className="flex gap-2 w-max">
                      {(['waiting', 'assigned'] as StaffPosition[]).map((s) => {
                        const cfg = POSITION_CONFIG[s];
                        const count = positionStateCounts[s];
                        const active = filterPositionState === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setFilterPositionState(active ? null : s)}
                            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                              active
                                ? `${cfg.badge} font-semibold ring-2 ring-offset-1 ring-current/20`
                                : 'bg-card text-muted-foreground border-border hover:border-border/70'
                            }`}
                          >
                            <span className={`size-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                            <span
                              className={`tabular-nums ${active ? 'font-bold' : 'opacity-60'}`}
                            >
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFilterCheckin(next[filterCheckin])}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors shrink-0 ${checkinCfg[filterCheckin].className}`}
                  >
                    {filterCheckin === 'checked' && (
                      <Check className="size-3" />
                    )}
                    {checkinCfg[filterCheckin].label}
                  </button>
                </div>
              );
            })()}

            {/* 검색 + 포지션 필터 + 공지 */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="이름, 전화번호, 포지션"
                  className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg bg-card outline-none focus:ring-1 focus:ring-ring"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              {positionsForFilter.length > 0 && (
                <Select value={filterPosition} onValueChange={setFilterPosition}>
                  <SelectTrigger className="h-9 w-auto min-w-[90px] text-xs shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {positionsForFilter.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <button
                type="button"
                onClick={() => setShowNotice(true)}
                className="flex items-center gap-1 text-sm px-3 py-2 border rounded-lg bg-card hover:bg-accent transition-colors shrink-0"
              >
                <Bell className="size-4" />
                공지
              </button>
            </div>

            {/* Bulk 액션 바 */}
            {selectedCount > 0 && (
              <div className="flex items-center justify-between gap-2 rounded-xl border bg-card px-4 py-2.5 shadow-sm">
                <span className="text-sm font-medium text-primary shrink-0">
                  {selectedCount}명 선택
                </span>
                <div className="flex items-center gap-2 overflow-x-auto">
                  {currentPositions.length > 0 && (
                    <Select
                      onValueChange={(v) =>
                        handleBulkPositionChange(v === '__none__' ? '' : v)
                      }
                    >
                      <SelectTrigger className="h-8 text-xs w-auto min-w-[90px] shrink-0">
                        <SelectValue placeholder="포지션 변경" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">미배정</SelectItem>
                        {currentPositions.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowNotice(true)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    <Bell className="size-3.5" />
                    공지
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkDelete}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    title="선택 삭제"
                  >
                    <Trash2 className="size-3.5" />
                    삭제
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedIds(new Set())}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            )}

            {/* 스탭 카드 리스트 */}
            <div className="space-y-2">
              {filteredSorted.length === 0 ? (
                <div className="text-center py-14 text-muted-foreground">
                  <Users className="size-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">
                    {searchQuery ||
                    filterPositionState ||
                    filterPosition !== 'all' ||
                    filterCheckin !== 'all'
                      ? '조건에 맞는 스탭이 없습니다'
                      : '스탭이 없습니다'}
                  </p>
                </div>
              ) : (
                filteredSorted.map((entry) => (
                  <StaffCard
                    key={entry.id}
                    entry={entry}
                    positions={currentPositions}
                    isSelected={selectedIds.has(entry.id)}
                    memoOpen={openMemoId === entry.id}
                    onSelect={() => toggleSelect(entry.id)}
                    onPositionChange={(v) => handlePositionChange(entry.id, v)}
                    onMemoToggle={() =>
                      setOpenMemoId(openMemoId === entry.id ? null : entry.id)
                    }
                    onMemoChange={(v) => handleMemoChange(entry.id, v)}
                    onNameChange={
                      entry.isManual
                        ? (v) => updateStaff(entry.id, { name: v })
                        : undefined
                    }
                    onPhoneChange={
                      entry.isManual
                        ? (v) => updateStaff(entry.id, { phone: v || null })
                        : undefined
                    }
                  />
                ))
              )}

              <button
                type="button"
                onClick={handleAddStaff}
                className="w-full flex items-center justify-center gap-2 py-3.5 border border-dashed rounded-xl text-sm text-muted-foreground hover:text-foreground hover:border-border transition-colors"
              >
                <Plus className="size-4" />
                스탭 직접 추가
              </button>
            </div>
          </>
        )}
      </div>

      {/* 플로팅 새로고침 버튼 */}
      <button
        type="button"
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="fixed bottom-6 right-6 z-40 size-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center disabled:opacity-70"
        aria-label="새로고침"
        title="새로고침"
      >
        <RefreshCw className={`size-5 ${isRefreshing ? 'animate-spin' : ''}`} />
      </button>

      {showQR && (
        <QRModal
          checkinUrl={checkinUrl}
          staff={currentStaff}
          onCheckin={handleCheckin}
          onClose={() => setShowQR(false)}
        />
      )}
      {showNotice && (
        <NoticeModal
          totalCount={currentStaff.filter((s) => !s.isManual).length}
          selectedCount={
            currentStaff.filter((s) => selectedIds.has(s.id) && !s.isManual).length
          }
          onSend={handleSendNotice}
          onClose={() => setShowNotice(false)}
        />
      )}
      {showInvite && (
        <InviteManagerModal
          coManagers={currentCoManagers}
          onAdd={handleAddCoManager}
          onRemove={handleRemoveCoManager}
          onClose={() => setShowInvite(false)}
        />
      )}
    </>
  );
}
