import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import Link from 'next/link';
import { User } from '@/types/mockData';

interface ApplyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  currentUser: User | null;
  applicationMessage: string;
  onMessageChange: (message: string) => void;
  onSubmit: () => void;
}

const ApplyModal = ({
  open,
  onOpenChange,
  title,
  currentUser,
  applicationMessage,
  onMessageChange,
  onSubmit,
}: ApplyModalProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="text-base">{title}에 지원하기</DialogTitle>
      </DialogHeader>
      {currentUser ? (
        <div className="mt-2 space-y-4 text-sm">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{currentUser.name}</span>님의 기본
              정보가 함께 전달됩니다.
            </p>
            <Link
              href="/settings"
              className="text-xs text-primary underline underline-offset-2 shrink-0 ml-2"
              onClick={() => onOpenChange(false)}
            >
              정보 설정
            </Link>
          </div>
          <div className="space-y-2">
            <Label htmlFor="apply-modal-message" className="text-sm font-medium">
              지원 메시지 (선택)
            </Label>
            <Textarea
              id="apply-modal-message"
              placeholder="매니저에게 전할 메시지를 작성해주세요..."
              value={applicationMessage}
              onChange={(e) => onMessageChange(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              지원 동기, 경력 설명 등을 자유롭게 작성할 수 있습니다.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onMessageChange('');
              }}
            >
              취소
            </Button>
            <Button type="button" variant="default" size="sm" onClick={onSubmit}>
              지원하기
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          지원하려면 먼저 로그인해주세요.
        </p>
      )}
    </DialogContent>
  </Dialog>
);

export default ApplyModal;
