'use client';

import { useEffect, useMemo, useState } from 'react';
import { mockUsers, mockPosts } from '@/lib/mockData';
import { User, Post } from '@/types/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Eye,
  Trash2,
  ShieldBan,
  ShieldCheck,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import Hero from '@/components/Hero';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type AdminTab = 'members' | 'posts' | 'reports' | 'manager-approval';

interface PostReportInfo {
  post: Post;
  reportCount: number;
  reasons: string[];
}

// 간단한 신고 Mock 데이터 (게시글 신고 수/사유를 위한 예시)
const REPORT_REASONS = [
  '부적절한 내용(욕설/비하)이 포함되어 있어요.',
  '허위 정보 또는 과장된 내용이 의심돼요.',
  '동일/유사한 공고가 반복 게시된 스팸으로 보여요.',
  '임금·근무 조건이 실제와 다르거나 명확하지 않아요.',
  '기타 커뮤니티 가이드라인을 위반한 것 같아요.',
];

const mockPostReports: PostReportInfo[] = mockPosts
  .slice(0, 6)
  .map((post, index) => ({
    post,
    reportCount: (index + 1) * 3,
    reasons: [REPORT_REASONS[index % REPORT_REASONS.length]],
  }));

// 간단한 매니저 승급 요청 Mock 데이터
interface ManagerRequest {
  id: string;
  user: User;
  requestedAt: string;
}

