'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import {
  Briefcase,
  Building2,
  Zap,
  Search,
  ArrowRight,
  User,
} from 'lucide-react';
import { getLandingStatsAction, type LandingStats } from './actions';

const steps = [
  { title: '회원가입', desc: '이메일로 간단히 가입하고 역할을 선택하세요.' },
  { title: '프로필 작성', desc: '경력, 서류, 어학/자격증 정보를 입력하세요.' },
  {
    title: '공고 탐색/등록',
    desc: '스탭은 공고를 지원, 매니저는 공고를 등록합니다.',
  },
  {
    title: '매칭 및 관리',
    desc: '지원자 관리, 스케줄 관리, 관심 목록으로 효율적으로 운영하세요.',
  },
];

const formatCount = (count: number): string => {
  if (count >= 1000) {
    return `${Math.floor(count / 1000)}K+`;
  }
  if (count >= 100) {
    return `${count}+`;
  }
  return String(count);
};

export default function LandingPage() {
  const router = useRouter();
  const [stats, setStats] = useState<LandingStats | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const authed =
      !!localStorage.getItem('userId') || !!localStorage.getItem('authToken');
    if (authed) router.replace('/post');
  }, [router]);

  useEffect(() => {
    const fetchStats = async () => {
      const result = await getLandingStatsAction();
      if (result.ok && result.data) {
        setStats(result.data);
      }
    };
    fetchStats();
  }, []);

  const statsItems = [
    {
      label: '등록 스탭',
      value: stats ? formatCount(stats.memberCount) : '-',
      icon: <User className="size-6" />,
    },
    {
      label: '활성 공고',
      value: stats ? formatCount(stats.activePostCount) : '-',
      icon: <Briefcase className="size-6" />,
    },
    {
      label: '파트너 업체',
      value: stats ? formatCount(stats.managerCount) : '-',
      icon: <Building2 className="size-6" />,
    },
  ];

  return (
    <div className="flex flex-col bg-gradient-to-b from-primary to-background">
      {/* Hero */}
      <section className="max-w-3xl mx-auto p-4">
        <div className="flex flex-col items-center justify-center pt-6 pb-12">
          <div className="space-y-12">
            <div className="flex items-center justify-center gap-2 bg-white/10 rounded-full px-4 py-2 w-fit mx-auto text-center">
              <Zap className="size-4 text-white" />
              <span className="text-xs font-semibold text-white">
                신뢰할 수 있는 스탭 구인 플랫폼
              </span>
            </div>
            <div className="space-y-4 w-full max-w-xl mx-auto">
              <h1 className="text-4xl font-bold leading-tight text-white text-center">
                스탭 알바, <br />
                이제 더 쉽고 빠르게
              </h1>
              <p className="text-white text-lg text-center w-full">
                맞춤형 공고 검색부터 스케줄 관리, 경력 관리까지
                <br /> 모든 과정을 한 곳에서 해결하세요.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild variant="ghost" size="lg">
                <Link
                  href="/post"
                  className="border border-white/50 rounded-full px-4 py-2 hover:bg-white/10"
                >
                  <Search className="size-4 text-white" />
                  <span className="text-white">공고 둘러보기</span>
                </Link>
              </Button>
              <Button variant="outline" asChild size="lg">
                <Link
                  href="/auth"
                  className="border border-white/50 rounded-full px-4 py-2 hover:bg-white/10"
                >
                  <span className="text-foreground">무료로 시작하기</span>
                  <ArrowRight className="size-4 text-foreground" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-8 pt-4">
              {statsItems.map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col items-center justify-center gap-3 *:text-white"
                >
                  <div className="flex items-center justify-center gap-2 bg-white/10 rounded-lg p-4">
                    {s.icon}
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-white">
                    {s.value}
                  </p>
                  <p className="text-sm text-white/80">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 이용 방법 */}
      <section className="bg-background border-t border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-14 space-y-6">
          <h2 className="text-2xl font-bold text-foreground">이용 방법</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, idx) => (
              <Card key={step.title} className="h-full">
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs font-semibold text-primary">
                    STEP {idx + 1}
                  </p>
                  <p className="font-bold text-foreground">{step.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 파트너 섹션 */}
      <section className="bg-muted border-t border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-14 space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="text-primary" />
            <h2 className="text-2xl font-bold text-foreground">
              {stats ? `${stats.managerCount}+` : ''} 파트너 업체와 함께합니다
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            이벤트, 박람회, 프로모션, 오프라인 채널 등 다양한 도메인의
            파트너사들이 스탭알바를 통해 스탭을 모집하고 있습니다.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 text-sm text-foreground">
            <div className="rounded-lg border border-border bg-card px-3 py-2 text-center">
              대형 유통/리테일
            </div>
            <div className="rounded-lg border border-border bg-card px-3 py-2 text-center">
              IT/스타트업
            </div>
            <div className="rounded-lg border border-border bg-card px-3 py-2 text-center">
              이벤트/프로모션
            </div>
            <div className="rounded-lg border border-border bg-card px-3 py-2 text-center">
              스포츠/행사
            </div>
            <div className="rounded-lg border border-border bg-card px-3 py-2 text-center">
              F&B/외식
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-14 text-white space-y-4 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold">
            지금 바로 시작해보세요
          </h3>
          <p className="text-sm sm:text-base text-white/80">
            가입 후 공고를 등록하거나 원하는 공고에 지원해보세요.
          </p>
          <div className="flex justify-center gap-3">
            <Button size="lg" asChild variant="secondary">
              <Link href="/auth/join">회원가입</Link>
            </Button>
            <Button
              size="lg"
              asChild
              variant="outline"
              className="bg-white text-blue-700"
            >
              <Link href="/post-list">공고 보러가기</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 text-zinc-300">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Briefcase className="size-4 text-white" />
            <span className="text-sm font-semibold text-white">스탭알바</span>
          </div>
          <div className="text-xs text-zinc-400">
            © {new Date().getFullYear()} Staff-MOA. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
