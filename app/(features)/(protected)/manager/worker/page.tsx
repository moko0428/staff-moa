'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';
import Hero from '@/app/components/Hero';
import { toast } from 'sonner';
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
  getManagedWorkersAction,
} from './actions';

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
  Calendar,
  MapPin,
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
    bio: string | null;
    experiences: unknown;
    documents: unknown;
    profile_visibility: unknown;
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
    profileVisibility?: {
      email?: boolean;
      phone?: boolean;
      kakaoId?: boolean;
      age?: boolean;
      gender?: boolean;
      experiences?: boolean;
      documents?: boolean;
      certificates?: boolean;
      languages?: boolean;
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

// 통합된 워커 타입 (여러 스케줄을 포함)
interface GroupedWorker {
  applicantId: string;
  applicantName: string;
  applicantPhoto?: string;
  applicantAttendanceScore?: number;
  applicantKakaoId?: string;
  applicantGender?: string;
  applicantAge?: number;
  applicantInfo?: ApplicationWithPost['applicantInfo'];
  workerManagement?: ApplicationWithPost['workerManagement'];
  schedules: Array<{
    id: string;
    postId: number;
    postTitle: string;
    postDate: string;
    postLocation: string;
    postStatus?: 'recruiting' | 'completed' | 'urgent';
    appliedAt: string;
    status: ApplicationStatus;
    message?: string | null;
  }>;
}

type TabType = 'all' | 'favorite' | 'blacklist';

const isPastSchedule = (input: {
  postDate?: string;
  workSlots?: Array<{ date: string; end_time?: string }>;
}): boolean => {
  const now = new Date();

  // work_slots가 있는 경우: 마지막 슬롯의 종료시간 기준
  if (input.workSlots && input.workSlots.length > 0) {
    const lastSlot = input.workSlots[input.workSlots.length - 1];
    const endTime =
      typeof lastSlot.end_time === 'string' && /^\d{2}:\d{2}$/.test(lastSlot.end_time)
        ? lastSlot.end_time
        : '23:59';
    const lastWorkDateTime = new Date(`${lastSlot.date}T${endTime}:00`);
    if (!Number.isNaN(lastWorkDateTime.getTime())) {
      return now > lastWorkDateTime;
    }
  }

  // work_date가 있는 경우 (레거시): 당일 23:59 기준
  if (input.postDate) {
    const lastWorkDateTime = new Date(`${input.postDate}T23:59:00`);
    if (!Number.isNaN(lastWorkDateTime.getTime())) {
      return now > lastWorkDateTime;
    }
  }

  return false;
};

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
          introduction: profile.bio,
          experiences,
          documents,
          profileVisibility: typeof profile?.profile_visibility === 'object' && profile?.profile_visibility !== null
            ? (profile.profile_visibility as Record<string, boolean>)
            : undefined,
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
  const [selectedWorkerProfile, setSelectedWorkerProfile] =
    useState<GroupedWorker | null>(null);
  const [applications, setApplications] = useState<ApplicationWithPost[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  // 지원자 데이터 가져오기
  useEffect(() => {
    const fetchApplicants = async () => {
      setIsLoading(true);
      try {
        // 지원자 목록과 즐겨찾기/블랙리스트 워커를 병렬로 가져오기
        const [applicantsResult, managedResult] = await Promise.all([
          getApplicantsAction(),
          getManagedWorkersAction(),
        ]);

        const convertedData = applicantsResult.ok && applicantsResult.data
          ? applicantsResult.data.map((item) =>
              convertToApplicationWithPost(item as unknown as ApplicantData),
            )
          : [];

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

        // 즐겨찾기/블랙리스트 워커 중 지원자 목록에 없는 워커 추가
        const existingWorkerIds = new Set(convertedData.map((app) => app.applicantId));
        const managedWorkers = managedResult.ok && managedResult.data ? managedResult.data : [];

        const calculateAge = (birthDate: string | null): number | null => {
          if (!birthDate) return null;
          const today = new Date();
          const birth = new Date(birthDate);
          let age = today.getFullYear() - birth.getFullYear();
          const monthDiff = today.getMonth() - birth.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
          }
          return age;
        };

        const extraApplications: ApplicationWithPost[] = managedWorkers
          .filter((mw) => !existingWorkerIds.has(mw.worker_id))
          .map((mw) => ({
            id: `managed-${mw.worker_id}`,
            postId: 0,
            applicantId: mw.worker_id,
            applicantName: mw.profile?.name || '알 수 없음',
            postTitle: '',
            postDate: '',
            postLocation: '',
            appliedAt: '',
            status: 'accepted' as ApplicationStatus,
            applicantPhoto: mw.profile?.avatar || undefined,
            applicantAttendanceScore: mw.profile?.attendance_score,
            applicantKakaoId: mw.profile?.kakao_id || undefined,
            applicantGender: mw.profile?.gender || undefined,
            applicantAge: calculateAge(mw.profile?.birth_date || null) || undefined,
            applicantInfo: mw.profile ? {
              name: mw.profile.name,
              email: mw.profile.email,
              phone: mw.profile.phone,
              attendanceScore: mw.profile.attendance_score,
              gender: mw.profile.gender,
              kakaoId: mw.profile.kakao_id,
            } : undefined,
            workerManagement: {
              rating: mw.rating,
              notes: mw.notes,
              is_favorite: mw.is_favorite,
              is_blacklisted: mw.is_blacklisted,
            },
          }));

        setApplications([...applicationsWithManagement, ...extraApplications]);
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

  // 그룹화된 워커 목록 (모든 탭에서 사용)
  const groupedWorkers = useMemo(() => {
    let filtered = managerApplications;

    // 탭 필터
    if (activeTab === 'all') {
      filtered = filtered.filter(
        (app) => app.postStatus === 'recruiting' || app.postStatus === 'urgent',
      );
    } else if (activeTab === 'favorite') {
      filtered = filtered.filter((app) => app.workerManagement?.is_favorite);
    } else if (activeTab === 'blacklist') {
      filtered = filtered.filter((app) => app.workerManagement?.is_blacklisted);
    }

    // 상태 필터 (전체 탭에서만 적용)
    if (activeTab === 'all' && statusFilter !== 'all') {
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

    // applicantId 기준으로 그룹화
    const workerMap = new Map<string, GroupedWorker>();

    filtered.forEach((app) => {
      const existing = workerMap.get(app.applicantId);

      const scheduleItem = {
        id: app.id,
        postId: app.postId,
        postTitle: app.postTitle,
        postDate: app.postDate,
        postLocation: app.postLocation,
        postStatus: app.postStatus,
        appliedAt: app.appliedAt,
        status: app.status,
        message: app.message,
      };

      if (existing) {
        // 이미 있는 워커에 스케줄 추가
        existing.schedules.push(scheduleItem);
      } else {
        // 새 워커 추가
        workerMap.set(app.applicantId, {
          applicantId: app.applicantId,
          applicantName: app.applicantName,
          applicantPhoto: app.applicantPhoto,
          applicantAttendanceScore: app.applicantAttendanceScore,
          applicantKakaoId: app.applicantKakaoId,
          applicantGender: app.applicantGender,
          applicantAge: app.applicantAge,
          applicantInfo: app.applicantInfo,
          workerManagement: app.workerManagement,
          schedules: [scheduleItem],
        });
      }
    });

    // 스케줄을 최신순으로 정렬
    workerMap.forEach((worker) => {
      worker.schedules.sort(
        (a, b) => {
          const aDate = a.postDate ? new Date(a.postDate).getTime() : 0;
          const bDate = b.postDate ? new Date(b.postDate).getTime() : 0;
          if (aDate !== bDate) return bDate - aDate; // 근무일 최신순
          return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime(); // 동률이면 지원 최신순
        },
      );
    });

    // 배열로 변환 후 최근 지원 순으로 정렬
    return Array.from(workerMap.values()).sort((a, b) => {
      const aLatest = new Date(a.schedules[0]?.appliedAt || 0).getTime();
      const bLatest = new Date(b.schedules[0]?.appliedAt || 0).getTime();
      return bLatest - aLatest;
    });
  }, [managerApplications, searchTerm, activeTab, statusFilter]);

  // 상태별 통계
  const statistics = useMemo(() => {
    // 활성 공고(recruiting/urgent)에 대한 지원만 통계에 반영
    const activeApplications = managerApplications.filter(
      (app) => app.postStatus === 'recruiting' || app.postStatus === 'urgent',
    );

    const uniqueApplicantCount = new Set(
      activeApplications
        .map((app) => app.applicantId)
        .filter((id): id is string => !!id),
    ).size;

    return {
      totalApplications: activeApplications.length,
      uniqueApplicants: uniqueApplicantCount,
      pending: activeApplications.filter((app) => app.status === 'pending')
        .length,
      accepted: activeApplications.filter((app) => app.status === 'accepted')
        .length,
      rejected: activeApplications.filter((app) => app.status === 'rejected')
        .length,
    };
  }, [managerApplications]);

  const formatStatCount = (value: number) =>
    new Intl.NumberFormat('ko-KR', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(value);

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

  const handleStatusChange = async (
    applicationId: string,
    newStatus: ApplicationStatus,
  ) => {
    try {
      // 서버 액션 호출 (pending/accepted/rejected 모두 지원)
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

        toast.success(result.message);
      } else {
        toast.error(result.message || '상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('상태 변경 중 오류가 발생했습니다.');
    }
  };

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
        {/* 필터 섹션 (좌측) */}
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

        {/* 지원자 카드 섹션 (우측) */}
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

      {/* 스탭 프로필 모달 */}
      {selectedWorkerProfile && (
        <StaffProfileModal
          worker={selectedWorkerProfile}
          onClose={() => setSelectedWorkerProfile(null)}
          onNotesChange={(workerId, notes) => {
            setApplications((prev) =>
              prev.map((app) =>
                app.applicantId === workerId
                  ? {
                      ...app,
                      workerManagement: { ...app.workerManagement, notes },
                    }
                  : app,
              ),
            );
            setSelectedWorkerProfile((prev) =>
              prev && prev.applicantId === workerId
                ? { ...prev, workerManagement: { ...prev.workerManagement, notes } }
                : prev,
            );
          }}
        />
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

  const isPast = isPastSchedule({
    postDate: application.postDate,
    workSlots: application.workSlots,
  });

  // 과거 스케줄이면 "승인"으로만 노출 + 상태 변경 불가
  const effectiveStatus: ApplicationStatus = isPast ? 'accepted' : application.status;

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
  }[effectiveStatus];

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
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Failed to update rating:', error);
      toast.error('평가 저장에 실패했습니다.');
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
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Failed to save notes:', error);
      toast.error('메모 저장에 실패했습니다.');
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
                              : 'text-muted-foreground/50 hover:text-yellow-200',
                          )}
                        />
                      </button>
                    ))}
                    {rating > 0 && (
                      <span className="ml-2 text-sm text-muted-foreground">
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
          {(() => {
            const vis = application.applicantInfo?.profileVisibility;
            return (
            <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">지원자 기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage
                    src={application.applicantPhoto}
                    alt={application.applicantName}
                  />
                  <AvatarFallback className="text-xl bg-primary/10 text-primary font-semibold">
                    {application.applicantName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">
                    {application.applicantName}
                  </h3>
                  {application.applicantInfo?.email && vis?.email !== false && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Mail className="size-3" />
                      <span>{application.applicantInfo.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                {/* 근태점수는 무조건 표시 */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-muted-foreground">근태 점수</Label>
                  <div className="flex items-center gap-1">
                    <Star className="size-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">
                      {application.applicantInfo?.attendanceScore ?? 50}점
                    </span>
                  </div>
                </div>
                {application.applicantInfo?.kakaoId && vis?.kakaoId !== false && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">카카오톡</Label>
                    <p className="font-semibold">
                      {application.applicantInfo.kakaoId}
                    </p>
                  </div>
                )}
                {application.applicantInfo?.phone && vis?.phone !== false && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">전화번호</Label>
                    <p className="font-semibold">
                      {application.applicantInfo.phone}
                    </p>
                  </div>
                )}
                {application.applicantInfo?.gender && vis?.gender !== false && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">성별</Label>
                    <p className="font-semibold">
                      {application.applicantInfo.gender}
                    </p>
                  </div>
                )}
                {application.applicantInfo?.age && vis?.age !== false && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">나이</Label>
                    <p className="font-semibold">
                      {application.applicantInfo.age}세
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 서류 제출 현황 */}
          {application.applicantInfo?.documents && vis?.documents !== false &&
            (() => {
              const docs = application.applicantInfo.documents;
              const hasIdCard = !!docs.idCard;
              const hasBankbook = !!docs.bankbook;
              const hasHealthCert = !!docs.healthCertificate;
              const hasDriverLicense =
                docs.extraDocuments?.includes('driverLicense');
              const hasCertificates =
                docs.certificates && docs.certificates.length > 0 && vis?.certificates !== false;
              const hasLanguage = docs.language && docs.language.length > 0 && vis?.languages !== false;

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
                              <IdCard className="size-4 text-muted-foreground" />
                              <span className="text-sm">신분증</span>
                            </div>
                          </div>
                        )}
                        {hasBankbook && (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-green-500" />
                            <div className="flex items-center gap-1">
                              <CreditCard className="size-4 text-muted-foreground" />
                              <span className="text-sm">통장사본</span>
                            </div>
                          </div>
                        )}
                        {hasHealthCert && (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-green-500" />
                            <div className="flex items-center gap-1">
                              <FileCheck className="size-4 text-muted-foreground" />
                              <span className="text-sm">보건증</span>
                            </div>
                          </div>
                        )}
                        {hasDriverLicense && (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-green-500" />
                            <div className="flex items-center gap-1">
                              <Car className="size-4 text-muted-foreground" />
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
                        <Label className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
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
                        <Label className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
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

          {/* 경력 및 소개 */}
          {application.applicantInfo && vis?.experiences !== false &&
            (application.applicantInfo.experiences ||
              application.applicantInfo.introduction) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">경력 및 자기소개</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {application.applicantInfo.experiences && (
                    <div>
                      <Label className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
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
                      <Label className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
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

            </>
            );
          })()}

          {/* 공고 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">지원한 공고</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">공고명</Label>
                <p className="font-semibold">{application.postTitle}</p>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">근무일</Label>
                <p className="font-semibold">{application.postDate}</p>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">근무 장소</Label>
                <p className="font-semibold">{application.postLocation}</p>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">지원일</Label>
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
                          <Label className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                            <MessageSquare className="size-4" />
                            지원 메시지
                          </Label>
                          <div className="bg-muted p-3 rounded-lg">
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
                          <Label className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
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
                                        <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                          <Briefcase className="size-3" />
                                          경력 (
                                          {
                                            application.applicantInfo
                                              .experiences.length
                                          }
                                          개)
                                        </Label>
                                        <div className="space-y-1 bg-muted p-2 rounded">
                                          {application.applicantInfo.experiences.map(
                                            (exp, idx) => (
                                              <div
                                                key={idx}
                                                className="text-xs"
                                              >
                                                <p className="font-medium">
                                                  {exp.title}
                                                </p>
                                                <p className="text-muted-foreground">
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
                                        <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
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
                                        <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
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
                                          <Label className="text-xs text-muted-foreground mb-1 block">
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
            {!isPast && (
              <>
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
                {application.status === 'accepted' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        onStatusChange(application.id, 'pending');
                        onClose();
                      }}
                    >
                      <Clock className="size-4 mr-2" />
                      대기로 변경
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        onStatusChange(application.id, 'rejected');
                        onClose();
                      }}
                    >
                      <XCircle className="size-4 mr-2" />
                      거절로 변경
                    </Button>
                  </>
                )}
                {application.status === 'rejected' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        onStatusChange(application.id, 'pending');
                        onClose();
                      }}
                    >
                      <Clock className="size-4 mr-2" />
                      대기로 변경
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => {
                        onStatusChange(application.id, 'accepted');
                        onClose();
                      }}
                    >
                      <CheckCircle2 className="size-4 mr-2" />
                      승인으로 변경
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 그룹화된 워커 카드
interface GroupedWorkerCardProps {
  worker: GroupedWorker;
  onToggleFavorite: (applicantId: string) => void;
  onToggleBlacklist: (applicantId: string) => void;
  onScheduleClick: (scheduleId: string) => void;
  onStatusChange: (scheduleId: string, newStatus: ApplicationStatus) => void;
  onProfileClick: (worker: GroupedWorker) => void;
}

function GroupedWorkerCard({
  worker,
  onToggleFavorite,
  onToggleBlacklist,
  onScheduleClick,
  onStatusChange,
  onProfileClick,
}: GroupedWorkerCardProps) {
  const getStatusBadge = (status: ApplicationStatus) => {
    const badges = {
      pending: {
        label: '대기',
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
    };
    return badges[status];
  };

  // 별점 렌더링
  const renderRating = (rating?: number | null) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'size-3',
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground/30',
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
      onClick={() => onProfileClick(worker)}
    >
      <CardContent className="p-4">
        {/* 헤더: 워커 정보 */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage
                src={worker.applicantPhoto}
                alt={worker.applicantName}
              />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {worker.applicantName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{worker.applicantName}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {worker.applicantAge && <span>{worker.applicantAge}세</span>}
                {worker.applicantGender && (
                  <span>· {worker.applicantGender}</span>
                )}
              </div>
              {worker.workerManagement?.rating &&
                renderRating(worker.workerManagement.rating)}
            </div>
          </div>

          {/* 즐겨찾기/블랙리스트 버튼 */}
          <div className="flex flex-col gap-1">
            <Button
              size="sm"
              variant={worker.workerManagement?.is_favorite ? 'default' : 'outline'}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(worker.applicantId);
              }}
              className="h-7 w-7 p-0"
            >
              <Star
                className={cn(
                  'size-3',
                  worker.workerManagement?.is_favorite &&
                    'fill-yellow-400 text-yellow-400',
                )}
              />
            </Button>
            <Button
              size="sm"
              variant={
                worker.workerManagement?.is_blacklisted ? 'destructive' : 'outline'
              }
              onClick={(e) => {
                e.stopPropagation();
                onToggleBlacklist(worker.applicantId);
              }}
              className="h-7 w-7 p-0"
            >
              <XCircle className="size-3" />
            </Button>
          </div>
        </div>

        {/* 근태 점수 */}
        <div className="flex items-center gap-2 mb-3 text-sm">
          <Star className="size-4 fill-yellow-400 text-yellow-400" />
          <span className="text-muted-foreground">근태 점수:</span>
          <span className="font-medium">
            {worker.applicantAttendanceScore ?? 50}점
          </span>
        </div>

        {/* 메모 */}
        {worker.workerManagement?.notes && (
          <div className="mb-3 p-2 bg-muted rounded text-xs text-muted-foreground line-clamp-2">
            {worker.workerManagement.notes}
          </div>
        )}

        {/* 함께한 스케줄 목록 */}
        <div className="border-t pt-3">
          {worker.schedules.length > 0 && worker.schedules[0].postId !== 0 ? (
          <>
          <p className="text-sm font-medium mb-2 flex items-center gap-1">
            <Calendar className="size-4" />
            지원 내역 ({worker.schedules.length}건)
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {worker.schedules.map((schedule) => {
              const isPast = isPastSchedule({ postDate: schedule.postDate });
              const statusBadge = getStatusBadge(isPast ? 'accepted' : schedule.status);
              return (
                <div
                  key={schedule.id}
                  className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onScheduleClick(schedule.id);
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {schedule.postTitle}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            {schedule.postDate || '날짜 미정'}
                          </span>
                          {schedule.postLocation && (
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3" />
                              {schedule.postLocation.length > 10
                                ? `${schedule.postLocation.slice(0, 10)}...`
                                : schedule.postLocation}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn('text-xs shrink-0', statusBadge.className)}
                      >
                        {statusBadge.label}
                      </Badge>
                    </div>
                  </div>
                  {/* 상태 변경 버튼 */}
                  {!isPast && (
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50">
                    {schedule.status === 'pending' ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs text-green-600 hover:bg-green-50 hover:text-green-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(schedule.id, 'accepted');
                          }}
                        >
                          <CheckCircle2 className="size-3 mr-1" />
                          승인
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(schedule.id, 'rejected');
                          }}
                        >
                          <XCircle className="size-3 mr-1" />
                          거절
                        </Button>
                      </>
                    ) : schedule.status === 'accepted' ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(schedule.id, 'pending');
                          }}
                        >
                          <Clock className="size-3 mr-1" />
                          대기로
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(schedule.id, 'rejected');
                          }}
                        >
                          <XCircle className="size-3 mr-1" />
                          거절로
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(schedule.id, 'pending');
                          }}
                        >
                          <Clock className="size-3 mr-1" />
                          대기로
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs text-green-600 hover:bg-green-50 hover:text-green-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(schedule.id, 'accepted');
                          }}
                        >
                          <CheckCircle2 className="size-3 mr-1" />
                          승인으로
                        </Button>
                      </>
                    )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          </>
          ) : (
            <p className="text-sm text-muted-foreground">지원 내역이 없습니다.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// 스탭 프로필 모달
interface StaffProfileModalProps {
  worker: GroupedWorker;
  onClose: () => void;
  onNotesChange: (workerId: string, notes: string) => void;
}

function StaffProfileModal({
  worker,
  onClose,
  onNotesChange,
}: StaffProfileModalProps) {
  const [notes, setNotes] = useState(worker.workerManagement?.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const info = worker.applicantInfo;
  const vis = info?.profileVisibility;

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      const result = await updateWorkerNotesAction(worker.applicantId, notes);
      if (result.ok) {
        onNotesChange(worker.applicantId, notes);
        toast.success('메모가 저장되었습니다.');
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('메모 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 서류 정보 (visibility 반영)
  const docs = info?.documents;
  const hasIdCard = vis?.documents !== false && !!docs?.idCard;
  const hasBankbook = vis?.documents !== false && !!docs?.bankbook;
  const hasHealthCert = vis?.documents !== false && !!docs?.healthCertificate;
  const hasDriverLicense = vis?.documents !== false && docs?.extraDocuments?.includes('driverLicense');
  const hasCertificates = vis?.certificates !== false && docs?.certificates && docs.certificates.length > 0;
  const hasLanguage = vis?.languages !== false && docs?.language && docs.language.length > 0;
  const hasAnyDocument = hasIdCard || hasBankbook || hasHealthCert || hasDriverLicense || hasCertificates || hasLanguage;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">스탭 프로필</DialogTitle>
          <DialogDescription />
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <Avatar className="w-20 h-20">
            <AvatarImage
              src={worker.applicantPhoto}
              alt={worker.applicantName}
            />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary font-semibold">
              {worker.applicantName.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="text-center">
            <h3 className="text-xl font-semibold">{worker.applicantName}</h3>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-1">
              {vis?.age !== false && worker.applicantAge && <span>{worker.applicantAge}세</span>}
              {vis?.gender !== false && worker.applicantGender && <span>· {worker.applicantGender}</span>}
            </div>
          </div>

          {/* 근태 점수 */}
          <Badge variant="secondary" className="text-xs">
            근태 점수: {worker.applicantAttendanceScore ?? 50}점
          </Badge>

          {/* 기본 정보 */}
          {((vis?.phone !== false && info?.phone) || (vis?.kakaoId !== false && info?.kakaoId) || (vis?.email !== false && info?.email) || (vis?.gender !== false && info?.gender) || (vis?.age !== false && info?.age)) && (
            <div className="w-full space-y-2 p-4 bg-muted rounded-lg">
              {vis?.phone !== false && info?.phone && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">전화번호</span>
                  <span className="font-medium">{info.phone}</span>
                </div>
              )}
              {vis?.kakaoId !== false && info?.kakaoId && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">카카오톡</span>
                  <span className="font-medium">{info.kakaoId}</span>
                </div>
              )}
              {vis?.email !== false && info?.email && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">이메일</span>
                  <span className="font-medium">{info.email}</span>
                </div>
              )}
              {vis?.gender !== false && info?.gender && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">성별</span>
                  <span className="font-medium">{info.gender}</span>
                </div>
              )}
              {vis?.age !== false && info?.age && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">나이</span>
                  <span className="font-medium">{info.age}세</span>
                </div>
              )}
            </div>
          )}

          {/* 경력 및 자기소개 */}
          {vis?.experiences !== false && (info?.experiences?.length || info?.introduction) && (
            <div className="w-full space-y-3 p-4 bg-muted rounded-lg">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Briefcase className="size-4" />
                경력 및 자기소개
              </h4>
              {info?.experiences && info.experiences.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">경력</Label>
                  {info.experiences.map((exp, idx) => (
                    <div key={idx} className="text-sm border-l-2 border-primary/30 pl-3">
                      <p className="font-medium">{exp.title}</p>
                      <div className="text-xs text-muted-foreground flex gap-2">
                        {exp.date && <span>{exp.date}</span>}
                        {exp.location && <span>· {exp.location}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {info?.introduction && (
                <div>
                  <Label className="text-xs text-muted-foreground">자기소개</Label>
                  <p className="text-sm leading-relaxed">{info.introduction}</p>
                </div>
              )}
            </div>
          )}

          {/* 서류 제출 현황 */}
          {hasAnyDocument && (
            <div className="w-full space-y-3 p-4 bg-muted rounded-lg">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="size-4" />
                서류 제출 현황
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {hasIdCard && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="size-4 text-green-500" />
                    <span>신분증</span>
                  </div>
                )}
                {hasBankbook && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="size-4 text-green-500" />
                    <span>통장사본</span>
                  </div>
                )}
                {hasHealthCert && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="size-4 text-green-500" />
                    <span>보건증</span>
                  </div>
                )}
                {hasDriverLicense && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="size-4 text-green-500" />
                    <span>운전면허증</span>
                  </div>
                )}
              </div>
              {hasCertificates && (
                <div>
                  <Label className="text-xs text-muted-foreground">자격증</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {docs!.certificates!.map((cert, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {hasLanguage && (
                <div>
                  <Label className="text-xs text-muted-foreground">어학 능력</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {docs!.language!.map((lang, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 지원 메세지 */}
          {worker.schedules.some((s) => s.message) && (
            <div className="w-full space-y-3 p-4 bg-muted rounded-lg">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="size-4" />
                지원 메세지
              </h4>
              <div className="space-y-3">
                {worker.schedules
                  .filter((s) => s.message)
                  .map((s) => (
                    <div key={s.id} className="text-sm border-l-2 border-primary/30 pl-3">
                      <p className="text-xs text-muted-foreground mb-1">{s.postTitle}</p>
                      <p className="leading-relaxed whitespace-pre-wrap">{s.message}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 메모 */}
          <div className="w-full space-y-2">
            <Label className="text-sm font-medium">메모</Label>
            <Textarea
              placeholder="이 스탭에 대한 메모를 작성하세요..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
            <Button
              size="sm"
              onClick={handleSaveNotes}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? '저장 중...' : '메모 저장'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
