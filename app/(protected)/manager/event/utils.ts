import type {
  ManualStaffRecord,
  PostRoster,
  RosterParticipant,
  ScheduleStatus,
  StaffEntry,
  StaffPosition,
} from './types';

export function isTodayEvent(workSlots: PostRoster['work_slots']): boolean {
  if (!workSlots?.length) return false;
  const today = new Date().toISOString().split('T')[0];
  return workSlots.some((s) => s.date === today);
}

export function getScheduleStatus(workSlots: PostRoster['work_slots']): ScheduleStatus {
  if (!workSlots?.length) return 'completed';
  const today = new Date().toISOString().split('T')[0];
  const dates = workSlots.map((s) => s.date).sort();
  if (today < dates[0]) return 'upcoming';
  if (today > dates[dates.length - 1]) return 'completed';
  return 'ongoing';
}

export function nowHHmm(): string {
  return new Date().toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function isoToHHmm(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatPhone(phone: string | null): string {
  if (!phone) return '';
  return phone.replace(/^(\d{3})(\d{3,4})(\d{4})$/, '$1-$2-$3');
}

export function fromParticipant(p: RosterParticipant): StaffEntry {
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

export function fromManualStaffRecord(m: ManualStaffRecord): StaffEntry {
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

export function toManualStaffRecord(entry: StaffEntry): ManualStaffRecord {
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
