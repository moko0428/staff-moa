'use client';

import { useState } from 'react';
import Hero from '@/app/components/Hero';
import { AdminTabNav } from './components/molecules/AdminTabNav';
import { MembersTab } from './components/organisms/MembersTab';
import { PostsTab } from './components/organisms/PostsTab';
import { ReportsTab } from './components/organisms/ReportsTab';
import { ReviewsTab } from './components/organisms/ReviewsTab';
import { ManagerApprovalTab } from './components/organisms/ManagerApprovalTab';
import { SystemNotificationTab } from './components/organisms/SystemNotificationTab';
import { PopupTab } from './components/organisms/PopupTab';
import type { AdminTab } from './types';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('members');

  return (
    <div className="space-y-6">
      <Hero
        title="관리자 대시보드"
        description="사이트 전체를 관리하고 모니터링하세요"
      />
      <AdminTabNav activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === 'members' && <MembersTab />}
      {activeTab === 'posts' && <PostsTab />}
      {activeTab === 'reports' && <ReportsTab />}
      {activeTab === 'reviews' && <ReviewsTab />}
      {activeTab === 'manager-approval' && <ManagerApprovalTab />}
      {activeTab === 'system-notification' && <SystemNotificationTab />}
      {activeTab === 'popup' && <PopupTab />}
    </div>
  );
};

export default AdminPage;
