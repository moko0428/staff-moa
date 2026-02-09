'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createReportAction } from '@/app/(features)/(protected)/admin/report-actions';
import {
  ReportReason,
  REPORT_REASON_LABELS,
} from '@/app/(features)/(protected)/admin/report-constants';

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: number;
  postTitle: string;
  onReported?: () => void;
}

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'fraud_investment', label: REPORT_REASON_LABELS.fraud_investment },
  { value: 'obscene', label: REPORT_REASON_LABELS.obscene },
  { value: 'child_abuse', label: REPORT_REASON_LABELS.child_abuse },
  { value: 'hate_violence', label: REPORT_REASON_LABELS.hate_violence },
  { value: 'illegal_product', label: REPORT_REASON_LABELS.illegal_product },
  { value: 'privacy_violation', label: REPORT_REASON_LABELS.privacy_violation },
  { value: 'abnormal_usage', label: REPORT_REASON_LABELS.abnormal_usage },
  { value: 'scam_impersonation', label: REPORT_REASON_LABELS.scam_impersonation },
  { value: 'defamation_copyright', label: REPORT_REASON_LABELS.defamation_copyright },
  { value: 'illegal_filming', label: REPORT_REASON_LABELS.illegal_filming },
  { value: 'false_advertisement', label: REPORT_REASON_LABELS.false_advertisement },
  { value: 'spam', label: REPORT_REASON_LABELS.spam },
  { value: 'other', label: REPORT_REASON_LABELS.other },
];

export default function ReportModal({
  open,
  onOpenChange,
  postId,
  postTitle,
  onReported,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | ''>('');
  const [detail, setDetail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error('신고 사유를 선택해주세요.');
      return;
    }

    if (detail.length > 200) {
      toast.error('기타 사항은 200자 이내로 작성해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createReportAction(
        postId,
        selectedReason,
        detail.trim() || undefined
      );

      if (result.ok) {
        toast.success(result.message);
        onOpenChange(false);
        setSelectedReason('');
        setDetail('');
        onReported?.();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Report error:', error);
      toast.error('신고 접수 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
      setSelectedReason('');
      setDetail('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="size-5 text-destructive" />
            게시물 신고
          </DialogTitle>
          <DialogDescription className="text-sm">
            &ldquo;{postTitle}&rdquo; 게시물을 신고합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">신고 사유 선택</Label>
            <RadioGroup
              value={selectedReason}
              onValueChange={(value) => setSelectedReason(value as ReportReason)}
              className="grid grid-cols-1 gap-2"
            >
              {REPORT_REASONS.map((reason) => (
                <div
                  key={reason.value}
                  className="flex items-center space-x-2 p-2 rounded-lg border hover:bg-muted/50 cursor-pointer"
                  onClick={() => setSelectedReason(reason.value)}
                >
                  <RadioGroupItem value={reason.value} id={reason.value} />
                  <Label
                    htmlFor={reason.value}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="report-detail" className="text-sm font-medium">
                기타 사항 (선택)
              </Label>
              <span
                className={`text-xs ${
                  detail.length > 200
                    ? 'text-destructive'
                    : 'text-muted-foreground'
                }`}
              >
                {detail.length}/200
              </span>
            </div>
            <Textarea
              id="report-detail"
              placeholder="추가로 전달할 내용이 있다면 작성해주세요..."
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={3}
              className="resize-none"
              maxLength={210}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedReason}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 mr-1 animate-spin" />
                  접수 중...
                </>
              ) : (
                '신고하기'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
