'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { sendSystemNotificationAction } from '@/app/(protected)/notification/actions';

export const useSystemNotification = () => {
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifTargetRole, setNotifTargetRole] = useState<'all' | 'manager' | 'member'>('all');
  const [notifSending, setNotifSending] = useState(false);

  const handleSendSystemNotification = async () => {
    if (!notifTitle.trim() || !notifMessage.trim()) {
      toast.error('제목과 내용을 모두 입력해주세요.');
      return;
    }
    setNotifSending(true);
    try {
      const result = await sendSystemNotificationAction({
        title: notifTitle.trim(),
        message: notifMessage.trim(),
        targetRole: notifTargetRole,
      });
      if (result.ok) {
        toast.success(result.message);
        setNotifTitle('');
        setNotifMessage('');
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('시스템 공지 발송에 실패했습니다.');
    } finally {
      setNotifSending(false);
    }
  };

  return {
    notifTitle,
    setNotifTitle,
    notifMessage,
    setNotifMessage,
    notifTargetRole,
    setNotifTargetRole,
    notifSending,
    handleSendSystemNotification,
  };
};
