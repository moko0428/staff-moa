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
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">
              파싱 양식 — 아래 형식에 맞게 작성하면 자동으로 입력됩니다
            </p>
            <pre className="text-xs bg-muted rounded-md p-3 leading-relaxed text-muted-foreground whitespace-pre-wrap font-mono">{`공고제목:
키워드:

[파트1]
이름:
내용:
시간: 00:00 ~ 00:00
장소:
인원:
급여: 일급/시급/주급/월급 금액
원천징수: 예/아니오
날짜:
- YYYY-MM-DD
- YYYY-MM-DD ~ YYYY-MM-DD

[파트2] (파트 추가 시)
...

[담당자]
이름:
연락처:

[추가정보]
복장:
지원자격:
우대사항:
지원방법: `}</pre>
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
          <Button type="button" onClick={onApply} disabled={!pasteText.trim()}>
            <Check className="size-4 mr-2" />
            적용하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
