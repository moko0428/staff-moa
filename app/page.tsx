'use client';

import JobCard, { type JobItem } from '@/components/JobCard';
import PostingFilter, { type Filters } from '@/components/PostingFilter';
import { useMemo, useState, useEffect } from 'react';
import {
  mockPosts,
  mockUsers,
  mockApplications,
  mockSchedules,
} from '@/lib/mockData';
import { Post } from '@/types/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Hero from '@/components/Hero';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

// Post를 JobItem으로 변환하는 함수
function postToJobItem(post: Post): JobItem {
  const statusMap: Record<Post['status'], JobItem['status']> = {
    urgent: '급구',
    recruiting: '모집',
    completed: '모집완료',
  };

  return {
    id: post.id, // 즐겨찾기/상세 링크 일관성
    title: post.title,
    content: post.description,
    date: post.date,
    time: post.time,
    need: post.preparation,
    place: post.location,
    pay: post.salary.toString(),
    TO: `${post.recruitCount - post.currentApplicants}명`,
    manager: post.managerInfo.name,
    managerPhone: post.managerInfo.phone,
    etc: post.notes,
    categories: post.keywords,
    qualifications: post.requirements ? [post.requirements] : [],
    status: statusMap[post.status],
    createdAt: post.createdAt,
  };
}