const managerRequests: ManagerRequest[] = mockUsers
  .filter((u) => u.role === 'member')
  .slice(0, 3)
  .map((user, index) => ({
    id: `manager-req-${index + 1}`,
    user,
    requestedAt: '2025-11-28',
  }));

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('members');
  const [managerRequestsState, setManagerRequestsState] =
    useState<ManagerRequest[]>(managerRequests);

  // 실제 구현에서는 서버에서 관리자를 판별하지만, 여기서는 role === 'admin' 유저를 관리자라고 가정
  const adminUser = useMemo(
    () => mockUsers.find((u) => u.role === 'admin'),
    []
  );

  const members = useMemo(
    () => mockUsers.filter((u) => !adminUser || u.id !== adminUser.id),
    [adminUser]
  );

  const [bannedUserIds, setBannedUserIds] = useState<string[]>([]);
  const [deletedPostIds, setDeletedPostIds] = useState<string[]>([]);
  const [handledReportPostIds, setHandledReportPostIds] = useState<string[]>(
    []
  );
  const [approvedManagerIds, setApprovedManagerIds] = useState<string[]>([]);
  const [rejectedManagerIds, setRejectedManagerIds] = useState<string[]>([]);
  const [extraManagerRequests, setExtraManagerRequests] = useState<
    ManagerRequest[]
  >([]);

  // 검색 & 필터 상태
  const [memberSearch, setMemberSearch] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState<
    'all' | 'member' | 'manager' | 'banned'
  >('all');
  const [postSearch, setPostSearch] = useState('');
  const [postStatusFilter, setPostStatusFilter] = useState<
    'all' | 'recruiting' | 'completed' | 'urgent'
  >('all');
  const [reportSearch, setReportSearch] = useState('');
  const [managerSearch, setManagerSearch] = useState('');

  const visiblePosts = useMemo(
    () => mockPosts.filter((post) => !deletedPostIds.includes(post.id)),
    [deletedPostIds]
  );

  const filteredMembers = useMemo(
    () =>
      members.filter((user) => {
        const matchSearch =
          !memberSearch ||
          user.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
          user.email.toLowerCase().includes(memberSearch.toLowerCase());

        const isBanned = bannedUserIds.includes(user.id);

        const matchRole =
          memberRoleFilter === 'all'
            ? true
            : memberRoleFilter === 'banned'
            ? isBanned
            : user.role === memberRoleFilter;

        return matchSearch && matchRole;
      }),
    [members, memberSearch, memberRoleFilter, bannedUserIds]
  );

  const filteredPosts = useMemo(
    () =>
      visiblePosts.filter((post) => {
        const matchSearch =
          !postSearch ||
          post.title.toLowerCase().includes(postSearch.toLowerCase()) ||
          post.location.toLowerCase().includes(postSearch.toLowerCase());

        const matchStatus =
          postStatusFilter === 'all' ? true : post.status === postStatusFilter;

        return matchSearch && matchStatus;
      }),
    [visiblePosts, postSearch, postStatusFilter]
  );

  const sortedReports = useMemo(
    () =>
      mockPostReports
        .filter((item) => !handledReportPostIds.includes(item.post.id))
        .filter((item) => {
          if (!reportSearch) return true;
          const keyword = reportSearch.toLowerCase();
          return (
            item.post.title.toLowerCase().includes(keyword) ||
            item.post.location.toLowerCase().includes(keyword)
          );
        })
        .sort((a, b) => b.reportCount - a.reportCount),
    [handledReportPostIds, reportSearch]
  );

  const pendingManagerRequests = useMemo(
    () =>
      managerRequestsState.filter(
        (req) =>
          !approvedManagerIds.includes(req.user.id) &&
          !rejectedManagerIds.includes(req.user.id) &&
          (!managerSearch ||
            req.user.name.toLowerCase().includes(managerSearch.toLowerCase()) ||
            req.user.email.toLowerCase().includes(managerSearch.toLowerCase()))
      ),
    [
      approvedManagerIds,
      rejectedManagerIds,
      managerSearch,
      managerRequestsState,
    ]
  );

  // 로컬 스토리지에 저장된 매니저 승인 요청 병합
  useEffect(() => {
    try {
      const stored = localStorage.getItem('managerRequestsExtra');
      if (stored) {
        const parsed = JSON.parse(stored) as ManagerRequest[];
        setExtraManagerRequests(parsed);
        setManagerRequestsState([...managerRequests, ...parsed]);
      } else {
        setManagerRequestsState(managerRequests);
      }
    } catch {
      setManagerRequestsState(managerRequests);
    }
  }, []);

  const persistExtraRequests = (requests: ManagerRequest[]) => {
    setExtraManagerRequests(requests);
    localStorage.setItem('managerRequestsExtra', JSON.stringify(requests));
  };

  const handleManagerDecision = (
    req: ManagerRequest,
    decision: 'approve' | 'reject'
  ) => {
    if (decision === 'approve') {
      setApprovedManagerIds((prev) =>
        prev.includes(req.user.id) ? prev : [...prev, req.user.id]
      );
    } else {
      setRejectedManagerIds((prev) =>
        prev.includes(req.user.id) ? prev : [...prev, req.user.id]
      );
    }

    setManagerRequestsState((prev) => prev.filter((r) => r.id !== req.id));

    if (req.id.startsWith('local-req')) {
      const filtered = extraManagerRequests.filter((r) => r.id !== req.id);
      persistExtraRequests(filtered);
    }
  };

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  return (
    <div className="space-y-6">
      <Hero
        title="관리자 대시보드"
        description="사이트 전체를 관리하고 모니터링하세요"
      />

      {/* 탭 버튼 */}
      <div className="flex flex-wrap mt-4 gap-2">
        <Button
          variant={activeTab === 'members' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('members')}
        >
          회원 관리
        </Button>
        <Button
          variant={activeTab === 'posts' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('posts')}
        >
          게시글 관리
        </Button>
        <Button
          variant={activeTab === 'reports' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('reports')}
        >
          신고 관리
        </Button>
        <Button
          variant={activeTab === 'manager-approval' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('manager-approval')}
        >
          매니저 승인 관리
        </Button>
      </div>

      {/* 탭 내용 */}
      {activeTab === 'members' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span>회원 관리</span>
                <span className="text-sm text-gray-500">
                  총 {filteredMembers.length}명 / 전체 {members.length}명
                  (관리자 제외)
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <Input
                  placeholder="이름 또는 이메일로 검색"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="h-9 text-sm"
                />
                <Select
                  value={memberRoleFilter}
                  onValueChange={(value) =>
                    setMemberRoleFilter(
                      value as 'all' | 'member' | 'manager' | 'banned'
                    )
                  }
                >
                  <SelectTrigger className="h-9 w-full sm:w-40 text-xs">
                    <SelectValue placeholder="역할 필터" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="member">회원만</SelectItem>
                    <SelectItem value="manager">매니저만</SelectItem>
                    <SelectItem value="banned">정지 회원만</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredMembers.map((user) => {
              const isBanned = bannedUserIds.includes(user.id);
              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.photo} alt={user.name} />
                      <AvatarFallback>{user.name.at(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{user.name}</span>
                      <span className="text-xs text-gray-500">
                        {user.email}
                      </span>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0.5"
                        >
                          {user.role === 'manager' ? '매니저' : '회원'}
                        </Badge>
                        {isBanned && (
                          <Badge
                            variant="destructive"
                            className="text-[10px] px-1.5 py-0.5"
                          >
                            정지됨
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isBanned ? 'outline' : 'destructive'}
                      size="sm"
                      onClick={() =>
                        setBannedUserIds((prev) =>
                          isBanned
                            ? prev.filter((id) => id !== user.id)
                            : [...prev, user.id]
                        )
                      }
                    >
                      <ShieldBan className="size-4" />
                      <span className="text-xs">
                        {isBanned ? '정지 해제' : '정지(벤)'}
                      </span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {activeTab === 'posts' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span>게시글 관리</span>
                <span className="text-sm text-gray-500">
                  총 {filteredPosts.length}건 / 전체 {visiblePosts.length}건
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <Input
                  placeholder="제목 또는 지역으로 검색"
                  value={postSearch}
                  onChange={(e) => setPostSearch(e.target.value)}
                  className="h-9 text-sm"
                />
                <Select
                  value={postStatusFilter}
                  onValueChange={(value) =>
                    setPostStatusFilter(
                      value as 'all' | 'recruiting' | 'completed' | 'urgent'
                    )
                  }
                >
                  <SelectTrigger className="h-9 w-full sm:w-40 text-xs">
                    <SelectValue placeholder="상태 필터" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="recruiting">모집중</SelectItem>
                    <SelectItem value="completed">완료</SelectItem>
                    <SelectItem value="urgent">긴급</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border px-4 py-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{post.title}</span>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0.5"
                    >
                      {post.status === 'recruiting'
                        ? '모집중'
                        : post.status === 'completed'
                        ? '완료'
                        : '긴급'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {post.location} · {post.date} · {post.time}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    작성자: {post.authorName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPost(post)}
                  >
                    <Eye className="size-4" />
                    <span className="text-xs">자세히 보기</span>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      setDeletedPostIds((prev) =>
                        prev.includes(post.id) ? prev : [...prev, post.id]
                      )
                    }
                  >
                    <Trash2 className="size-4" />
                    <span className="text-xs">삭제</span>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === 'reports' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span>신고 관리</span>
                <span className="text-sm text-gray-500">
                  신고 많은 순 정렬 · 총 {sortedReports.length}건
                </span>
              </div>
              <Input
                placeholder="제목 또는 지역으로 검색"
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                className="h-9 text-sm"
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedReports.map(({ post, reportCount, reasons }) => (
              <div
                key={post.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border px-4 py-3"
              >
                <Link
                  href={`/post/${post.id}`}
                  className="flex-1 cursor-pointer hover:bg-gray-50 rounded-md -mx-2 px-2 py-1 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm line-clamp-1">
                      {post.title}
                    </span>
                    <Badge
                      variant="destructive"
                      className="text-[10px] px-1.5 py-0.5"
                    >
                      신고 {reportCount}건
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {post.location} · {post.date}
                  </p>
                  <p className="text-xs text-red-500 mt-0.5 line-clamp-2">
                    신고 사유: {reasons.join(', ')}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    작성자: {post.authorName}
                  </p>
                </Link>
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setHandledReportPostIds((prev) =>
                        prev.includes(post.id) ? prev : [...prev, post.id]
                      );
                      setDeletedPostIds((prev) =>
                        prev.includes(post.id) ? prev : [...prev, post.id]
                      );
                    }}
                  >
                    <Trash2 className="size-4" />
                    <span className="text-xs">처리(삭제)</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setHandledReportPostIds((prev) =>
                        prev.includes(post.id) ? prev : [...prev, post.id]
                      )
                    }
                  >
                    <XCircle className="size-4" />
                    <span className="text-xs">기각</span>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === 'manager-approval' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span>매니저 승인 관리</span>
                <span className="text-sm text-gray-500">
                  대기 {pendingManagerRequests.length}명
                </span>
              </div>
              <Input
                placeholder="이름 또는 이메일로 검색"
                value={managerSearch}
                onChange={(e) => setManagerSearch(e.target.value)}
                className="h-9 text-sm"
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingManagerRequests.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">
                대기 중인 매니저 승급 요청이 없습니다.
              </p>
            ) : (
              pendingManagerRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={req.user.photo} alt={req.user.name} />
                      <AvatarFallback>{req.user.name.at(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {req.user.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {req.user.email}
                      </span>
                      <span className="text-xs text-gray-400 mt-1">
                        요청일: {req.requestedAt}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManagerDecision(req, 'approve')}
                    >
                      <CheckCircle2 className="size-4 text-emerald-600" />
                      <span className="text-xs">승인</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleManagerDecision(req, 'reject')}
                    >
                      <ShieldCheck className="size-4" />
                      <span className="text-xs">거절</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* 게시글 자세히 보기 모달 */}
      <Dialog
        open={!!selectedPost}
        onOpenChange={(open) => !open && setSelectedPost(null)}
      >
        <DialogContent>
          {selectedPost && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">
                  {selectedPost.title}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {selectedPost.location} · {selectedPost.date} ·{' '}
                  {selectedPost.time}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-3 space-y-2 text-sm">
                <p className="text-gray-700 whitespace-pre-line">
                  {selectedPost.description}
                </p>
                <p className="text-xs text-gray-500">
                  시급 {selectedPost.salary.toLocaleString()}원 · 모집{' '}
                  {selectedPost.recruitCount}명 · 현재 지원{' '}
                  {selectedPost.currentApplicants}명
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
