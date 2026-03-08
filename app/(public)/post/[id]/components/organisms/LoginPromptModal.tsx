import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';

interface LoginPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string | null;
  onLogin: () => void;
}

const LoginPromptModal = ({
  open,
  onOpenChange,
  currentUserId,
  onLogin,
}: LoginPromptModalProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-base">로그인이 필요합니다</DialogTitle>
        <DialogDescription className="text-sm">
          작성자 프로필을 보려면 로그인해주세요.
        </DialogDescription>
      </DialogHeader>
      {!currentUserId && (
        <div className="flex justify-center gap-2 pt-2">
          <Button type="button" onClick={onLogin}>
            로그인하기
          </Button>
        </div>
      )}
    </DialogContent>
  </Dialog>
);

export default LoginPromptModal;
