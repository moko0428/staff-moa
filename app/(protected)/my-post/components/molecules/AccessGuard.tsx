'use client';

import Hero from '@/app/components/Hero';
import { Card, CardContent } from '@/app/components/ui/card';
import { Loader2 } from 'lucide-react';

interface Props {
  title: string;
  roleHydrated: boolean;
  isManager: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

export function AccessGuard({ title, roleHydrated, isManager, loading, children }: Props) {
  if (!roleHydrated) {
    return (
      <div className="space-y-4">
        <Hero title={title} description="매니저 전용 페이지" />
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            역할 정보를 불러오는 중입니다...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isManager) {
    return (
      <div className="space-y-4">
        <Hero title={title} description="매니저 전용 페이지" />
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            관리자 승인이 필요한 매니저 전용 페이지입니다.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Hero title={title} description="공고를 불러오는 중..." />
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="size-6 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">공고를 불러오는 중...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
