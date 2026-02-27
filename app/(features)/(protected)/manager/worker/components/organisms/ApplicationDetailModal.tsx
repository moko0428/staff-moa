'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
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
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  IdCard,
  CreditCard,
  FileCheck,
  Car,
  Award,
  Languages,
  Briefcase,
  FileText,
  Info,
  MessageSquare,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { updateWorkerRatingAction, updateWorkerNotesAction } from '../../actions';
import { isPastSchedule } from '../../utils/workerHelpers';
import type { ApplicationWithPost, ApplicationStatus } from '../../types';

interface ApplicationDetailModalProps {
  application: ApplicationWithPost;
  onClose: () => void;
  onStatusChange: (applicationId: string, newStatus: ApplicationStatus) => void;
  onDataChange: (
    workerId: string,
    data: Partial<ApplicationWithPost['workerManagement']>
  ) => void;
}

export const ApplicationDetailModal = ({
  application,
  onClose,
  onStatusChange,
  onDataChange,
}: ApplicationDetailModalProps) => {
  const [rating, setRating] = useState(
    application.workerManagement?.rating || 0
  );
  const [notes, setNotes] = useState(application.workerManagement?.notes || '');
  const [isSavingRating, setIsSavingRating] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const isPast = isPastSchedule({
    postDate: application.postDate,
    workSlots: application.workSlots,
  });

  const effectiveStatus: ApplicationStatus = isPast
    ? 'accepted'
    : application.status;

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

  const isWorkCompleted = () => {
    if (application.postStatus !== 'completed') return false;

    const now = new Date();

    if (application.workSlots && application.workSlots.length > 0) {
      const lastSlot = application.workSlots[application.workSlots.length - 1];
      const lastWorkDateTime = new Date(
        `${lastSlot.date}T${lastSlot.end_time || '23:59'}:00`
      );
      return now > lastWorkDateTime;
    }

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
        newRating
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
        notes
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

  const vis = application.applicantInfo?.profileVisibility;

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
                              : 'text-muted-foreground/50 hover:text-yellow-200'
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

          {application.applicantInfo?.documents && vis?.documents !== false &&
            (() => {
              const docs = application.applicantInfo.documents!;
              const hasIdCard = !!docs.idCard;
              const hasBankbook = !!docs.bankbook;
              const hasHealthCert = !!docs.healthCertificate;
              const hasDriverLicense =
                docs.extraDocuments?.includes('driverLicense');
              const hasCertificates =
                docs.certificates &&
                docs.certificates.length > 0 &&
                vis?.certificates !== false;
              const hasLanguage =
                docs.language &&
                docs.language.length > 0 &&
                vis?.languages !== false;
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
                    {(hasIdCard || hasBankbook || hasHealthCert || hasDriverLicense) && (
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
                    {hasCertificates && (
                      <div
                        className={cn(
                          'mt-4 pt-4',
                          (hasIdCard || hasBankbook || hasHealthCert || hasDriverLicense) &&
                            'border-t'
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
                    {hasLanguage && (
                      <div
                        className={cn(
                          'mt-4 pt-4',
                          (hasIdCard || hasBankbook || hasHealthCert || hasDriverLicense || hasCertificates) &&
                            'border-t'
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

          {application.applicantInfo &&
            vis?.experiences !== false &&
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
                          )
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

          {application.message && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">전달 내용</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(() => {
                  const messageText = application.message!
                    .split('[전달 정보:')[0]
                    .trim();
                  const transferInfoMatch = application.message!.match(
                    /\[전달 정보:\s*([^\]]+)\]/
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
                                  {application.applicantInfo?.experiences &&
                                    application.applicantInfo.experiences
                                      .length > 0 && (
                                      <div>
                                        <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                          <Briefcase className="size-3" />
                                          경력 (
                                          {
                                            application.applicantInfo.experiences
                                              .length
                                          }
                                          개)
                                        </Label>
                                        <div className="space-y-1 bg-muted p-2 rounded">
                                          {application.applicantInfo.experiences.map(
                                            (exp, idx) => (
                                              <div key={idx} className="text-xs">
                                                <p className="font-medium">
                                                  {exp.title}
                                                </p>
                                                <p className="text-muted-foreground">
                                                  {exp.date} · {exp.location}
                                                </p>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}
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
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}
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
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  {application.applicantInfo?.documents &&
                                    (() => {
                                      const docs =
                                        application.applicantInfo.documents!;
                                      const submittedDocs = [];
                                      if (docs.idCard)
                                        submittedDocs.push({ label: '신분증' });
                                      if (docs.bankbook)
                                        submittedDocs.push({ label: '통장사본' });
                                      if (docs.healthCertificate)
                                        submittedDocs.push({ label: '보건증' });
                                      if (
                                        docs.extraDocuments?.includes(
                                          'driverLicense'
                                        )
                                      )
                                        submittedDocs.push({
                                          label: '운전면허증',
                                        });

                                      if (submittedDocs.length === 0) return null;

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
};
