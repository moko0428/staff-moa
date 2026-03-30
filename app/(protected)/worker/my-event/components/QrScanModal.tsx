'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Camera, KeyRound, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { verifyArrivalCodeAction } from '../actions';

interface Props {
  open: boolean;
  onClose: () => void;
  postId: number;
  memberScheduleId: string;
  onVerified: (arrivedAt: string) => void;
}

type Tab = 'qr' | 'code';

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats: string[] }) => {
      detect(source: ImageBitmapSource): Promise<{ rawValue: string }[]>;
    };
  }
}

export default function QrScanModal({
  open,
  onClose,
  postId,
  memberScheduleId,
  onVerified,
}: Props) {
  const [tab, setTab] = useState<Tab>('qr');
  const [codeInput, setCodeInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // QR 스캔 상태
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectedRef = useRef(false);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [barcodeSupported, setBarcodeSupported] = useState(true);

  // BarcodeDetector 지원 여부 확인 및 초기 탭 결정
  useEffect(() => {
    if (!open) return;
    if (!window.BarcodeDetector) {
      setBarcodeSupported(false);
      setTab('code');
    } else {
      setBarcodeSupported(true);
      setTab('qr');
    }
  }, [open]);

  // QR 탭 활성화 시 카메라 시작
  useEffect(() => {
    if (!open || tab !== 'qr') {
      stopCamera();
      return;
    }
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab]);

  // 모달 닫힐 때 정리
  useEffect(() => {
    if (!open) {
      stopCamera();
      setCodeInput('');
      detectedRef.current = false;
      setCameraError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function stopCamera() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  async function startCamera() {
    detectedRef.current = false;
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      startScanning();
    } catch {
      setCameraError('카메라 접근 권한이 필요합니다. 코드 탭을 이용해주세요.');
    }
  }

  function startScanning() {
    if (!window.BarcodeDetector) return;
    const detector = new window.BarcodeDetector({ formats: ['qr_code'] });

    const scan = async () => {
      if (detectedRef.current || !videoRef.current || !streamRef.current) return;
      try {
        const results = await detector.detect(videoRef.current);
        if (results.length > 0 && !detectedRef.current) {
          const scanned = results[0].rawValue.trim();
          if (/^\d{6}$/.test(scanned)) {
            detectedRef.current = true;
            await submitCode(scanned);
            return;
          }
        }
      } catch {
        // 스캔 실패 시 계속 시도
      }
      rafRef.current = requestAnimationFrame(scan);
    };

    rafRef.current = requestAnimationFrame(scan);
  }

  async function submitCode(code: string) {
    setSubmitting(true);
    const result = await verifyArrivalCodeAction(memberScheduleId, postId, code);
    setSubmitting(false);

    if (result.ok && result.data) {
      toast.success('도착이 확인됐습니다!');
      onVerified(result.data.arrived_at);
    } else {
      detectedRef.current = false;
      toast.error(result.message);
      if (tab === 'qr') {
        // QR 스캔 실패 시 재스캔 허용
        startScanning();
      }
    }
  }

  const handleCodeSubmit = async () => {
    if (codeInput.length !== 6) {
      toast.error('6자리 코드를 입력해주세요.');
      return;
    }
    await submitCode(codeInput);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md w-full p-0 overflow-hidden" showCloseButton={false}>
        <DialogHeader className="px-5 pt-5 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold">도착 인증</DialogTitle>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 hover:bg-muted transition-colors"
              aria-label="닫기"
            >
              <X className="size-4" />
            </button>
          </div>
        </DialogHeader>

        {/* 탭 헤더 */}
        <div className="flex border-b mx-5 mt-4">
          {barcodeSupported && (
            <button
              type="button"
              onClick={() => setTab('qr')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === 'qr'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Camera className="size-4" />
              QR 스캔
            </button>
          )}
          <button
            type="button"
            onClick={() => setTab('code')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === 'code'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <KeyRound className="size-4" />
            인증 코드
          </button>
        </div>

        <div className="p-5">
          {/* QR 스캔 탭 */}
          {tab === 'qr' && (
            <div className="space-y-3">
              {cameraError ? (
                <div className="text-center py-8 text-sm text-muted-foreground space-y-2">
                  <Camera className="size-10 mx-auto opacity-20" />
                  <p>{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => setTab('code')}
                    className="text-primary underline underline-offset-2 text-sm"
                  >
                    코드 입력으로 전환
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-square w-full max-w-xs mx-auto">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {/* 스캔 가이드 오버레이 */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="size-48 border-2 border-white/60 rounded-lg" />
                    </div>
                  </div>
                  <p className="text-center text-xs text-muted-foreground">
                    매니저가 보여주는 QR 코드를 카메라에 비춰주세요
                  </p>
                  {submitting && (
                    <p className="text-center text-sm text-primary animate-pulse">
                      인증 중...
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* 인증 코드 탭 */}
          {tab === 'code' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                매니저가 알려주는 6자리 숫자를 입력해주세요.
              </p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center text-2xl font-mono tracking-[0.5em] py-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
              />
              <button
                type="button"
                disabled={submitting || codeInput.length !== 6}
                onClick={handleCodeSubmit}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '확인 중...' : '확인하기'}
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
