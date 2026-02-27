'use client';

import { Button } from '@/app/components/ui/button';
import type { AdminTab } from '../../types';

const TABS: { value: AdminTab; label: string }[] = [
  { value: 'members', label: '회원 관리' },
  { value: 'posts', label: '게시글 관리' },
  { value: 'reports', label: '신고 관리' },
  { value: 'reviews', label: '리뷰 관리' },
  { value: 'manager-approval', label: '매니저 승인 관리' },
  { value: 'system-notification', label: '시스템 공지' },
  { value: 'popup', label: '팝업 관리' },
];

interface AdminTabNavProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

export const AdminTabNav = ({ activeTab, onTabChange }: AdminTabNavProps) => (
  <div className="flex flex-wrap mt-4 gap-2">
    {TABS.map(({ value, label }) => (
      <Button
        key={value}
        variant={activeTab === value ? 'default' : 'outline'}
        size="sm"
        onClick={() => onTabChange(value)}
      >
        {label}
      </Button>
    ))}
  </div>
);
