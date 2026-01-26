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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/components/ui/popover';
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
  Info,
  Mail,
  MessageSquare,
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
    status: 'recruiting' | 'completed' | 'urgent';
  } | null;
  profiles?: {
    user_id: string;
    name: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    attendance_score: number;
    birth_date: string | null;
    gender: string | null;
    kakao_id: string | null;
    mbti: string | null;
    height: number | null;
    weight: number | null;
    personality: string | null;
    features: string | null;
    bio: string | null;
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
  postStatus?: 'recruiting' | 'completed' | 'urgent';
  workSlots?: Array<{ date: string; start_time?: string; end_time?: string }>;
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
    mbti?: string | null;
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
function convertToApplicationWithPost(
  data: ApplicantData,
): ApplicationWithPost {
  const profile = data.profiles;
  const post = data.posts;

  // JSONB 필드 파싱
  const rawExperiences = profile?.experiences;
  const experiences = Array.isArray(rawExperiences)
    ? rawExperiences.filter(
        (item): item is { title?: string; date?: string; location?: string } =>
          typeof item === 'object' && item !== null,
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

  // birth_date에서 age 계산
  const calculateAge = (birthDate: string | null): number | null => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  const age = calculateAge(profile?.birth_date || null);

  return {
    id: data.member_schedule_id,
    postId: data.post_id,
    applicantId: data.member_id,
    applicantName: profile?.name || '알 수 없음',
    postTitle: post?.title || '',
    postDate: post?.work_date || '',
    postLocation: post?.location || '',
    postStatus: post?.status,
    workSlots: Array.isArray(post?.work_slots)
      ? (
          post.work_slots as Array<{
            date: string;
            start_time?: string;
            end_time?: string;
          }>
        ).map((slot) => ({
          date: slot.date,
          start_time: slot.start_time,
          end_time: slot.end_time,
        }))
      : undefined,
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
          age: age,
          gender: profile.gender,
          kakaoId: profile.kakao_id,
          mbti: profile.mbti,
          height: profile.height,
          weight: profile.weight,
          personality: profile.personality,
          features: profile.features,
          introduction: profile.bio,
          experiences,
          documents,
        }
      : undefined,
    applicantPhoto: profile?.avatar || undefined,
    applicantAttendanceScore: profile?.attendance_score,
    applicantKakaoId: profile?.kakao_id || undefined,
    applicantGender: profile?.gender || undefined,
    applicantAge: age || undefined,
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
    'all',
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
            convertToApplicationWithPost(item as unknown as ApplicantData),
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
          app.postTitle.toLowerCase().includes(searchTerm.toLowerCase()),
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
    newStatus: ApplicationStatus,
  ) => {
    // pending 상태는 처리하지 않음
    if (newStatus === 'pending') {
      return;
    }

    try {
      // 서버 액션 호출
      const result = await updateApplicantStatusAction(
        applicationId,
        newStatus,
      );

      if (result.ok) {
        // 로컬 상태 업데이트
        setApplications((prev) =>
          prev.map((app) =>
            app.id === applicationId ? { ...app, status: newStatus } : app,
          ),
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
                  applicantAttendanceScore:
                    application.applicantAttendanceScore,
                  applicantPhoto: application.applicantPhoto,
                }}
                workerManagement={application.workerManagement}
                onCardClick={() => setSelectedApplication(application)}
                onStatusChange={handleStatusChange}
                onToggleFavorite={async (applicantId) => {
                  const result = await toggleFavoriteAction(applicantId);
                  if (result.ok) {
                    setApplications((prev) =>
                      prev.map((app) =>
                        app.applicantId === applicantId
                          ? {
                              ...app,
                              workerManagement: {
                                ...app.workerManagement,
                                is_favorite: !app.workerManagement?.is_favorite,
                              },
                            }
                          : app,
                      ),
                    );
                  }
                }}
                onToggleBlacklist={async (applicantId) => {
                  const result = await toggleBlacklistAction(applicantId);
                  if (result.ok) {
                    setApplications((prev) =>
                      prev.map((app) =>
                        app.applicantId === applicantId
                          ? {
                              ...app,
                              workerManagement: {
                                ...app.workerManagement,
                                is_blacklisted:
                                  !app.workerManagement?.is_blacklisted,
                              },
                            }
                          : app,
                      ),
                    );
                  }
                }}
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
                  : app,
              ),
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
    data: Partial<ApplicationWithPost['workerManagement']>,
  ) => void;
}

function ApplicationDetailModal({
  application,
  onClose,
  onStatusChange,
  onDataChange,
}: ApplicationDetailModalProps) {
  const [rating, setRating] = useState(
    application.workerManagement?.rating || 0,
  );
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

  // 근무 완료 여부 확인: 모집 완료 + 근무시간 완료
  const isWorkCompleted = () => {
    // 1. 모집 상태가 완료되어야 함
    if (application.postStatus !== 'completed') {
      return false;
    }

    // 2. 근무시간이 완료되었는지 확인
    const now = new Date();

    // work_slots가 있는 경우
    if (application.workSlots && application.workSlots.length > 0) {
      // 모든 슬롯의 마지막 날짜와 시간을 확인
      const lastSlot = application.workSlots[application.workSlots.length - 1];
      const lastWorkDateTime = new Date(
        `${lastSlot.date}T${lastSlot.end_time || '23:59'}:00`,
      );
      return now > lastWorkDateTime;
    }

    // work_date가 있는 경우 (레거시)
    if (application.postDate) {
      const workDate = new Date(application.postDate);
      return now > workDate;
    }

    return false;
  };

  const canEvaluateWorker = isWorkCompleted();

  const handleRatingClick = async (newRating: number) => {
    setIsSavingRating(true);
    try {
      const result = await updateWorkerRatingAction(
        application.applicantId,
        newRating,
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
        notes,
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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn('text-sm', statusBadge.className)}
            >
              {statusBadge.label}
            </Badge>
            <DialogTitle>{application.postTitle}</DialogTitle>
          </div>
          <DialogDescription></DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 워커 평가 - 근무 완료 시에만 표시 */}
          {canEvaluateWorker && (
            <>
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
                              : 'text-gray-300 hover:text-yellow-200',
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
            </>
          )}
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
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">
                    {application.applicantName}
                  </h3>
                  {application.applicantInfo?.email && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Mail className="size-3" />
                      <span>{application.applicantInfo.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                {/* 근태점수는 무조건 표시 */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-gray-500">근태 점수</Label>
                  <div className="flex items-center gap-1">
                    <Star className="size-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">
                      {application.applicantInfo?.attendanceScore ?? 50}점
                    </span>
                  </div>
                </div>
                {application.applicantInfo?.kakaoId && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-gray-500">카카오톡</Label>
                    <p className="font-semibold">
                      {application.applicantInfo.kakaoId}
                    </p>
                  </div>
                )}
                {application.applicantInfo?.phone && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-gray-500">전화번호</Label>
                    <p className="font-semibold">
                      {application.applicantInfo.phone}
                    </p>
                  </div>
                )}
                {application.applicantInfo?.mbti && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-gray-500">MBTI</Label>
                    <p className="font-semibold">
                      {application.applicantInfo.mbti}
                    </p>
                  </div>
                )}
                {application.applicantInfo?.gender && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-gray-500">성별</Label>
                    <p className="font-semibold">
                      {application.applicantInfo.gender}
                    </p>
                  </div>
                )}
                {application.applicantInfo?.age && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-gray-500">나이</Label>
                    <p className="font-semibold">
                      {application.applicantInfo.age}세
                    </p>
                  </div>
                )}
                {application.applicantInfo?.height && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-gray-500 flex items-center gap-1">
                      <Ruler className="size-3" />키
                    </Label>
                    <p className="font-semibold">
                      {application.applicantInfo.height}cm
                    </p>
                  </div>
                )}
                {application.applicantInfo?.weight && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-gray-500 flex items-center gap-1">
                      <Weight className="size-3" />
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

          {/* 서류 제출 현황 */}
          {application.applicantInfo?.documents &&
            (() => {
              const docs = application.applicantInfo.documents;
              const hasIdCard = !!docs.idCard;
              const hasBankbook = !!docs.bankbook;
              const hasHealthCert = !!docs.healthCertificate;
              const hasDriverLicense =
                docs.extraDocuments?.includes('driverLicense');
              const hasCertificates =
                docs.certificates && docs.certificates.length > 0;
              const hasLanguage = docs.language && docs.language.length > 0;

              // 제출한 서류가 하나라도 있는지 확인
              const hasAnyDocument =
                hasIdCard ||
                hasBankbook ||
                hasHealthCert ||
                hasDriverLicense ||
                hasCertificates ||
                hasLanguage;

              if (!hasAnyDocument) return null;

              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">서류 제출 현황</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* 기본 서류 (제출한 것만 표시) */}
                    {(hasIdCard ||
                      hasBankbook ||
                      hasHealthCert ||
                      hasDriverLicense) && (
                      <div className="grid grid-cols-2 gap-3">
                        {hasIdCard && (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-green-500" />
                            <div className="flex items-center gap-1">
                              <IdCard className="size-4 text-gray-500" />
                              <span className="text-sm">신분증</span>
                            </div>
                          </div>
                        )}
                        {hasBankbook && (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-green-500" />
                            <div className="flex items-center gap-1">
                              <CreditCard className="size-4 text-gray-500" />
                              <span className="text-sm">통장사본</span>
                            </div>
                          </div>
                        )}
                        {hasHealthCert && (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-green-500" />
                            <div className="flex items-center gap-1">
                              <FileCheck className="size-4 text-gray-500" />
                              <span className="text-sm">보건증</span>
                            </div>
                          </div>
                        )}
                        {hasDriverLicense && (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-green-500" />
                            <div className="flex items-center gap-1">
                              <Car className="size-4 text-gray-500" />
                              <span className="text-sm">운전면허증</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 자격증 */}
                    {hasCertificates && (
                      <div
                        className={cn(
                          'mt-4 pt-4',
                          (hasIdCard ||
                            hasBankbook ||
                            hasHealthCert ||
                            hasDriverLicense) &&
                            'border-t',
                        )}
                      >
                        <Label className="text-sm text-gray-500 flex items-center gap-2 mb-2">
                          <Award className="size-4" />
                          자격증
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {docs.certificates!.map((cert, index) => (
                            <Badge key={index} variant="secondary">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 어학 능력 */}
                    {hasLanguage && (
                      <div
                        className={cn(
                          'mt-4 pt-4',
                          (hasIdCard ||
                            hasBankbook ||
                            hasHealthCert ||
                            hasDriverLicense ||
                            hasCertificates) &&
                            'border-t',
                        )}
                      >
                        <Label className="text-sm text-gray-500 flex items-center gap-2 mb-2">
                          <Languages className="size-4" />
                          어학 능력
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {docs.language!.map((lang, index) => (
                            <Badge key={index} variant="secondary">
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })()}

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
                              <h2>{experience.title}</h2>
                              <span>{experience.date}</span>
                              <span>{experience.location}</span>
                            </div>
                          ),
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

          {/* 전달 내용 */}
          {application.message && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">전달 내용</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* 지원 메시지 */}
                {(() => {
                  // 메시지에서 전달 정보 부분을 분리
                  const messageText = application.message
                    .split('[전달 정보:')[0]
                    .trim();
                  const transferInfoMatch = application.message.match(
                    /\[전달 정보:\s*([^\]]+)\]/,
                  );
                  const transferInfo = transferInfoMatch
                    ? transferInfoMatch[1].trim()
                    : '';

                  return (
                    <>
                      {messageText && (
                        <div>
                          <Label className="text-sm text-gray-500 flex items-center gap-2 mb-2">
                            <MessageSquare className="size-4" />
                            지원 메시지
                          </Label>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap line-clamp-3">
                              {messageText}
                            </p>
                            {messageText.length > 100 && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="px-0 h-auto mt-1"
                                  >
                                    전체 보기
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-96 max-h-96 overflow-y-auto">
                                  <div className="space-y-2">
                                    <h4 className="font-semibold text-sm">
                                      전체 메시지
                                    </h4>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                      {messageText}
                                    </p>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 전달 정보 */}
                      {transferInfo && (
                        <div>
                          <Label className="text-sm text-gray-500 flex items-center gap-2 mb-2">
                            <Info className="size-4" />
                            전달 정보
                          </Label>
                          <div className="flex items-center gap-2">
                            <div className="bg-blue-50 px-3 py-2 rounded-lg flex-1">
                              <p className="text-sm text-blue-900">
                                {transferInfo}
                              </p>
                            </div>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm">
                                  상세보기
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80">
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-sm mb-2">
                                    전달 정보 상세
                                  </h4>

                                  {/* 경력 정보 */}
                                  {application.applicantInfo?.experiences &&
                                    application.applicantInfo.experiences
                                      .length > 0 && (
                                      <div>
                                        <Label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                                          <Briefcase className="size-3" />
                                          경력 (
                                          {
                                            application.applicantInfo
                                              .experiences.length
                                          }
                                          개)
                                        </Label>
                                        <div className="space-y-1 bg-gray-50 p-2 rounded">
                                          {application.applicantInfo.experiences.map(
                                            (exp, idx) => (
                                              <div
                                                key={idx}
                                                className="text-xs"
                                              >
                                                <p className="font-medium">
                                                  {exp.title}
                                                </p>
                                                <p className="text-gray-600">
                                                  {exp.date} · {exp.location}
                                                </p>
                                              </div>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    )}

                                  {/* 자격증 */}
                                  {application.applicantInfo?.documents
                                    ?.certificates &&
                                    application.applicantInfo.documents
                                      .certificates.length > 0 && (
                                      <div>
                                        <Label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                                          <Award className="size-3" />
                                          자격증 (
                                          {
                                            application.applicantInfo.documents
                                              .certificates.length
                                          }
                                          개)
                                        </Label>
                                        <div className="flex flex-wrap gap-1">
                                          {application.applicantInfo.documents.certificates.map(
                                            (cert, idx) => (
                                              <Badge
                                                key={idx}
                                                variant="secondary"
                                                className="text-xs"
                                              >
                                                {cert}
                                              </Badge>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    )}

                                  {/* 어학 능력 */}
                                  {application.applicantInfo?.documents
                                    ?.language &&
                                    application.applicantInfo.documents.language
                                      .length > 0 && (
                                      <div>
                                        <Label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                                          <Languages className="size-3" />
                                          어학 능력 (
                                          {
                                            application.applicantInfo.documents
                                              .language.length
                                          }
                                          개)
                                        </Label>
                                        <div className="flex flex-wrap gap-1">
                                          {application.applicantInfo.documents.language.map(
                                            (lang, idx) => (
                                              <Badge
                                                key={idx}
                                                variant="secondary"
                                                className="text-xs"
                                              >
                                                {lang}
                                              </Badge>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    )}

                                  {/* 서류 제출 현황 (제출한 것만 표시) */}
                                  {application.applicantInfo?.documents &&
                                    (() => {
                                      const docs =
                                        application.applicantInfo.documents;
                                      const submittedDocs = [];

                                      if (docs.idCard)
                                        submittedDocs.push({
                                          icon: CheckCircle2,
                                          label: '신분증',
                                        });
                                      if (docs.bankbook)
                                        submittedDocs.push({
                                          icon: CheckCircle2,
                                          label: '통장사본',
                                        });
                                      if (docs.healthCertificate)
                                        submittedDocs.push({
                                          icon: CheckCircle2,
                                          label: '보건증',
                                        });
                                      if (
                                        docs.extraDocuments?.includes(
                                          'driverLicense',
                                        )
                                      )
                                        submittedDocs.push({
                                          icon: CheckCircle2,
                                          label: '운전면허증',
                                        });

                                      if (submittedDocs.length === 0)
                                        return null;

                                      return (
                                        <div>
                                          <Label className="text-xs text-gray-500 mb-1 block">
                                            서류 제출
                                          </Label>
                                          <div className="grid grid-cols-2 gap-1 text-xs">
                                            {submittedDocs.map((doc, idx) => (
                                              <div
                                                key={idx}
                                                className="flex items-center gap-1"
                                              >
                                                <CheckCircle2 className="size-3 text-green-500" />
                                                <span>{doc.label}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    })()}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
