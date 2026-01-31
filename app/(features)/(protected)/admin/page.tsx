'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/app/components/ui/dialog';
import {
  Eye,
  Trash2,
  ShieldBan,
  ShieldCheck,
  XCircle,
  CheckCircle2,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import Link from 'next/link';
import Hero from '@/app/components/Hero';
import { Input } from '@/app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  fetchPendingManagersAction,
  updateManagerStatusAction,
} from './manager-actions';
import {
  fetchMembersAction,
  fetchPostsAction,
  type AdminMemberItem,
  type AdminPostItem,
} from './admin-data-actions';

type AdminTab = 'members' | 'posts' | 'reports' | 'manager-approval';

interface PostReportInfo {
  post: AdminPostItem;
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

interface PendingManager {
  id: string;
  name: string;
  email: string;
  photo?: string | null;
  companyName?: string | null;
  phone?: string | null;
  kakaoId?: string | null;
  businessNumber?: string | null;
  companyCertificate?: string | null;
  profileCompleted: boolean;
  verifyStatus: 'pending' | 'approved' | 'rejected' | null;
  requestedAt: string;
}

// 간단한 매니저 승급 요청 Mock 데이터
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('members');
  const [members, setMembers] = useState<AdminMemberItem[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [posts, setPosts] = useState<AdminPostItem[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [pendingManagers, setPendingManagers] = useState<PendingManager[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const data = await fetchMembersAction();
      console.log('Fetched members:', data);
      setMembers(data);
    } catch (err) {
      console.error('Failed to load members', err);
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const data = await fetchPostsAction();
      console.log('Fetched posts:', data);
      setPosts(data);
    } catch (err) {
      console.error('Failed to load posts', err);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const [bannedUserIds, setBannedUserIds] = useState<string[]>([]);
  const [deletedPostIds, setDeletedPostIds] = useState<string[]>([]);
  const [handledReportPostIds, setHandledReportPostIds] = useState<string[]>(
    []
  );
  const [approvedManagerIds, setApprovedManagerIds] = useState<string[]>([]);
  const [rejectedManagerIds, setRejectedManagerIds] = useState<string[]>([]);

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
    () => posts.filter((post) => !deletedPostIds.includes(post.id)),
    [posts, deletedPostIds]
  );

  const filteredMembers = useMemo(
    () =>
      members
        .filter((user) => {
          const matchSearch =
            !memberSearch ||
            (user.name?.toLowerCase().includes(memberSearch.toLowerCase()) ?? false) ||
            (user.email?.toLowerCase().includes(memberSearch.toLowerCase()) ?? false);

          const isBanned = bannedUserIds.includes(user.id);

          const matchRole =
            memberRoleFilter === 'all'
              ? true
              : memberRoleFilter === 'banned'
              ? isBanned
              : user.role === memberRoleFilter;

          return matchSearch && matchRole;
        })
        .sort((a, b) => (a.name || '').localeCompare(b.name || '')),
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

  const sortedReports = useMemo(() => {
    // Mock report data from real posts (임시 데이터 - 실제로는 reports 테이블에서 가져와야 함)
    const mockReports: PostReportInfo[] = posts.slice(0, 6).map((post, index) => ({
      post,
      reportCount: (index + 1) * 3,
      reasons: [REPORT_REASONS[index % REPORT_REASONS.length]],
    }));

    return mockReports
      .filter((item) => !handledReportPostIds.includes(item.post.id))
      .filter((item) => {
        if (!reportSearch) return true;
        const keyword = reportSearch.toLowerCase();
        return (
          item.post.title.toLowerCase().includes(keyword) ||
          item.post.location.toLowerCase().includes(keyword)
        );
      })
      .sort((a, b) => b.reportCount - a.reportCount);
  }, [posts, handledReportPostIds, reportSearch]);

  const fetchPendingManagers = useCallback(async () => {
    setLoadingManagers(true);
    try {
      const mapped = await fetchPendingManagersAction();
      setPendingManagers(mapped);
    } catch (err) {
      console.error('Failed to load manager requests', err);
      setPendingManagers([]);
    } finally {
      setLoadingManagers(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingManagers();
  }, [fetchPendingManagers]);

  const filteredPendingManagers = useMemo(
    () =>
      pendingManagers
        .filter(
          (req) =>
            !approvedManagerIds.includes(req.id) &&
            !rejectedManagerIds.includes(req.id)
        )
        .filter((req) => {
          if (!managerSearch) return true;
          const keyword = managerSearch.toLowerCase();
          return (
            req.name.toLowerCase().includes(keyword) ||
            req.email.toLowerCase().includes(keyword)
          );
        }),
    [pendingManagers, approvedManagerIds, rejectedManagerIds, managerSearch]
  );

  const handleManagerDecision = async (
    req: PendingManager,
    decision: 'approve' | 'reject'
  ) => {
    try {
      await updateManagerStatusAction(req.id, decision);
      if (decision === 'approve') {
        setApprovedManagerIds((prev) =>
          prev.includes(req.id) ? prev : [...prev, req.id]
        );
      } else {
        setRejectedManagerIds((prev) =>
          prev.includes(req.id) ? prev : [...prev, req.id]
        );
      }
      setPendingManagers((prev) => prev.filter((r) => r.id !== req.id));
    } catch (err) {
      console.error('Failed to update manager status', err);
      alert('승인/거절 처리에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const [selectedPost, setSelectedPost] = useState<AdminPostItem | null>(null);

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
                <span className="text-sm text-muted-foreground">
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
                    <SelectItem value="member">스탭만</SelectItem>
                    <SelectItem value="manager">매니저만</SelectItem>
                    <SelectItem value="banned">정지 스탭만</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingMembers ? (
              <div className="text-sm text-muted-foreground py-6 text-center">
                불러오는 중...
              </div>
            ) : filteredMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                조건에 맞는 회원이 없습니다.
              </p>
            ) : (
              filteredMembers.map((user) => {
                const isBanned = bannedUserIds.includes(user.id);
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={user.photo ?? undefined}
                          alt={user.name ?? '사용자'}
                        />
                        <AvatarFallback>{user.name?.at(0) ?? '?'}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{user.name ?? '알 수 없음'}</span>
                        <span className="text-xs text-muted-foreground">
                          {user.email ?? '이메일 없음'}
                        </span>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0.5"
                          >
                            {user.role === 'manager' ? '매니저' : '스탭'}
                          </Badge>
                          {user.role === 'member' && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0.5"
                            >
                              근태 {user.attendanceScore ?? 0}점
                            </Badge>
                          )}
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
              })
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'posts' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span>게시글 관리</span>
                <span className="text-sm text-muted-foreground">
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
            {loadingPosts ? (
              <div className="text-sm text-muted-foreground py-6 text-center">
                불러오는 중...
              </div>
            ) : filteredPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                조건에 맞는 게시글이 없습니다.
              </p>
            ) : (
              filteredPosts.map((post) => (
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
                    <p className="text-xs text-muted-foreground mt-1">
                      {post.location} · {post.workDate} · {post.workTimeStart} ~ {post.workTimeEnd}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
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
            ))
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'reports' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span>신고 관리</span>
                <span className="text-sm text-muted-foreground">
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
                  className="flex-1 cursor-pointer hover:bg-muted rounded-md -mx-2 px-2 py-1 transition-colors"
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
                  <p className="text-xs text-muted-foreground mt-1">
                    {post.location} · {post.workDate}
                  </p>
                  <p className="text-xs text-red-500 mt-0.5 line-clamp-2">
                    신고 사유: {reasons.join(', ')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
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
                <span className="text-sm text-muted-foreground">
                  대기 {filteredPendingManagers.length}명
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
            {loadingManagers ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground gap-2">
                <Loader2 className="size-4 animate-spin" />
                불러오는 중...
              </div>
            ) : filteredPendingManagers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                대기 중인 매니저 승급 요청이 없습니다.
              </p>
            ) : (
              filteredPendingManagers.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {req.photo ? (
                        <AvatarImage src={req.photo} alt={req.name} />
                      ) : null}
                      <AvatarFallback>{req.name.at(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{req.name}</span>
                      <span className="text-xs text-muted-foreground">{req.email}</span>
                      <span className="text-xs text-muted-foreground mt-1">
                        요청일: {req.requestedAt?.slice(0, 10) || '-'}
                      </span>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                        {[
                          { label: '전화번호', ok: !!req.phone },
                          { label: '카카오 ID', ok: !!req.kakaoId },
                          { label: '회사명', ok: !!req.companyName },
                          { label: '사업자번호', ok: !!req.businessNumber },
                          { label: '인증 파일', ok: !!req.companyCertificate },
                        ].map((item) => (
                          <span
                            key={item.label}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border"
                          >
                            {item.ok ? (
                              <Check className="size-3 text-emerald-600" />
                            ) : (
                              <X className="size-3 text-red-500" />
                            )}
                            {item.label}
                          </span>
                        ))}
                      </div>
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
                  {selectedPost.location} · {selectedPost.workDate} ·{' '}
                  {selectedPost.workTimeStart} ~ {selectedPost.workTimeEnd}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-3 space-y-2 text-sm">
                <p className="text-foreground whitespace-pre-line">
                  {selectedPost.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  급여 {Number(selectedPost.payAmount).toLocaleString()}원 ({selectedPost.payType === 'hourly' ? '시급' : selectedPost.payType === 'daily' ? '일급' : selectedPost.payType === 'weekly' ? '주급' : '월급'}) · 모집{' '}
                  {selectedPost.recruitCount}명
                </p>
                <p className="text-xs text-muted-foreground">
                  작성자: {selectedPost.authorName}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
