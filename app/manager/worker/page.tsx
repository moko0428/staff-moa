'use client';

import { useState, useMemo, useEffect } from 'react';
import Hero from '@/components/Hero';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { mockPosts, mockApplications, mockUsers } from '@/lib/mockData';
import { Application, User as UserType } from '@/types/mockData';
import WorkerCard from '@/components/WorkerCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

interface ApplicationWithPost extends Application {
  postTitle: string;
  postDate: string;
  postLocation: string;
  applicantInfo?: UserType;
  applicantPhoto?: string;
  applicantDocuments?: {
    idCard?: string;
    bankbook?: string;
    healthCertificate?: string;
    driverLicense?: string;
    certificates?: string[];
    language?: string[];
  };
  applicantAttendanceScore?: number;
  applicantKakaoId?: string;
  applicantGender?: string;
  applicantAge?: number;
  applicantBirthDate?: string;
  applicantHeight?: number;
  applicantWeight?: number;
}

export default function WorkerManagementPage() {
  const [currentUserId, setCurrentUserId] = useState<string>('manager-1');
  const [isMounted, setIsMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>(
    'all'
  );
  const [selectedApplication, setSelectedApplication] =
    useState<ApplicationWithPost | null>(null);
  const [applications, setApplications] =
    useState<Application[]>(mockApplications);

  useEffect(() => {
    setIsMounted(true);
    try {
      const userId =
        typeof window !== 'undefined'
          ? localStorage.getItem('userId') || 'manager-1'
          : 'manager-1';
      setCurrentUserId(userId);
    } catch {
      setCurrentUserId('manager-1');
    }
  }, []);

  // 현재 매니저의 공고에 지원한 지원자들
  const managerApplications = useMemo(() => {
    if (!isMounted || !currentUserId) return [];

    const managerPostIds = mockPosts
      .filter((post) => post.authorId === currentUserId)
      .map((post) => post.id);

    return applications
      .filter((app) => managerPostIds.includes(app.postId))
      .map((app) => {
        const post = mockPosts.find((p) => p.id === app.postId);
        const applicantInfo = mockUsers.find((u) => u.id === app.applicantId);
        return {
          ...app,
          postTitle: post?.title || '',
          postDate: post?.date || '',
          postLocation: post?.location || '',
          applicantInfo,
          applicantPhoto: applicantInfo?.photo,
          applicantDocuments: applicantInfo?.documents,
          applicantAttendanceScore: applicantInfo?.attendanceScore,
          applicantKakaoId: applicantInfo?.kakaoId,
          applicantGender: applicantInfo?.gender,
          applicantAge: applicantInfo?.age,
          applicantBirthDate: applicantInfo?.birthDate,
          applicantHeight: applicantInfo?.height,
          applicantWeight: applicantInfo?.weight,
        } as ApplicationWithPost;
      });
  }, [isMounted, currentUserId, applications]);

  // 필터링 및 검색
  const filteredApplications = useMemo(() => {
    let filtered = managerApplications;

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

    // 날짜순 정렬 (최신순)
    return filtered.sort(
      (a, b) =>
        new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
    );
  }, [managerApplications, statusFilter, searchTerm]);

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

  const handleStatusChange = (
    applicationId: string,
    newStatus: ApplicationStatus
  ) => {
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
  };

  return (
    <div>
      <Hero
        title="지원자 관리"
        description="공고에 지원한 지원자들을 확인하고 관리하세요"
      />

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4 mb-4 sm:mb-6">
        <Card>
          <CardContent className="pt-3 pb-3 sm:pt-6 sm:pb-6">
            <div className="flex items-center justify-between gap-1 sm:gap-2">
              <p className="text-[10px] sm:text-xs text-gray-500 leading-tight">
                전체
                <br className="block sm:hidden" /> 지원자
              </p>
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
            <div className="flex flex-col justify-between gap-1">
              <p className="text-[10px] sm:text-xs text-gray-500">대기중</p>
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
            <div className="flex flex-col justify-between gap-1">
              <p className="text-[10px] sm:text-xs text-gray-500">승인</p>
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
            <div className="flex flex-col justify-between gap-1">
              <p className="text-[10px] sm:text-xs text-gray-500">거절</p>
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

      {/* 필터 및 검색 */}
      <Card className="mb-4 sm:mb-6">
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
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
            <div className="w-full md:w-48">
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
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="py-10 sm:py-12 text-center">
              <User className="size-10 sm:size-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-gray-500">
                지원자가 없습니다.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredApplications.map((application) => (
            <WorkerCard
              key={application.id}
              application={{
                id: application.id,
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
              onCardClick={() => setSelectedApplication(application)}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>

      {/* 지원자 상세 모달 */}
      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onStatusChange={handleStatusChange}
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
}

function ApplicationDetailModal({
  application,
  onClose,
  onStatusChange,
}: ApplicationDetailModalProps) {
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
            <DialogTitle>{application.applicantName}</DialogTitle>
          </div>
          <DialogDescription>{application.postTitle}에 지원</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
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
                    {application.applicantInfo.documents.driverLicense ? (
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
