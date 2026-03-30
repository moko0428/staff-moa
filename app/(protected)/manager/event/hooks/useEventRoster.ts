'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { CoManager, PostRoster, StaffEntry, StaffPosition } from '../types';
import {
  saveEventPositionsAction,
  saveManualStaffAction,
  sendEventBriefingAction,
  updateMovementStatusAction,
  updateStaffMemoAction,
  updateStaffPositionAction,
} from '../actions';
import { fromManualStaffRecord, fromParticipant, nowHHmm, toManualStaffRecord } from '../utils';

export function useEventRoster(rosters: PostRoster[]) {
  const [selectedPostId, setSelectedPostId] = useState(
    rosters.length > 0 ? String(rosters[0].post_id) : '',
  );
  const [staffByPost, setStaffByPost] = useState<Record<string, StaffEntry[]>>({});
  const [positionsByPost, setPositionsByPost] = useState<Record<string, string[]>>({});
  const [coManagersByPost, setCoManagersByPost] = useState<Record<string, CoManager[]>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openMemoId, setOpenMemoId] = useState<string | null>(null);
  const [showNotice, setShowNotice] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [addingPosition, setAddingPosition] = useState(false);
  const [newPositionName, setNewPositionName] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const positionInputRef = useRef<HTMLInputElement>(null);
  const memoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manualStaffTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevManualJsonRef = useRef<string>('');
  const lastManualPostIdRef = useRef<string>('');

  const router = useRouter();

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
  const checkedInCount = currentStaff.filter((s) => s.checkedIn).length;

  const checkinUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/worker/checkin?postId=${selectedPostId}`
      : '';

  // ── 스탭 업데이트 ───────────────────────────────────────────────────

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
        return {
          ...s,
          position,
          positionState: (position ? 'assigned' : 'waiting') as StaffPosition,
        };
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
      [selectedPostId]: (prev[selectedPostId] ?? []).filter((s) => !selectedIds.has(s.id)),
    }));
    setSelectedIds(new Set());
  };

  const handleCheckin = (id: string) => {
    updateStaff(id, { checkedIn: true, checkedInAt: nowHHmm(), movementStatus: 'checked_in' });
    const entry = currentStaff.find((s) => s.id === id);
    if (!entry?.isManual) {
      updateMovementStatusAction(id, 'checked_in').then((r) => {
        if (!r.ok) toast.error('출근 처리 실패');
      });
    }
  };

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

  // ── 포지션 관리 ─────────────────────────────────────────────────────

  const handleAddPosition = () => {
    const name = newPositionName.trim();
    if (!name || currentPositions.includes(name)) {
      setNewPositionName('');
      setAddingPosition(false);
      return;
    }
    const newPositions = [...currentPositions, name];
    setPositionsByPost((prev) => ({ ...prev, [selectedPostId]: newPositions }));
    saveEventPositionsAction(Number(selectedPostId), newPositions).then((r) => {
      if (!r.ok) toast.error('포지션 저장 실패');
    });
    setNewPositionName('');
    setAddingPosition(false);
  };

  const handleRemovePosition = (pos: string) => {
    const newPositions = currentPositions.filter((p) => p !== pos);
    setPositionsByPost((prev) => ({ ...prev, [selectedPostId]: newPositions }));
    setStaffByPost((prev) => ({
      ...prev,
      [selectedPostId]: (prev[selectedPostId] ?? []).map((s) =>
        s.position === pos ? { ...s, position: '' } : s,
      ),
    }));
    saveEventPositionsAction(Number(selectedPostId), newPositions).then((r) => {
      if (!r.ok) toast.error('포지션 삭제 실패');
    });
  };

  // ── 공지 발송 ───────────────────────────────────────────────────────

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
      const count = targetMemberIds
        ? targetMemberIds.length
        : currentStaff.filter((s) => !s.isManual).length;
      toast.success(`${count}명에게 공지를 발송했습니다`);
    } else {
      toast.error('공지 발송 실패: ' + result.message);
    }
  };

  // ── 매니저 초대 ─────────────────────────────────────────────────────

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

  // ── 새로고침 ────────────────────────────────────────────────────────

  const handleRefresh = () => {
    setIsRefreshing(true);
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

  return {
    // State
    selectedPostId,
    selected,
    currentStaff,
    currentPositions,
    currentCoManagers,
    selectedIds,
    openMemoId,
    showNotice,
    showQR,
    showInvite,
    addingPosition,
    newPositionName,
    positionInputRef,
    isRefreshing,
    checkedInCount,
    checkinUrl,
    // Setters
    setSelectedPostId,
    setSelectedIds,
    setOpenMemoId,
    setShowNotice,
    setShowQR,
    setShowInvite,
    setAddingPosition,
    setNewPositionName,
    // Handlers
    updateStaff,
    handlePositionChange,
    handleBulkPositionChange,
    handleBulkDelete,
    handleCheckin,
    handleMemoChange,
    toggleSelect,
    handleAddStaff,
    handleAddPosition,
    handleRemovePosition,
    handleSendNotice,
    handleAddCoManager,
    handleRemoveCoManager,
    handleRefresh,
  };
}
