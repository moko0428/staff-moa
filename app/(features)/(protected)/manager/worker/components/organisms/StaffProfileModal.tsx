'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/app/components/ui/avatar';
import {
  CheckCircle2,
  Briefcase,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { updateWorkerNotesAction } from '../../actions';
import type { GroupedWorker } from '../../types';

interface StaffProfileModalProps {
  worker: GroupedWorker;
  onClose: () => void;
  onNotesChange: (workerId: string, notes: string) => void;
}

export const StaffProfileModal = ({
  worker,
  onClose,
  onNotesChange,
}: StaffProfileModalProps) => {
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

  const docs = info?.documents;
  const hasIdCard = vis?.documents !== false && !!docs?.idCard;
  const hasBankbook = vis?.documents !== false && !!docs?.bankbook;
  const hasHealthCert = vis?.documents !== false && !!docs?.healthCertificate;
  const hasDriverLicense =
    vis?.documents !== false &&
    docs?.extraDocuments?.includes('driverLicense');
  const hasCertificates =
    vis?.certificates !== false &&
    docs?.certificates &&
    docs.certificates.length > 0;
  const hasLanguage =
    vis?.languages !== false && docs?.language && docs.language.length > 0;
  const hasAnyDocument =
    hasIdCard ||
    hasBankbook ||
    hasHealthCert ||
    hasDriverLicense ||
    hasCertificates ||
    hasLanguage;

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
              {vis?.age !== false && worker.applicantAge && (
                <span>{worker.applicantAge}세</span>
              )}
              {vis?.gender !== false && worker.applicantGender && (
                <span>· {worker.applicantGender}</span>
              )}
            </div>
          </div>

          <Badge variant="secondary" className="text-xs">
            근태 점수: {worker.applicantAttendanceScore ?? 50}점
          </Badge>

          {((vis?.phone !== false && info?.phone) ||
            (vis?.kakaoId !== false && info?.kakaoId) ||
            (vis?.email !== false && info?.email) ||
            (vis?.gender !== false && info?.gender) ||
            (vis?.age !== false && info?.age)) && (
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

          {vis?.experiences !== false &&
            (info?.experiences?.length || info?.introduction) && (
              <div className="w-full space-y-3 p-4 bg-muted rounded-lg">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Briefcase className="size-4" />
                  경력 및 자기소개
                </h4>
                {info?.experiences && info.experiences.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">경력</Label>
                    {info.experiences.map((exp, idx) => (
                      <div
                        key={idx}
                        className="text-sm border-l-2 border-primary/30 pl-3"
                      >
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
                    <Label className="text-xs text-muted-foreground">
                      자기소개
                    </Label>
                    <p className="text-sm leading-relaxed">{info.introduction}</p>
                  </div>
                )}
              </div>
            )}

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
                    <div
                      key={s.id}
                      className="text-sm border-l-2 border-primary/30 pl-3"
                    >
                      <p className="text-xs text-muted-foreground mb-1">
                        {s.postTitle}
                      </p>
                      <p className="leading-relaxed whitespace-pre-wrap">
                        {s.message}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

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
};
