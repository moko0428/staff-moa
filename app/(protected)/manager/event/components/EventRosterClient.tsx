'use client';

import { useEffect, useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  KeyRound,
  MapPin,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { generateDailyCode, generateCheckinCode, checkinCodeExpiresInMs } from '@/lib/arrivalCode';
import type { PostRoster, StaffPosition } from '../types';
import { POSITION_CONFIG, SCHEDULE_STATUS_DOT } from '../constants';
import { getScheduleStatus, isTodayEvent } from '../utils';
import { useEventRoster } from '../hooks/useEventRoster';
import { useRosterFilters } from '../hooks/useRosterFilters';
import { AvatarCircle } from './atoms/AvatarCircle';
import { StaffCard } from './molecules/StaffCard';
import { QRModal } from './organisms/QRModal';
import { NoticeModal } from './organisms/NoticeModal';
import { InviteManagerModal } from './organisms/InviteManagerModal';

export default function EventRosterClient({ rosters }: { rosters: PostRoster[] }) {
  const roster = useEventRoster(rosters);
  const filters = useRosterFilters(roster.currentStaff, roster.currentPositions);

  // ── 공고 전환 — 양쪽 훅 상태 리셋 ──────────────────────────────────
  const handlePostChange = (id: string) => {
    roster.setSelectedPostId(id);
    roster.setSelectedIds(new Set());
    roster.setAddingPosition(false);
    roster.setNewPositionName('');
    filters.reset();
  };

  // ── 포지션 삭제 — 필터도 초기화 ────────────────────────────────────
  const handleRemovePosition = (pos: string) => {
    roster.handleRemovePosition(pos);
    if (filters.filterPosition === pos) filters.setFilterPosition('all');
  };

  // ── 출근 필터 토글 ──────────────────────────────────────────────────
  const checkinNext: Record<typeof filters.filterCheckin, typeof filters.filterCheckin> = {
    all: 'checked',
    checked: 'unchecked',
    unchecked: 'all',
  };
  const checkinCfg = {
    all: { label: '출근 전체', className: 'bg-card text-muted-foreground border-border' },
    checked: {
      label: `출근 ${roster.checkedInCount}`,
      className:
        'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700 font-semibold',
    },
    unchecked: {
      label: `미출근 ${roster.currentStaff.length - roster.checkedInCount}`,
      className: 'bg-muted text-foreground border-foreground/20 font-semibold',
    },
  };

  const selectedCount = roster.selectedIds.size;
  const { selected } = roster;

  // ── TTL 체크인 코드 + 카운트다운 ────────────────────────────────────
  const postId = selected?.post_id ?? 0;
  const [checkinCode, setCheckinCode] = useState(() => generateCheckinCode(postId));
  const [expiresIn, setExpiresIn] = useState(() => Math.ceil(checkinCodeExpiresInMs() / 1000));

  useEffect(() => {
    setCheckinCode(generateCheckinCode(postId));
  }, [postId]);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.ceil(checkinCodeExpiresInMs() / 1000);
      setExpiresIn(remaining);
      setCheckinCode(generateCheckinCode(postId));
    }, 1000);
    return () => clearInterval(timer);
  }, [postId]);

  if (rosters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Users className="size-10 mb-3 opacity-20" />
        <p className="text-sm">등록된 공고가 없습니다</p>
        <p className="text-xs mt-1 opacity-60">공고를 작성하면 여기에 표시됩니다</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* ── 공고 선택 + 매니저 초대 + QR ─────────────────────────── */}
        <div className="flex items-center gap-2">
          <Select value={roster.selectedPostId} onValueChange={handlePostChange}>
            <SelectTrigger className="flex-1 max-w-sm bg-white dark:bg-zinc-900">
              <SelectValue placeholder="공고를 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {rosters.map((r) => {
                const status = getScheduleStatus(r.work_slots);
                const { dot } = SCHEDULE_STATUS_DOT[status];
                return (
                  <SelectItem key={r.post_id} value={String(r.post_id)}>
                    <span className="flex items-center gap-2">
                      <span className={`size-2 rounded-full shrink-0 ${dot}`} />
                      {r.title} · {r.participants.length}명
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <button
            type="button"
            onClick={() => roster.setShowInvite(true)}
            className="relative flex items-center gap-1.5 text-sm px-3 py-2 border rounded-lg bg-card hover:bg-accent transition-colors shrink-0"
            title="현장 매니저 초대"
          >
            <UserPlus className="size-4" />
            <span className="hidden sm:inline">매니저</span>
            {roster.currentCoManagers.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {roster.currentCoManagers.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => roster.setShowQR(true)}
            className="relative flex items-center gap-1.5 text-sm px-3 py-2 border rounded-lg bg-card hover:bg-accent transition-colors shrink-0"
          >
            <QrCode className="size-4" />
            QR
            {roster.currentStaff.length > 0 && (
              <span
                className={`absolute -top-1.5 -right-1.5 min-w-4 h-4 px-0.5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  roster.checkedInCount === roster.currentStaff.length
                    ? 'bg-emerald-500 text-white'
                    : 'bg-muted text-muted-foreground border border-border'
                }`}
              >
                {roster.checkedInCount}
              </span>
            )}
          </button>
        </div>

        {selected && (
          <>
            {/* ── 메타 정보 ─────────────────────────────────────────── */}
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
                  {roster.currentStaff.length}명
                  {selected.recruit_count ? ` / 모집 ${selected.recruit_count}명` : ''}
                </span>
                {isTodayEvent(selected.work_slots) && (
                  <>
                    <span className="flex items-center gap-1 font-mono font-semibold text-primary">
                      <KeyRound className="size-3.5 shrink-0" />
                      {generateDailyCode(selected.post_id)}
                    </span>
                    <span className="flex items-center gap-1 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCheck className="size-3.5 shrink-0" />
                      {checkinCode}
                      <span className="text-xs font-normal text-muted-foreground ml-0.5">
                        ({Math.floor(expiresIn / 60)}:{String(expiresIn % 60).padStart(2, '0')} 후 갱신)
                      </span>
                    </span>
                  </>
                )}
              </div>
            )}

            {/* ── 현장 매니저 칩 ────────────────────────────────────── */}
            {roster.currentCoManagers.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {roster.currentCoManagers.map((cm) => (
                  <div
                    key={cm.id}
                    className={`flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full border text-xs ${
                      cm.role === '팀장'
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    <AvatarCircle name={cm.name} avatar={cm.avatar} size="sm" />
                    <span className="font-medium">{cm.name}</span>
                    <span className="opacity-60">{cm.role}</span>
                    <button
                      type="button"
                      onClick={() => roster.handleRemoveCoManager(cm.id)}
                      className="ml-0.5 opacity-40 hover:opacity-100 transition-opacity"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => roster.setShowInvite(true)}
                  className="flex items-center gap-1 pl-2 pr-2.5 py-1 rounded-full border border-dashed border-border text-xs text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                >
                  <Plus className="size-3" />
                  추가
                </button>
              </div>
            )}

            {/* ── 포지션 설정 ───────────────────────────────────────── */}
            <div className="rounded-xl border border-border bg-card p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Tag className="size-3.5" />
                포지션 설정
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {roster.currentPositions.map((pos) => (
                  <span
                    key={pos}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/8 border border-primary/20 text-xs font-medium text-primary"
                  >
                    {pos}
                    <span className="text-primary/50">
                      {filters.positionCounts[pos] ?? 0}명
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
                {roster.addingPosition ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      ref={roster.positionInputRef}
                      type="text"
                      value={roster.newPositionName}
                      onChange={(e) => roster.setNewPositionName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') roster.handleAddPosition();
                        if (e.key === 'Escape') {
                          roster.setAddingPosition(false);
                          roster.setNewPositionName('');
                        }
                      }}
                      placeholder="포지션명"
                      className="text-xs border rounded-lg px-2.5 py-1 bg-background outline-none focus:ring-1 focus:ring-ring w-24"
                    />
                    <button
                      type="button"
                      onClick={roster.handleAddPosition}
                      disabled={!roster.newPositionName.trim()}
                      className="p-1 text-primary hover:bg-primary/10 rounded-md transition-colors disabled:opacity-30"
                    >
                      <Check className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        roster.setAddingPosition(false);
                        roster.setNewPositionName('');
                      }}
                      className="p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => roster.setAddingPosition(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-border text-xs text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    <Plus className="size-3" />
                    포지션 추가
                  </button>
                )}
              </div>
            </div>

            {/* ── 상태 필터 + 출근 토글 ─────────────────────────────── */}
            <div className="flex items-center gap-2">
              <div className="overflow-x-auto pb-0.5 flex-1">
                <div className="flex gap-2 w-max">
                  {(['waiting', 'assigned'] as StaffPosition[]).map((s) => {
                    const cfg = POSITION_CONFIG[s];
                    const count = filters.positionStateCounts[s];
                    const active = filters.filterPositionState === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() =>
                          filters.setFilterPositionState(active ? null : s)
                        }
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          active
                            ? `${cfg.badge} font-semibold ring-2 ring-offset-1 ring-current/20`
                            : 'bg-card text-muted-foreground border-border hover:border-border/70'
                        }`}
                      >
                        <span className={`size-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                        <span className={`tabular-nums ${active ? 'font-bold' : 'opacity-60'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <button
                type="button"
                onClick={() => filters.setFilterCheckin(checkinNext[filters.filterCheckin])}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors shrink-0 ${checkinCfg[filters.filterCheckin].className}`}
              >
                {filters.filterCheckin === 'checked' && <Check className="size-3" />}
                {checkinCfg[filters.filterCheckin].label}
              </button>
            </div>

            {/* ── 검색 + 포지션 필터 + 공지 ─────────────────────────── */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={filters.searchQuery}
                  onChange={(e) => filters.setSearchQuery(e.target.value)}
                  placeholder="이름, 전화번호, 포지션"
                  className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg bg-card outline-none focus:ring-1 focus:ring-ring"
                />
                {filters.searchQuery && (
                  <button
                    type="button"
                    onClick={() => filters.setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              {filters.positionsForFilter.length > 0 && (
                <Select value={filters.filterPosition} onValueChange={filters.setFilterPosition}>
                  <SelectTrigger className="h-9 w-auto min-w-[90px] text-xs shrink-0 bg-white dark:bg-zinc-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {filters.positionsForFilter.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <button
                type="button"
                onClick={() => roster.setShowNotice(true)}
                className="flex items-center gap-1 text-sm px-3 py-2 border rounded-lg bg-card hover:bg-accent transition-colors shrink-0"
              >
                <Bell className="size-4" />
                공지
              </button>
            </div>

            {/* ── Bulk 액션 바 ──────────────────────────────────────── */}
            {selectedCount > 0 && (
              <div className="flex items-center justify-between gap-2 rounded-xl border bg-card px-4 py-2.5 shadow-sm">
                <span className="text-sm font-medium text-primary shrink-0">
                  {selectedCount}명 선택
                </span>
                <div className="flex items-center gap-2 overflow-x-auto">
                  {roster.currentPositions.length > 0 && (
                    <Select
                      onValueChange={(v) =>
                        roster.handleBulkPositionChange(v === '__none__' ? '' : v)
                      }
                    >
                      <SelectTrigger className="h-8 text-xs w-auto min-w-[90px] shrink-0 bg-white dark:bg-zinc-900">
                        <SelectValue placeholder="포지션 변경" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">미배정</SelectItem>
                        {roster.currentPositions.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <button
                    type="button"
                    onClick={() => roster.setShowNotice(true)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    <Bell className="size-3.5" />
                    공지
                  </button>
                  <button
                    type="button"
                    onClick={roster.handleBulkDelete}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    title="선택 삭제"
                  >
                    <Trash2 className="size-3.5" />
                    삭제
                  </button>
                  <button
                    type="button"
                    onClick={() => roster.setSelectedIds(new Set())}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── 스탭 카드 리스트 ──────────────────────────────────── */}
            <div className="space-y-2">
              {filters.filteredSorted.length === 0 ? (
                <div className="text-center py-14 text-muted-foreground">
                  <Users className="size-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">
                    {filters.hasActiveFilter ? '조건에 맞는 스탭이 없습니다' : '스탭이 없습니다'}
                  </p>
                </div>
              ) : (
                filters.filteredSorted.map((entry) => (
                  <StaffCard
                    key={entry.id}
                    entry={entry}
                    positions={roster.currentPositions}
                    isSelected={roster.selectedIds.has(entry.id)}
                    memoOpen={roster.openMemoId === entry.id}
                    onSelect={() => roster.toggleSelect(entry.id)}
                    onPositionChange={(v) => roster.handlePositionChange(entry.id, v)}
                    onMemoToggle={() =>
                      roster.setOpenMemoId(
                        roster.openMemoId === entry.id ? null : entry.id,
                      )
                    }
                    onMemoChange={(v) => roster.handleMemoChange(entry.id, v)}
                    onNameChange={
                      entry.isManual
                        ? (v) => roster.updateStaff(entry.id, { name: v })
                        : undefined
                    }
                    onPhoneChange={
                      entry.isManual
                        ? (v) => roster.updateStaff(entry.id, { phone: v || null })
                        : undefined
                    }
                  />
                ))
              )}

              <button
                type="button"
                onClick={roster.handleAddStaff}
                className="w-full flex items-center justify-center gap-2 py-3.5 border border-dashed rounded-xl text-sm text-muted-foreground hover:text-foreground hover:border-border transition-colors"
              >
                <Plus className="size-4" />
                스탭 직접 추가
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── 플로팅 새로고침 버튼 ──────────────────────────────────────── */}
      <button
        type="button"
        onClick={roster.handleRefresh}
        disabled={roster.isRefreshing}
        className="fixed bottom-6 right-6 z-40 size-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center disabled:opacity-70"
        aria-label="새로고침"
        title="새로고침"
      >
        <RefreshCw className={`size-5 ${roster.isRefreshing ? 'animate-spin' : ''}`} />
      </button>

      {/* ── 모달 ─────────────────────────────────────────────────────── */}
      {roster.showQR && (
        <QRModal
          checkinUrl={roster.checkinUrl}
          staff={roster.currentStaff}
          onCheckin={roster.handleCheckin}
          onClose={() => roster.setShowQR(false)}
        />
      )}
      {roster.showNotice && (
        <NoticeModal
          totalCount={roster.currentStaff.filter((s) => !s.isManual).length}
          selectedCount={
            roster.currentStaff.filter((s) => roster.selectedIds.has(s.id) && !s.isManual).length
          }
          onSend={roster.handleSendNotice}
          onClose={() => roster.setShowNotice(false)}
        />
      )}
      {roster.showInvite && (
        <InviteManagerModal
          coManagers={roster.currentCoManagers}
          onAdd={roster.handleAddCoManager}
          onRemove={roster.handleRemoveCoManager}
          onClose={() => roster.setShowInvite(false)}
        />
      )}
    </>
  );
}
