'use client';

import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { QUICK_TEMPLATES } from '../../constants';

interface Props {
  totalCount: number;
  selectedCount: number;
  onSend: (message: string, target: 'all' | 'selected') => Promise<void>;
  onClose: () => void;
}

export function NoticeModal({ totalCount, selectedCount, onSend, onClose }: Props) {
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<'all' | 'selected'>('all');
  const [sending, setSending] = useState(false);

  const targets = [
    { key: 'all' as const, label: `전체 (${totalCount}명)`, disabled: false },
    { key: 'selected' as const, label: `선택됨 (${selectedCount}명)`, disabled: selectedCount === 0 },
  ];

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    await onSend(message.trim(), target);
    setSending(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base">공지 발송</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="flex gap-2">
            {targets.map(({ key, label, disabled }) => (
              <button
                key={key}
                type="button"
                onClick={() => !disabled && setTarget(key)}
                disabled={disabled}
                className={`flex-1 text-sm py-2 rounded-xl border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  target === key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {QUICK_TEMPLATES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setMessage(t)}
                className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/70 transition-colors"
              >
                {t}
              </button>
            ))}
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="공지 내용을 입력하세요"
            autoFocus
            className="w-full border rounded-xl p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-ring bg-background"
            rows={4}
          />

          <button
            type="button"
            disabled={!message.trim() || sending}
            onClick={handleSend}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
          >
            <Bell className="size-4" />
            {sending ? '발송 중...' : '발송하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
