'use client';

import { useUserStore } from '@/store/useUserStore';
import { Card, CardContent } from '@/app/components/ui/card';
import { BottomSheet } from '@/app/components/mobile/BottomSheet';
import { EarningsSection } from './components/molecules/EarningsSection';
import { CardView } from './components/organisms/CardView';
import { WeeklyCalendar } from './components/organisms/WeeklyCalendar';
import { ScheduleDetailModal } from './components/organisms/ScheduleDetailModal';
import { AddPersonalScheduleModal } from './components/organisms/AddPersonalScheduleModal';
import { useWorkerSchedule } from './hooks/useWorkerSchedule';

export default function WorkerSchedulePage() {
  const role = useUserStore((state) => state.role);
  const roleHydrated = useUserStore((state) => state.roleHydrated);
  const effectiveRole = role ?? null;
  const isMember = effectiveRole === 'member';

  const {
    selectedDate,
    addScheduleOpen,
    setAddScheduleOpen,
    bottomSheetHeightPx,
    selectedSchedule,
    setSelectedSchedule,
    isMounted,
    isLoading,
    monthCalendarOpen,
    setMonthCalendarOpen,
    today,
    calendarAreaRef,
    aboveWeeksRef,
    belowWeeksRef,
    earningsData,
    filteredCategorizedSchedules,
    currentRowDates,
    expandedAboveWeeks,
    expandedBelowWeeks,
    headerMonthLabel,
    calendarMonth,
    handleScheduleClick,
    handleDateSelect,
    navigateBySwipe,
    getDateStatusClass,
    fetchData,
  } = useWorkerSchedule();

  if (!roleHydrated) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            역할 정보를 불러오는 중입니다...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            스탭만 접근할 수 있는 페이지입니다.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isMounted || isLoading) {
    return (
      <div>
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-100px)] overflow-hidden overscroll-none">
      {/* 급여 계산 섹션 */}
      <EarningsSection earnings={earningsData} />

      {/* 달력 영역 */}
      <WeeklyCalendar
        today={today}
        selectedDate={selectedDate}
        calendarMonth={calendarMonth}
        monthCalendarOpen={monthCalendarOpen}
        currentRowDates={currentRowDates}
        expandedAboveWeeks={expandedAboveWeeks}
        expandedBelowWeeks={expandedBelowWeeks}
        headerMonthLabel={headerMonthLabel}
        calendarAreaRef={calendarAreaRef}
        aboveWeeksRef={aboveWeeksRef}
        belowWeeksRef={belowWeeksRef}
        getDateStatusClass={getDateStatusClass}
        onDateSelect={handleDateSelect}
        onMonthCalendarToggle={() => setMonthCalendarOpen((v) => !v)}
        onAddSchedule={() => setAddScheduleOpen(true)}
        onNavigateBySwipe={navigateBySwipe}
      />

      {/* 바텀시트(카드뷰 목록) */}
      <BottomSheet heightPx={bottomSheetHeightPx}>
        <CardView
          categorizedSchedules={filteredCategorizedSchedules}
          onScheduleClick={handleScheduleClick}
        />
      </BottomSheet>

      {/* 스케줄 상세 모달 */}
      {selectedSchedule && (
        <ScheduleDetailModal
          schedule={selectedSchedule}
          onClose={() => setSelectedSchedule(null)}
          onRefresh={fetchData}
        />
      )}

      {/* 개인 스케줄 추가 모달 */}
      {addScheduleOpen && (
        <AddPersonalScheduleModal
          selectedDate={selectedDate ?? today}
          onClose={() => setAddScheduleOpen(false)}
          onSuccess={() => {
            setAddScheduleOpen(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
