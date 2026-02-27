'use client';

import { useUserStore } from '@/store/useUserStore';
import Hero from '@/app/components/Hero';
import {
  Card,
  CardContent,
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  FileText,
  Star,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWorkerManagement } from './hooks/useWorkerManagement';
import { GroupedWorkerCard } from './components/organisms/GroupedWorkerCard';
import { ApplicationDetailModal } from './components/organisms/ApplicationDetailModal';
import { StaffProfileModal } from './components/organisms/StaffProfileModal';
import type { ApplicationStatus, TabType } from './types';

const formatStatCount = (value: number) =>
  new Intl.NumberFormat('ko-KR', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(value);

export default function WorkerManagementPage() {
  const role = useUserStore((state) => state.role);
  const roleHydrated = useUserStore((state) => state.roleHydrated);
  const effectiveRole = role ?? null;
  const isManager = effectiveRole === 'manager';
  const isPendingManager = effectiveRole === 'pending_manager';

  const {
    isLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    selectedApplication,
    setSelectedApplication,
    selectedWorkerProfile,
    setSelectedWorkerProfile,
    applications,
    activeTab,
    setActiveTab,
    groupedWorkers,
    statistics,
    handleStatusChange,
    handleToggleFavorite,
    handleToggleBlacklist,
    handleDataChange,
    handleNotesChange,
  } = useWorkerManagement(isManager);

  if (!roleHydrated) {
    return (
      <div className="space-y-4">
        <Hero title="지원자 관리" description="매니저 전용 페이지" />
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            역할 정보를 불러오는 중입니다...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isManager) {
    return (
      <div className="space-y-4">
        <Hero title="지원자 관리" description="매니저 전용 페이지" />
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            {isPendingManager
              ? '관리자 승인 후에 접근할 수 있습니다. 프로필을 완성하고 재요청을 진행해주세요.'
              : '관리자 승인이 필요한 매니저 전용 페이지입니다.'}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Hero
        title="지원자 관리"
        description="공고에 지원한 지원자들을 확인하고 관리하세요"
      />

      {/* 통계 카드 */}
      <div className="mb-4 sm:mb-6 flex gap-2 overflow-x-auto scroll-none md:grid md:grid-cols-5 md:gap-4">
        <Card className="min-w-[132px] md:min-w-0">
          <CardContent className="py-2 px-3 sm:py-4">
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs text-muted-foreground leading-tight">지원자 수</p>
              <div className="flex items-center justify-end gap-1 sm:gap-2">
                <p className="text-base sm:text-xl font-bold tabular-nums whitespace-nowrap">
                  {formatStatCount(statistics.uniqueApplicants)}
                </p>
                <User className="size-5 sm:size-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-[132px] md:min-w-0">
          <CardContent className="py-2 px-3 sm:py-4">
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs text-muted-foreground leading-tight">지원 건수</p>
              <div className="flex items-center justify-end gap-1 sm:gap-2">
                <p className="text-base sm:text-xl font-bold tabular-nums whitespace-nowrap">
                  {formatStatCount(statistics.totalApplications)}
                </p>
                <FileText className="size-5 sm:size-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-[132px] md:min-w-0">
          <CardContent className="py-2 px-3 sm:py-4">
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs text-muted-foreground">대기중</p>
              <div className="flex items-center justify-end gap-1 sm:gap-2">
                <p className="text-base sm:text-xl font-bold text-yellow-600 tabular-nums whitespace-nowrap">
                  {formatStatCount(statistics.pending)}
                </p>
                <Clock className="size-5 sm:size-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-[132px] md:min-w-0">
          <CardContent className="py-2 px-3 sm:py-4">
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs text-muted-foreground">승인</p>
              <div className="flex items-center justify-end gap-1 sm:gap-2">
                <p className="text-base sm:text-xl font-bold text-green-600 tabular-nums whitespace-nowrap">
                  {formatStatCount(statistics.accepted)}
                </p>
                <CheckCircle2 className="size-5 sm:size-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-[132px] md:min-w-0">
          <CardContent className="py-2 px-3 sm:py-4">
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs text-muted-foreground">거절</p>
              <div className="flex items-center justify-end gap-1 sm:gap-2">
                <p className="text-base sm:text-xl font-bold text-red-600 tabular-nums whitespace-nowrap">
                  {formatStatCount(statistics.rejected)}
                </p>
                <XCircle className="size-5 sm:size-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* 필터 섹션 */}
        <div className="lg:col-span-3">
          <Card className="mb-0 lg:sticky lg:top-20">
            <CardContent className="pt-4 sm:pt-6 space-y-4">
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as TabType)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">지원자</TabsTrigger>
                  <TabsTrigger value="favorite">즐겨찾기</TabsTrigger>
                  <TabsTrigger value="blacklist">블랙리스트</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="지원자 이름 또는 공고명 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(value) =>
                    setStatusFilter(value as ApplicationStatus | 'all')
                  }
                >
                  <SelectTrigger>
                    <Filter className="size-4 mr-2" />
                    <SelectValue placeholder="상태 필터" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="pending">대기중</SelectItem>
                    <SelectItem value="accepted">승인</SelectItem>
                    <SelectItem value="rejected">거절</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 지원자 카드 섹션 */}
        <div className="lg:col-span-9">
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <p className="text-muted-foreground">로딩 중...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {groupedWorkers.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="py-10 sm:py-12 text-center">
                    <User className="size-10 sm:size-12 text-muted-foreground/50 mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-base text-muted-foreground">
                      {searchTerm || statusFilter !== 'all'
                        ? '검색 결과가 없습니다.'
                        : activeTab === 'favorite'
                          ? '즐겨찾기한 워커가 없습니다.'
                          : activeTab === 'blacklist'
                            ? '블랙리스트에 등록된 워커가 없습니다.'
                            : '지원자가 없습니다.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                groupedWorkers.map((worker) => (
                  <GroupedWorkerCard
                    key={worker.applicantId}
                    worker={worker}
                    onToggleFavorite={handleToggleFavorite}
                    onToggleBlacklist={handleToggleBlacklist}
                    onScheduleClick={(scheduleId) => {
                      const app = applications.find((a) => a.id === scheduleId);
                      if (app) setSelectedApplication(app);
                    }}
                    onStatusChange={handleStatusChange}
                    onProfileClick={(w) => setSelectedWorkerProfile(w)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {selectedWorkerProfile && (
        <StaffProfileModal
          worker={selectedWorkerProfile}
          onClose={() => setSelectedWorkerProfile(null)}
          onNotesChange={handleNotesChange}
        />
      )}

      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onStatusChange={handleStatusChange}
          onDataChange={handleDataChange}
        />
      )}
    </div>
  );
}
