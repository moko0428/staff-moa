'use client';

import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Check } from 'lucide-react';

interface PasteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pasteText: string;
  onPasteTextChange: (text: string) => void;
  onApply: () => void;
}

export const PasteModal = ({
  open,
  onOpenChange,
  pasteText,
  onPasteTextChange,
  onApply,
}: PasteModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>공고문 붙여넣기</DialogTitle>
          <DialogDescription>
            공고문 텍스트를 붙여넣으면 자동으로 양식에 채워집니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="paste-text">공고문 텍스트</Label>
            <Textarea
              id="paste-text"
              value={pasteText}
              onChange={(e) => onPasteTextChange(e.target.value)}
              placeholder="공고문 텍스트를 붙여넣어주세요..."
              className="min-h-[300px] font-mono text-sm"
            />
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>지원 형식:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>📅 일시: 날짜 및 시간</li>
              <li>🏢 장소: 근무 장소</li>
              <li>👔 복장: 준비물/복장</li>
              <li>⌨️ 업무: 업무 내용</li>
              <li>🧑 인원: 모집 인원</li>
              <li>💵 페이: 급여 정보</li>
              <li>담당자 정보: 이름 및 연락처</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onPasteTextChange('');
            }}
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={onApply}
            disabled={!pasteText.trim()}
          >
            <Check className="size-4 mr-2" />
            적용하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
