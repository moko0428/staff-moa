import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';

type Props = {
  isMember: boolean;
  showManagerRequestDialog: boolean;
  setShowManagerRequestDialog: (open: boolean) => void;
  isRequestingManagerRole: boolean;
  onRequestManagerRole: () => void;
  showDeleteDialog: boolean;
  setShowDeleteDialog: (open: boolean) => void;
  deleteConfirmText: string;
  setDeleteConfirmText: (text: string) => void;
  isDeletingAccount: boolean;
  onDeleteAccount: () => void;
  onDeleteAccountConfirm: () => void;
};

export function AccountManagementAccordion({
  isMember,
  showManagerRequestDialog,
  setShowManagerRequestDialog,
  isRequestingManagerRole,
  onRequestManagerRole,
  showDeleteDialog,
  setShowDeleteDialog,
  deleteConfirmText,
  setDeleteConfirmText,
  isDeletingAccount,
  onDeleteAccount,
  onDeleteAccountConfirm,
}: Props) {
  return (
    <AccordionItem value="account-management">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-2">
          <span className="font-medium">계정 관리</span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 pt-2">
          {isMember && (
            <>
              <div className="p-4 rounded-lg border border-border bg-muted/30">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Label className="font-medium">매니저로 전환</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      공고를 등록하고 스탭을 모집할 수 있는 매니저 계정으로 전환
                      신청합니다. 관리자가 심사 후 승인하면 전환됩니다.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowManagerRequestDialog(true)}
                    disabled={isRequestingManagerRole}
                    className="ml-4 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-md border border-primary/20 transition-colors disabled:opacity-50 shrink-0"
                  >
                    신청하기
                  </button>
                </div>
              </div>

              <Dialog
                open={showManagerRequestDialog}
                onOpenChange={(open) => {
                  if (!isRequestingManagerRole)
                    setShowManagerRequestDialog(open);
                }}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      매니저 전환 신청
                    </DialogTitle>
                    <DialogDescription>
                      매니저로 전환하면 공고 등록 및 스탭 모집 기능을 사용할 수
                      있습니다.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>신청 후 관리자 검토를 거쳐 매니저로 승인됩니다</li>
                      <li>
                        승인 전까지{' '}
                        <strong className="text-foreground">승인 대기</strong>{' '}
                        상태가 유지됩니다
                      </li>
                      <li>승인 후 프로필에서 회사 정보를 등록해야 합니다</li>
                    </ul>
                    <div className="flex gap-2 justify-end pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowManagerRequestDialog(false)}
                        disabled={isRequestingManagerRole}
                      >
                        취소
                      </Button>
                      <Button
                        onClick={onRequestManagerRole}
                        disabled={isRequestingManagerRole}
                      >
                        {isRequestingManagerRole ? '처리중...' : '신청하기'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
          <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Label className="font-medium text-destructive">
                  계정 탈퇴
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수
                  없습니다.
                </p>
              </div>
              <button
                onClick={onDeleteAccount}
                disabled={isDeletingAccount}
                className="ml-4 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md border border-destructive/20 transition-colors disabled:opacity-50"
              >
                탈퇴하기
              </button>
            </div>
          </div>

          <Dialog
            open={showDeleteDialog}
            onOpenChange={(open) => {
              if (!isDeletingAccount) setShowDeleteDialog(open);
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-destructive">
                  계정 탈퇴
                </DialogTitle>
                <DialogDescription>
                  이 작업은 되돌릴 수 없습니다.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>프로필 및 개인 정보</li>
                  <li>작성한 공고 및 지원 내역</li>
                  <li>스케줄 및 근태 기록</li>
                  <li>업로드한 이미지 및 문서</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  위 데이터가 모두 영구 삭제됩니다. 계속하려면 아래에{' '}
                  <strong className="text-foreground">탈퇴</strong>를
                  입력하세요.
                </p>
                <Input
                  placeholder="탈퇴"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  disabled={isDeletingAccount}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteDialog(false)}
                    disabled={isDeletingAccount}
                  >
                    취소
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={onDeleteAccountConfirm}
                    disabled={deleteConfirmText !== '탈퇴' || isDeletingAccount}
                  >
                    {isDeletingAccount ? '처리중...' : '탈퇴 확인'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
