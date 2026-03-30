import type { ManualStaffRecord, MovementStatus, PostRoster, RosterParticipant, StaffPosition } from './actions';

export type { ManualStaffRecord, MovementStatus, PostRoster, RosterParticipant, StaffPosition };

export type FilterCheckin = 'all' | 'checked' | 'unchecked';

export type StaffEntry = {
  id: string;         // member_schedule_id
  memberId: string;   // member_id (profile id, for notifications)
  name: string;
  phone: string | null;
  avatar: string | null;
  attendanceScore: number | null;
  position: string;             // 역할명 (안내, 주차 등)
  positionState: StaffPosition; // 대기 | 배치완료
  movementStatus: MovementStatus | null;
  checkedIn: boolean;
  checkedInAt: string | null;   // HH:mm
  checkedOutAt: string | null;  // HH:mm
  arrivedAt: string | null;     // HH:mm
  memo: string;
  isManual: boolean;
};

export type CoManagerRole = '팀장' | '보조 매니저';

export type CoManager = {
  id: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  role: CoManagerRole;
  addedAt: string;
};

export type ScheduleStatus = 'upcoming' | 'ongoing' | 'completed';
