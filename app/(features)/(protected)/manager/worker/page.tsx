'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';
import Hero from '@/app/components/Hero';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  getApplicantsAction,
  updateApplicantStatusAction,
  getWorkerManagementAction,
  toggleFavoriteAction,
  toggleBlacklistAction,
  updateWorkerRatingAction,
  updateWorkerNotesAction,
} from './actions';
import WorkerCard from '@/app/components/WorkerCard';

import { Textarea } from '@/app/components/ui/textarea';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/app/components/ui/avatar';
import {
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  IdCard,
  CreditCard,
  FileCheck,
  Car,
  Award,
  Languages,
  Ruler,
  Weight,
  Smile,
  Star,
  FileText,
  Briefcase,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

// Database 타입 정의
type ApplicantData = {
  member_schedule_id: string;
  post_id: number;
  member_id: string;
  status: ApplicationStatus;
  message: string | null;
  created_at: string;
  updated_at: string;
  posts?: {
    post_id: number;
    title: string;
    description: string;
    work_date: string;
    location: string;
    pay_amount: number;
    pay_type: string;
    work_slots: unknown;
  } | null;
  profiles?: {
    user_id: string;
    name: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    attendance_score: number;
    age: number | null;
    gender: string | null;
    kakao_id: string | null;
    height: number | null;
    weight: number | null;
    personality: string | null;
    features: string | null;
    introduction: string | null;
    experiences: unknown;
    documents: unknown;
  } | null;
};

interface ApplicationWithPost {
  id: string;
  postId: number;
  applicantId: string;
  applicantName: string;
  postTitle: string;
  postDate: string;
  postLocation: string;
  appliedAt: string;
  status: ApplicationStatus;
  message?: string | null;
  applicantInfo?: {
    name: string;
    email: string;
    phone?: string | null;
    photo?: string | null;
    attendanceScore?: number;
    age?: number | null;
    gender?: string | null;
    kakaoId?: string | null;
    height?: number | null;
    weight?: number | null;
    personality?: string | null;
    features?: string | null;
    introduction?: string | null;
    experiences?: Array<{
      title?: string;
      date?: string;
      location?: string;
    }>;
    documents?: {
      idCard?: string;
      bankbook?: string;
      healthCertificate?: string;
      certificates?: string[];
      language?: string[];
      extraDocuments?: string[];
    };
  };
  applicantPhoto?: string;
  applicantAttendanceScore?: number;
  applicantKakaoId?: string;
  applicantGender?: string;
  applicantAge?: number;
  workerManagement?: {
    rating?: number | null;
    notes?: string | null;
    is_favorite?: boolean;
    is_blacklisted?: boolean;
  };
}

type TabType = 'all' | 'favorite' | 'blacklist';

// 데이터 변환 헬퍼 함수
function convertToApplicationWithPost(data: ApplicantData): ApplicationWithPost {
  const profile = data.profiles;
  const post = data.posts;

  // JSONB 필드 파싱
  const rawExperiences = profile?.experiences;
  const experiences = Array.isArray(rawExperiences)
    ? rawExperiences.filter(
        (item): item is { title?: string; date?: string; location?: string } =>
          typeof item === 'object' && item !== null
      )
    : undefined;

  const rawDocuments = profile?.documents;
  const documents =
    typeof rawDocuments === 'object' && rawDocuments !== null
      ? (rawDocuments as {
          idCard?: string;
          bankbook?: string;
          healthCertificate?: string;
          certificates?: string[];
          language?: string[];
          extraDocuments?: string[];
        })
      : undefined;

  return {
    id: data.member_schedule_id,
    postId: data.post_id,
    applicantId: data.member_id,
    applicantName: profile?.name || '알 수 없음',
    postTitle: post?.title || '',
    postDate: post?.work_date || '',
    postLocation: post?.location || '',
    appliedAt: data.created_at,
    status: data.status,
    message: data.message,
    applicantInfo: profile
      ? {
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          photo: profile.avatar,
          attendanceScore: profile.attendance_score,
          age: profile.age,
          gender: profile.gender,
          kakaoId: profile.kakao_id,
          height: profile.height,
          weight: profile.weight,
          personality: profile.personality,
          features: profile.features,
          introduction: profile.introduction,
          experiences,
          documents,
        }
      : undefined,
    applicantPhoto: profile?.avatar || undefined,
    applicantAttendanceScore: profile?.attendance_score,
    applicantKakaoId: profile?.kakao_id || undefined,
    applicantGender: profile?.gender || undefined,
    applicantAge: profile?.age || undefined,
  };
}

export default function WorkerManagementPage() {
  const role = useUserStore((state) => state.role);
  const roleHydrated = useUserStore((state) => state.roleHydrated);
  const effectiveRole = role ?? null;
  const isManager = effectiveRole === 'manager';
  const isPendingManager = effectiveRole === 'pending_manager';
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>(
    'all'
  );
  const [selectedApplication, setSelectedApplication] =
    useState<ApplicationWithPost | null>(null);
  const [applications, setApplications] = useState<ApplicationWithPost[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  // 지원자 데이터 가져오기
  useEffect(() => {
    const fetchApplicants = async () => {
      setIsLoading(true);
      try {
        const result = await getApplicantsAction();
        if (result.ok && result.data) {
          const convertedData = result.data.map((item) =>
            convertToApplicationWithPost(item as unknown as ApplicantData)
          );
          setApplications(convertedData);

          // 각 워커의 관리 데이터 가져오기
          const managementDataPromises = convertedData.map(async (app) => {
            const mgmtResult = await getWorkerManagementAction(app.applicantId);
            return {
              workerId: app.applicantId,
              data: mgmtResult.ok ? mgmtResult.data : {},
            };
          });

          const managementResults = await Promise.all(managementDataPromises);
          const managementMap: Record<
            string,
            ApplicationWithPost['workerManagement']
          > = {};

          managementResults.forEach((result) => {
            const data = result.data as {
              rating?: number | null;
              notes?: string | null;
              is_favorite?: boolean;
              is_blacklisted?: boolean;
            };
            managementMap[result.workerId] = data;
          });

          // applications에 workerManagement 데이터 결합
          const applicationsWithManagement = convertedData.map((app) => ({
            ...app,
            workerManagement: managementMap[app.applicantId],
          }));
          setApplications(applicationsWithManagement);
        }
      } catch (error) {
        console.error('Failed to fetch applicants:', error);
        setApplications([]);
      } finally {
        setIsLoading(false);
        setIsMounted(true);
      }
    };

    if (isManager) {
      fetchApplicants();
    }
  }, [isManager]);

  // 현재 매니저의 공고에 지원한 지원자들
  const managerApplications = useMemo(() => {
    if (!isMounted) return [];
    return applications;
  }, [isMounted, applications]);

  // 필터링 및 검색
  const filteredApplications = useMemo(() => {
    let filtered = managerApplications;

    // 탭 필터
    if (activeTab === 'favorite') {
      filtered = filtered.filter((app) => app.workerManagement?.is_favorite);
    } else if (activeTab === 'blacklist') {
      filtered = filtered.filter((app) => app.workerManagement?.is_blacklisted);
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // 검색
    if (searchTerm) {
      filtered = filtered.filter(
        (app) =>
          app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.postTitle.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 상태 우선순위: pending > accepted > rejected, 동일 상태는 최신순
    const priority: Record<ApplicationStatus, number> = {
      pending: 0,
      accepted: 1,
      rejected: 2,
    };

    return filtered.slice().sort((a, b) => {
      const pDiff = priority[a.status] - priority[b.status];
      if (pDiff !== 0) return pDiff;
      return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
    });
  }, [managerApplications, statusFilter, searchTerm, activeTab]);

  // 상태별 통계
  const statistics = useMemo(() => {
    return {
      total: managerApplications.length,
      pending: managerApplications.filter((app) => app.status === 'pending')
        .length,
      accepted: managerApplications.filter((app) => app.status === 'accepted')
        .length,
      rejected: managerApplications.filter((app) => app.status === 'rejected')
        .length,
    };
  }, [managerApplications]);

  if (!roleHydrated) {
    return (
      <div className="space-y-4">
        <Hero title="지원자 관리" description="매니저 전용 페이지" />
        <Card>
          <CardContent className="py-6 text-sm text-gray-600">
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
          <CardContent className="py-6 text-sm text-gray-600">
            {isPendingManager
              ? '관리자 승인 후에 접근할 수 있습니다. 프로필을 완성하고 재요청을 진행해주세요.'
              : '관리자 승인이 필요한 매니저 전용 페이지입니다.'}
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleStatusChange = async (
    applicationId: string,
    newStatus: ApplicationStatus
  ) => {
    // pending 상태는 처리하지 않음
    if (newStatus === 'pending') {
      return;
    }

    try {
      // 서버 액션 호출
      const result = await updateApplicantStatusAction(applicationId, newStatus);

      if (result.ok) {
        // 로컬 상태 업데이트
        setApplications((prev) =>
          prev.map((app) =>
            app.id === applicationId ? { ...app, status: newStatus } : app
          )
        );

        // 선택된 지원서도 업데이트
        if (selectedApplication && selectedApplication.id === applicationId) {
          setSelectedApplication({
            ...selectedApplication,
            status: newStatus,
          });
        }

        alert(result.message);
      } else {
        alert(result.message || '상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      <Hero
        title="지원자 관리"
        description="공고에 지원한 지원자들을 확인하고 관리하세요"
      />

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 sm:gap-4 mb-4 sm:mb-6">
        <Card>
          <CardContent className="pt-3 pb-3 sm:pt-6 sm:pb-6">
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs text-gray-500 leading-tight">지원자 수</p>
              <div className="flex items-center justify-end gap-1 sm:gap-2">
                <p className="text-lg sm:text-2xl font-bold">
                  {statistics.total}
                </p>
                <User className="size-6 sm:size-8 text-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-3 pb-3 sm:pt-6 sm:pb-6">
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs text-gray-500">대기중</p>
              <div className="flex items-center justify-end gap-1 sm:gap-2">
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">
                  {statistics.pending}
                </p>
                <Clock className="size-6 sm:size-8 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-3 pb-3 sm:pt-6 sm:pb-6">
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs text-gray-500">승인</p>
              <div className="flex items-center justify-end gap-1 sm:gap-2">
                <p className="text-lg sm:text-2xl font-bold text-green-600">
                  {statistics.accepted}
                </p>
                <CheckCircle2 className="size-6 sm:size-8 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-3 pb-3 sm:pt-6 sm:pb-6">
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs text-gray-500">거절</p>
              <div className="flex items-center justify-end gap-1 sm:gap-2">
                <p className="text-lg sm:text-2xl font-bold text-red-600">
                  {statistics.rejected}
                </p>
                <XCircle className="size-6 sm:size-8 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 탭 + 필터 및 검색 */}
      <Card className="mb-4 sm:mb-6">
        <CardContent className="pt-4 sm:pt-6 space-y-4 sm:space-y-6">
          {/* 탭 */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabType)}
            className="w-full"
          >
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="all">전체</TabsTrigger>
              <TabsTrigger value="favorite">즐겨찾기</TabsTrigger>
              <TabsTrigger value="blacklist">블랙리스트</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* 검색 + 상태 필터 */}
          <div className="flex md:flex-row gap-3 sm:gap-4">
            <div className="flex-1 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  placeholder="지원자 이름 또는 공고명 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-48">
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
          </div>
        </CardContent>
      </Card>

      {/* 지원자 목록 */}
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
          {filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="py-10 sm:py-12 text-center">
                <User className="size-10 sm:size-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-gray-500">
                  {searchTerm || statusFilter !== 'all'
                    ? '검색 결과가 없습니다.'
                    : '지원자가 없습니다.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredApplications.map((application) => (
              <WorkerCard
                key={application.id}
                application={{
                  id: application.id,
                  applicantId: application.applicantId,
                  applicantName: application.applicantName,
                  postTitle: application.postTitle,
                  postLocation: application.postLocation,
                  appliedAt: application.appliedAt,
                  status: application.status,
                  applicantAge: application.applicantAge,
                  applicantGender: application.applicantGender,
                  applicantKakaoId: application.applicantKakaoId,
                  applicantAttendanceScore: application.applicantAttendanceScore,
                  applicantPhoto: application.applicantPhoto,
                }}
                workerManagement={application.workerManagement}
                onCardClick={() => setSelectedApplication(application)}
                onStatusChange={handleStatusChange}
              />
            ))
          )}
        </div>
      )}

      {/* 지원자 상세 모달 */}
      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onStatusChange={handleStatusChange}
          onDataChange={(workerId, data) => {
            // applications 업데이트
            setApplications((prev) =>
              prev.map((app) =>
                app.applicantId === workerId
                  ? {
                      ...app,
                      workerManagement: { ...app.workerManagement, ...data },
                    }
                  : app
              )
            );
          }}
        />
      )}
    </div>
  );
}

// 지원자 상세 모달
interface ApplicationDetailModalProps {
  application: ApplicationWithPost;
  onClose: () => void;
  onStatusChange: (applicationId: string, newStatus: ApplicationStatus) => void;
  onDataChange: (
    workerId: string,
    data: Partial<ApplicationWithPost['workerManagement']>
  ) => void;
}

function ApplicationDetailModal({
  application,
  onClose,
  onStatusChange,
  onDataChange,
}: ApplicationDetailModalProps) {
  const [rating, setRating] = useState(application.workerManagement?.rating || 0);
  const [notes, setNotes] = useState(application.workerManagement?.notes || '');
  const [isSavingRating, setIsSavingRating] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const statusBadge = {
    pending: {
      label: '대기중',
      className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    },
    accepted: {
      label: '승인',
      className: 'bg-green-100 text-green-700 border-green-200',
    },
    rejected: {
      label: '거절',
      className: 'bg-red-100 text-red-700 border-red-200',
    },
  }[application.status];

  const handleRatingClick = async (newRating: number) => {
    setIsSavingRating(true);
    try {
      const result = await updateWorkerRatingAction(
        application.applicantId,
        newRating
      );
      if (result.ok) {
        setRating(newRating);
        onDataChange(application.applicantId, { rating: newRating });
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Failed to update rating:', error);
      alert('평가 저장에 실패했습니다.');
    } finally {
      setIsSavingRating(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      const result = await updateWorkerNotesAction(
        application.applicantId,
        notes
      );
      if (result.ok) {
        onDataChange(application.applicantId, { notes });
        alert(result.message);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Failed to save notes:', error);
      alert('메모 저장에 실패했습니다.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const result = await toggleFavoriteAction(application.applicantId);
      if (result.ok) {
        onDataChange(application.applicantId, {
          is_favorite: !application.workerManagement?.is_favorite,
        });
        alert(result.message);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      alert('즐겨찾기 변경에 실패했습니다.');
    }
  };

  const handleToggleBlacklist = async () => {
    try {
      const result = await toggleBlacklistAction(application.applicantId);
      if (result.ok) {
        onDataChange(application.applicantId, {
          is_blacklisted: !application.workerManagement?.is_blacklisted,
        });
        alert(result.message);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Failed to toggle blacklist:', error);
      alert('블랙리스트 변경에 실패했습니다.');
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn('text-sm', statusBadge.className)}
              >
                {statusBadge.label}
              </Badge>
              <DialogTitle>{application.applicantName}</DialogTitle>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={
                  application.workerManagement?.is_favorite
                    ? 'default'
                    : 'outline'
                }
                onClick={handleToggleFavorite}
              >
                <Star
                  className={cn(
                    'size-4',
                    application.workerManagement?.is_favorite &&
                      'fill-yellow-400 text-yellow-400'
                  )}
                />
              </Button>
              <Button
                size="sm"
                variant={
                  application.workerManagement?.is_blacklisted
                    ? 'destructive'
                    : 'outline'
                }
                onClick={handleToggleBlacklist}
              >
                <XCircle className="size-4" />
              </Button>
            </div>
          </div>
          <DialogDescription>{application.postTitle}에 지원</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 워커 평가 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">워커 평가</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRatingClick(star)}
                    disabled={isSavingRating}
                    className="disabled:opacity-50"
                  >
                    <Star
                      className={cn(
                        'size-6 transition-colors cursor-pointer',
                        star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 hover:text-yellow-200'
                      )}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-sm text-gray-600">
                    {rating}점
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 워커 메모 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">워커 메모</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="이 워커에 대한 메모를 작성하세요..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
              <Button
                size="sm"
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
              >
                {isSavingNotes ? '저장 중...' : '메모 저장'}
              </Button>
            </CardContent>
          </Card>
          {/* 지원자 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">지원자 기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage
                    src={
                      application.applicantPhoto || '/images/default-avatar.png'
                    }
                    alt={application.applicantName}
                  />
                  <AvatarFallback className="text-xl">
                    {application.applicantName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">
                    {application.applicantName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    ID: {application.applicantId}
                  </p>
                </div>
              </div>

              {application.applicantInfo && (
                <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                  {application.applicantInfo.age && (
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-gray-500">나이</Label>
                      <p className="font-semibold">
                        {application.applicantInfo.age}세
                      </p>
                    </div>
                  )}
                  {application.applicantInfo.gender && (
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-gray-500">성별</Label>
                      <p className="font-semibold">
                        {application.applicantInfo.gender}
                      </p>
                    </div>
                  )}
                  {application.applicantInfo.kakaoId && (
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-gray-500">카카오톡</Label>
                      <p className="font-semibold">
                        {application.applicantInfo.kakaoId}
                      </p>
                    </div>
                  )}
                  {application.applicantInfo.attendanceScore && (
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-gray-500">근태 점수</Label>
                      <div className="flex items-center gap-1">
                        <Star className="size-4 fill-yellow-400 text-yellow-400" />
                        <p className="font-semibold">
                          {application.applicantInfo.attendanceScore}점
                        </p>
                      </div>
                    </div>
                  )}
                  {application.applicantInfo.phone && (
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-gray-500">전화번호</Label>
                      <p className="font-semibold">
                        {application.applicantInfo.phone}
                      </p>
                    </div>
                  )}
                  {application.applicantInfo.email && (
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-gray-500">이메일</Label>
                      <p className="font-semibold text-xs">
                        {application.applicantInfo.email}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 신체 정보 */}
          {application.applicantInfo &&
            (application.applicantInfo.height ||
              application.applicantInfo.weight) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">신체 정보</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {application.applicantInfo.height && (
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-gray-500 flex items-center gap-2">
                          <Ruler className="size-4" />키
                        </Label>
                        <p className="font-semibold">
                          {application.applicantInfo.height}cm
                        </p>
                      </div>
                    )}
                    {application.applicantInfo.weight && (
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-gray-500 flex items-center gap-2">
                          <Weight className="size-4" />
                          몸무게
                        </Label>
                        <p className="font-semibold">
                          {application.applicantInfo.weight}kg
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* 서류 제출 현황 */}
          {application.applicantInfo?.documents && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">서류 제출 현황</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    {application.applicantInfo.documents.idCard ? (
                      <CheckCircle2 className="size-4 text-green-500" />
                    ) : (
                      <XCircle className="size-4 text-red-500" />
                    )}
                    <div className="flex items-center gap-1">
                      <IdCard className="size-4 text-gray-500" />
                      <span className="text-sm">신분증</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {application.applicantInfo.documents.bankbook ? (
                      <CheckCircle2 className="size-4 text-green-500" />
                    ) : (
                      <XCircle className="size-4 text-red-500" />
                    )}
                    <div className="flex items-center gap-1">
                      <CreditCard className="size-4 text-gray-500" />
                      <span className="text-sm">통장사본</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {application.applicantInfo.documents.healthCertificate ? (
                      <CheckCircle2 className="size-4 text-green-500" />
                    ) : (
                      <XCircle className="size-4 text-red-500" />
                    )}
                    <div className="flex items-center gap-1">
                      <FileCheck className="size-4 text-gray-500" />
                      <span className="text-sm">보건증</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {application.applicantInfo.documents.extraDocuments?.includes(
                      'driverLicense'
                    ) ? (
                      <CheckCircle2 className="size-4 text-green-500" />
                    ) : (
                      <XCircle className="size-4 text-red-500" />
                    )}
                    <div className="flex items-center gap-1">
                      <Car className="size-4 text-gray-500" />
                      <span className="text-sm">운전면허증</span>
                    </div>
                  </div>
                </div>

                {/* 자격증 */}
                {application.applicantInfo.documents.certificates &&
                  application.applicantInfo.documents.certificates.length >
                    0 && (
                    <div className="mt-4 pt-4 border-t">
                      <Label className="text-sm text-gray-500 flex items-center gap-2 mb-2">
                        <Award className="size-4" />
                        자격증
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {application.applicantInfo.documents.certificates.map(
                          (cert, index) => (
                            <Badge key={index} variant="secondary">
                              {cert}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* 어학 능력 */}
                {application.applicantInfo.documents.language &&
                  application.applicantInfo.documents.language.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <Label className="text-sm text-gray-500 flex items-center gap-2 mb-2">
                        <Languages className="size-4" />
                        어학 능력
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {application.applicantInfo.documents.language.map(
                          (lang, index) => (
                            <Badge key={index} variant="secondary">
                              {lang}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          )}

          {/* 성격 및 특징 */}
          {application.applicantInfo &&
            (application.applicantInfo.personality ||
              application.applicantInfo.features) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">성격 및 특징</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {application.applicantInfo.personality && (
                    <div>
                      <Label className="text-sm text-gray-500 flex items-center gap-2 mb-1">
                        <Smile className="size-4" />
                        성격
                      </Label>
                      <p className="text-sm leading-relaxed">
                        {application.applicantInfo.personality}
                      </p>
                    </div>
                  )}
                  {application.applicantInfo.features && (
                    <div>
                      <Label className="text-sm text-gray-500 flex items-center gap-2 mb-1">
                        <Star className="size-4" />
                        특징
                      </Label>
                      <p className="text-sm leading-relaxed">
                        {application.applicantInfo.features}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          {/* 경력 및 소개 */}
          {application.applicantInfo &&
            (application.applicantInfo.experiences ||
              application.applicantInfo.introduction) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">경력 및 자기소개</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {application.applicantInfo.experiences && (
                    <div>
                      <Label className="text-sm text-gray-500 flex items-center gap-2 mb-1">
                        <Briefcase className="size-4" />
                        경력
                      </Label>
                      <p className="text-sm leading-relaxed">
                        {application.applicantInfo.experiences.map(
                          (experience) => (
                            <div key={experience.title}>
                              <p>{experience.title}</p>
                              <p>{experience.date}</p>
                              <p>{experience.location}</p>
                            </div>
                          )
                        )}
                      </p>
                    </div>
                  )}
                  {application.applicantInfo.introduction && (
                    <div>
                      <Label className="text-sm text-gray-500 flex items-center gap-2 mb-1">
                        <FileText className="size-4" />
                        자기소개
                      </Label>
                      <p className="text-sm leading-relaxed">
                        {application.applicantInfo.introduction}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          {/* 공고 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">지원한 공고</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-gray-500">공고명</Label>
                <p className="font-semibold">{application.postTitle}</p>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm text-gray-500">근무일</Label>
                <p className="font-semibold">{application.postDate}</p>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm text-gray-500">근무 장소</Label>
                <p className="font-semibold">{application.postLocation}</p>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm text-gray-500">지원일</Label>
                <p className="font-semibold">
                  {format(parseISO(application.appliedAt), 'yyyy년 MM월 dd일', {
                    locale: ko,
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 지원 메시지 */}
          {application.message && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">지원 메시지</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {application.message}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex justify-between items-center">
          <div className="flex gap-2">
            {application.status === 'pending' && (
              <>
                <Button
                  variant="default"
                  onClick={() => {
                    onStatusChange(application.id, 'accepted');
                    onClose();
                  }}
                >
                  <CheckCircle2 className="size-4 mr-2" />
                  승인
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    onStatusChange(application.id, 'rejected');
                    onClose();
                  }}
                >
                  <XCircle className="size-4 mr-2" />
                  거절
                </Button>
              </>
            )}
          </div>
          <Button type="button" variant="outline" onClick={onClose}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
