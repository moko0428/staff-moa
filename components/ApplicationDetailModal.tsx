// components/ApplicationDetailModal.tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Award,
  Car,
  CheckCircle2,
  CreditCard,
  FileCheck,
  FileText,
  IdCard,
  Languages,
  Ruler,
  Smile,
  Star,
  User,
  Weight,
  XCircle,
  Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Application, User as UserType } from '@/types/mockData';

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export interface ApplicationWithPost extends Application {
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

interface ApplicationDetailModalProps {
  application: ApplicationWithPost;
  onClose: () => void;
  onStatusChange: (applicationId: string, newStatus: ApplicationStatus) => void;
}

export default function ApplicationDetailModal({
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
                  {application.applicantInfo.attendanceScore !== undefined && (
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
                      <div className="space-y-2 text-sm leading-relaxed">
                        {application.applicantInfo.experiences.map(
                          (experience) => (
                            <div key={experience.title}>
                              <p>{experience.title}</p>
                              <p className="text-gray-500">
                                {experience.date} · {experience.location}
                              </p>
                            </div>
                          )
                        )}
                      </div>
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
                <button
                  className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  onClick={() => {
                    onStatusChange(application.id, 'accepted');
                    onClose();
                  }}
                >
                  <CheckCircle2 className="size-4 mr-2" />
                  승인
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    onStatusChange(application.id, 'rejected');
                    onClose();
                  }}
                >
                  <XCircle className="size-4 mr-2" />
                  거절
                </button>
              </>
            )}
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent"
            onClick={onClose}
          >
            닫기
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