export default function Home() {
  const [hash, setHash] = useState('');
  const [filters, setFilters] = useState<Filters>({
    status: '',
    payMin: '',
    payMax: '',
    dateRange: undefined,
    dateMode: 'single',
    toText: '',
    placeText: '',
    categories: [],
  });

  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    const updateHash = () => {
      setHash(window.location.hash);
    };
    updateHash();
    window.addEventListener('hashchange', updateHash);
    const intervalId = setInterval(updateHash, 100);
    return () => {
      window.removeEventListener('hashchange', updateHash);
      clearInterval(intervalId);
    };
  }, []);

  // userRole에 따른 매니저 권한 체크
  useEffect(() => {
    const syncRole = () => {
      try {
        if (typeof window === 'undefined') return;
        const userId = localStorage.getItem('userId');
        const userRole = localStorage.getItem('userRole');
        setIsManager(!!userId && userRole === 'manager');
      } catch {
        setIsManager(false);
      }
    };

    syncRole();
    window.addEventListener('storage', syncRole);
    window.addEventListener('auth-changed', syncRole);
    return () => {
      window.removeEventListener('storage', syncRole);
      window.removeEventListener('auth-changed', syncRole);
    };
  }, []);

  // 구인공고 페이지 (#open 또는 기본)
  const jobPostings = useMemo(() => {
    return mockPosts.map((post) => postToJobItem(post));
  }, []);

  const allCategories = useMemo(() => {
    const s = new Set<string>();
    jobPostings.forEach((d) => d.categories.forEach((c) => s.add(c)));
    return Array.from(s);
  }, [jobPostings]);

  const allLocations = useMemo(() => {
    const set = new Set<string>();
    jobPostings.forEach((job) => {
      if (job.place) set.add(job.place);
    });
    return Array.from(set);
  }, [jobPostings]);

  const allSalaries = useMemo(() => {
    const salaries = new Set<number>();
    jobPostings.forEach((job) => {
      if (job.pay) {
        const payNum = Number(job.pay);
        if (!isNaN(payNum)) salaries.add(payNum);
      }
    });
    return Array.from(salaries).sort((a, b) => a - b);
  }, [jobPostings]);

  const filtered = useMemo(() => {
    const statusPriority: Record<JobItem['status'], number> = {
      급구: 0,
      모집: 1,
      모집완료: 2,
    };

    return jobPostings
      .filter((job) => {
        if (filters.status && job.status !== filters.status) return false;
        if (filters.payMin && Number(job.pay ?? 0) < Number(filters.payMin))
          return false;
        if (filters.payMax && Number(job.pay ?? 0) > Number(filters.payMax))
          return false;

        if (filters.dateRange?.from) {
          const jobDateStr = job.date ?? '';
          if (!jobDateStr) return false;

          const jobDate = new Date(jobDateStr);
          const from = new Date(filters.dateRange.from);
          const to =
            filters.dateMode === 'open-end'
              ? undefined
              : new Date(filters.dateRange.to ?? filters.dateRange.from);

          const jobTime = jobDate.setHours(0, 0, 0, 0);
          const fromTime = from.setHours(0, 0, 0, 0);

          if (jobTime < fromTime) return false;
          if (filters.dateMode !== 'open-end') {
            const toTime = (to ?? from).setHours(0, 0, 0, 0);
            if (jobTime > toTime) return false;
          }
        }

        if (filters.toText && !(job.TO ?? '').includes(filters.toText))
          return false;
        if (filters.placeText && !(job.place ?? '').includes(filters.placeText))
          return false;
        if (
          filters.categories.length > 0 &&
          !filters.categories.every((c) => job.categories.includes(c))
        )
          return false;

        return true;
      })
      .slice()
      .sort((a, b) => {
        const statusDiff = statusPriority[a.status] - statusPriority[b.status];
        if (statusDiff !== 0) return statusDiff;

        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA; // 최신순
      });
  }, [filters, jobPostings]);

  // 관리자 페이지 (#admin)
  if (hash === '#admin') {
    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold">관리자 페이지</h2>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>사용자 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500">역할: {user.role}</p>
                    </div>
                    <Badge variant="outline">{user.attendanceScore}점</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>공고 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockPosts.map((post) => (
                  <div key={post.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold">{post.title}</p>
                      <Badge>{post.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {post.location} - {post.date}
                    </p>
                    <p className="text-xs text-gray-500">
                      모집: {post.currentApplicants}/{post.recruitCount}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>지원서 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockApplications.map((app) => {
                  const post = mockPosts.find((p) => p.id === app.postId);
                  return (
                    <div key={app.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold">{app.applicantName}</p>
                        <Badge
                          variant={
                            app.status === 'accepted' ? 'default' : 'outline'
                          }
                        >
                          {app.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{post?.title}</p>
                      <p className="text-xs text-gray-500">{app.appliedAt}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 매니저 페이지 - 내 공고 (#my-posting)
  if (hash === '/manager/my-post') {
    const managerPosts = mockPosts.filter(
      (post) => post.authorId === 'manager-1'
    );
    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold">내 공고</h2>
        <div className="space-y-4">
          {managerPosts.map((post) => (
            <JobCard key={post.id} item={postToJobItem(post)} />
          ))}
        </div>
      </div>
    );
  }

  // 일반 회원 페이지 - 내 스케줄 (#normal-member)
  if (hash === '/worker/schedule') {
    const userSchedules = mockSchedules.filter(
      (schedule) => schedule.userId === 'member-1'
    );
    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold">내 스케줄</h2>
        <div className="space-y-4">
          {userSchedules.map((schedule) => {
            const post = mockPosts.find((p) => p.id === schedule.postId);
            return (
              <Card key={schedule.id}>
                <CardHeader>
                  <CardTitle>{schedule.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-semibold">날짜:</span>{' '}
                      {schedule.date}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">급여:</span>{' '}
                      {schedule.salary.toLocaleString()}원
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">지급 상태:</span>{' '}
                      {schedule.paid ? '지급 완료' : '미지급'}
                    </p>
                    {post && (
                      <p className="text-sm text-gray-600">{post.location}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // 기본 페이지 - 구인공고 (#open 또는 빈 해시)
  return (
    <div className="flex flex-col gap-2">
      <Hero
        title="스탭 알바 구인공고"
        description="원하는 조건의 스탭 알바를 찾아보세요"
      />
      <PostingFilter
        filters={filters}
        onChange={setFilters}
        allCategories={allCategories}
        allLocations={allLocations}
        allSalaries={allSalaries}
      />
      {isManager && (
        <Button variant="default" size="sm" asChild>
          <Link href="/my-post/create">
            <Plus className="size-4" />
            <span className="text-sm font-medium">새 구인 공고 작성</span>
          </Link>
        </Button>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {filtered.map((item) => (
          <JobCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
