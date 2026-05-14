'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/app/components/ui/dialog';
import PendingVerificationContent from '../../components/organisms/PendingVerificationContent';

const ModalInner = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email') ?? '';

  const handleClose = () => router.back();

  return (
    <Dialog open onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent
          className="max-w-sm p-6 gap-0"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
        <PendingVerificationContent
          email={email}
          titleElement={
            <DialogTitle className="text-center text-lg font-bold mb-3">
              이메일 인증을 진행해주세요
            </DialogTitle>
          }
        />
      </DialogContent>
    </Dialog>
  );
};

export default function PendingModal() {
  return (
    <Suspense>
      <ModalInner />
    </Suspense>
  );
}
