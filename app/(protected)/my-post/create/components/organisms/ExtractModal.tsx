'use client';

import { useState } from 'react';
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
import { Check, Copy } from 'lucide-react';

interface ExtractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extractedText: string;
}

export const ExtractModal = ({
  open,
  onOpenChange,
  extractedText,
}: ExtractModalProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = extractedText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>공고문 추출</DialogTitle>
          <DialogDescription>
            현재 작성된 공고 내용을 텍스트로 추출합니다. 복사 후 다음 공고
            작성 시 붙여넣기로 빠르게 채울 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="extract-text">추출된 공고문</Label>
            <Textarea
              id="extract-text"
              value={extractedText}
              readOnly
              className="min-h-[300px] font-mono text-sm"
            />
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>이 텍스트를 복사하여 다음에 붙여넣기 기능으로 재사용할 수 있습니다.</p>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            닫기
          </Button>
          <Button
            type="button"
            onClick={handleCopy}
            disabled={!extractedText.trim()}
          >
            {copied ? (
              <>
                <Check className="size-4 mr-2" />
                복사됨
              </>
            ) : (
              <>
                <Copy className="size-4 mr-2" />
                복사하기
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
