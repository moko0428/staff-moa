'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useSystemNotification } from '../../hooks/useSystemNotification';

export const SystemNotificationTab = () => {
  const {
    notifTitle,
    setNotifTitle,
    notifMessage,
    setNotifMessage,
    notifTargetRole,
    setNotifTargetRole,
    notifSending,
    handleSendSystemNotification,
  } = useSystemNotification();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">시스템 공지 발송</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">수신 대상</label>
          <Select
            value={notifTargetRole}
            onValueChange={(v) => setNotifTargetRole(v as 'all' | 'manager' | 'member')}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="manager">매니저</SelectItem>
              <SelectItem value="member">스탭 (멤버)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">제목</label>
          <Input
            placeholder="공지 제목을 입력하세요"
            value={notifTitle}
            onChange={(e) => setNotifTitle(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">내용</label>
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="공지 내용을 입력하세요"
            value={notifMessage}
            onChange={(e) => setNotifMessage(e.target.value)}
          />
        </div>
        <Button
          onClick={handleSendSystemNotification}
          disabled={notifSending || !notifTitle.trim() || !notifMessage.trim()}
        >
          {notifSending ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              발송 중...
            </>
          ) : (
            '공지 발송'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
