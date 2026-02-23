'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
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
  Star,
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
import { sendSystemNotificationAction } from '@/app/(features)/(protected)/notification/actions';
import {
  fetchMembersAction,
  fetchPostsAction,
  type AdminMemberItem,
  type AdminPostItem,
} from './admin-data-actions';
import {
  getReportedPostsAction,
  updateReportStatusAction,
  deleteReportedPostAction,
} from './report-actions';
import {
  REPORT_REASON_LABELS,
  type ReportedPostSummary,
} from './report-constants';
import {
  fetchAppReviewsAction,
  fetchReviewStatsAction,
  deleteAppReviewAction,
  toggleReviewFeaturedAction,
  type AppReview,
  type ReviewStats,
} from './review-actions';

type AdminTab = 'members' | 'posts' | 'reports' | 'reviews' | 'manager-approval' | 'system-notification';

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
  const [reportedPosts, setReportedPosts] = useState<ReportedPostSummary[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reviews, setReviews] = useState<AppReview[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);

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

  const fetchReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const result = await getReportedPostsAction();
      if (result.ok && result.data) {
        setReportedPosts(result.data);
      } else {
        console.error('Failed to load reports:', result.message);
        setReportedPosts([]);
      }
    } catch (err) {
      console.error('Failed to load reports', err);
      setReportedPosts([]);
    } finally {
      setLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const fetchReviews = useCallback(async () => {
    setLoadingReviews(true);
    try {
      const [reviewsResult, statsResult] = await Promise.all([
        fetchAppReviewsAction(),
        fetchReviewStatsAction(),
      ]);
      if (reviewsResult.ok && reviewsResult.data) {
        setReviews(reviewsResult.data);
      }
      if (statsResult.ok && statsResult.data) {
        setReviewStats(statsResult.data);
      }
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setLoadingReviews(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

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
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewRatingFilter, setReviewRatingFilter] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all');

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

  const filteredReportedPosts = useMemo(() => {
    return reportedPosts
      .filter((item) => !handledReportPostIds.includes(item.post_id.toString()))
      .filter((item) => {
        if (!reportSearch) return true;
        const keyword = reportSearch.toLowerCase();
        return (
          item.post_title.toLowerCase().includes(keyword) ||
          item.post_location.toLowerCase().includes(keyword) ||
          item.post_author_name.toLowerCase().includes(keyword)
        );
      })
      .sort((a, b) => b.report_count - a.report_count);
  }, [reportedPosts, handledReportPostIds, reportSearch]);

  const filteredReviews = useMemo(() => {
    return reviews
      .filter((review) => {
        const matchSearch =
          !reviewSearch ||
          (review.user_name?.toLowerCase().includes(reviewSearch.toLowerCase()) ?? false) ||
          review.content.toLowerCase().includes(reviewSearch.toLowerCase());
        const matchRating =
          reviewRatingFilter === 'all' || review.rating === parseInt(reviewRatingFilter);
        return matchSearch && matchRating;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [reviews, reviewSearch, reviewRatingFilter]);

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
      toast.error('승인/거절 처리에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleReportDelete = async (postId: number) => {
    try {
      const result = await deleteReportedPostAction(postId);
      if (result.ok) {
        toast.success(result.message);
        setHandledReportPostIds((prev) =>
          prev.includes(postId.toString()) ? prev : [...prev, postId.toString()]
        );
        setReportedPosts((prev) => prev.filter((r) => r.post_id !== postId));
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      console.error('Failed to delete reported post', err);
      toast.error('게시물 삭제에 실패했습니다.');
    }
  };

  const handleReportDismiss = async (postId: number) => {
    try {
      const result = await updateReportStatusAction(postId, 'dismissed');
      if (result.ok) {
        toast.success('신고가 기각되었습니다.');
        setHandledReportPostIds((prev) =>
          prev.includes(postId.toString()) ? prev : [...prev, postId.toString()]
        );
        setReportedPosts((prev) => prev.filter((r) => r.post_id !== postId));
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      console.error('Failed to dismiss report', err);
      toast.error('신고 기각에 실패했습니다.');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      const result = await deleteAppReviewAction(reviewId);
      if (result.ok) {
        toast.success(result.message);
        setReviews((prev) => prev.filter((r) => r.review_id !== reviewId));
        // 통계 다시 로드
        const statsResult = await fetchReviewStatsAction();
        if (statsResult.ok && statsResult.data) {
          setReviewStats(statsResult.data);
        }
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      console.error('Failed to delete review', err);
      toast.error('리뷰 삭제에 실패했습니다.');
    }
  };

  const handleToggleFeatured = async (reviewId: string, currentFeatured: boolean) => {
    try {
      const result = await toggleReviewFeaturedAction(reviewId, !currentFeatured);
      if (result.ok) {
        toast.success(result.message);
        setReviews((prev) =>
          prev.map((r) =>
            r.review_id === reviewId ? { ...r, is_featured: !currentFeatured } : r
          )
        );
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      console.error('Failed to toggle featured', err);
      toast.error('리뷰 상태 변경에 실패했습니다.');
    }
  };

  const featuredCount = useMemo(
    () => reviews.filter((r) => r.is_featured).length,
    [reviews]
  );

  const [selectedPost, setSelectedPost] = useState<AdminPostItem | null>(null);

  // 시스템 공지 발송
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
          variant={activeTab === 'reviews' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('reviews')}
        >
          리뷰 관리
        </Button>
        <Button
          variant={activeTab === 'manager-approval' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('manager-approval')}
        >
          매니저 승인 관리
        </Button>
        <Button
          variant={activeTab === 'system-notification' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('system-notification')}
        >
          시스템 공지
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
                  신고 많은 순 정렬 · 총 {filteredReportedPosts.length}건
                </span>
              </div>
              <Input
                placeholder="제목, 지역 또는 작성자로 검색"
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                className="h-9 text-sm"
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingReports ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground gap-2">
                <Loader2 className="size-4 animate-spin" />
                불러오는 중...
              </div>
            ) : filteredReportedPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                처리 대기 중인 신고가 없습니다.
              </p>
            ) : (
              filteredReportedPosts.map((report) => (
                <div
                  key={report.post_id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border px-4 py-3"
                >
                  <Link
                    href={`/post/${report.post_id}`}
                    className="flex-1 cursor-pointer hover:bg-muted rounded-md -mx-2 px-2 py-1 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm line-clamp-1">
                        {report.post_title}
                      </span>
                      <Badge
                        variant="destructive"
                        className="text-[10px] px-1.5 py-0.5"
                      >
                        신고 {report.report_count}건
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {report.post_location}
                    </p>
                    <p className="text-xs text-red-500 mt-0.5 line-clamp-2">
                      신고 사유:{' '}
                      {report.reasons
                        .map((reason) => REPORT_REASON_LABELS[reason])
                        .join(', ')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      작성자: {report.post_author_name}
                    </p>
                  </Link>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleReportDelete(report.post_id)}
                    >
                      <Trash2 className="size-4" />
                      <span className="text-xs">처리(삭제)</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReportDismiss(report.post_id)}
                    >
                      <XCircle className="size-4" />
                      <span className="text-xs">기각</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'reviews' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span>리뷰 관리</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    랜딩 노출: {featuredCount}/10
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    총 {filteredReviews.length}건
                  </span>
                </div>
              </div>
              {/* 통계 요약 */}
              {reviewStats && reviewStats.totalCount > 0 && (
                <div className="flex flex-wrap items-center gap-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Star className="size-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-lg">{reviewStats.averageRating}</span>
                    <span className="text-sm text-muted-foreground">/ 5.0</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <span key={rating} className="flex items-center gap-0.5">
                        {rating}
                        <Star className="size-3 fill-yellow-400 text-yellow-400" />
                        <span className="mr-2">({reviewStats.ratingCounts[rating] || 0})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <Input
                  placeholder="사용자 이름 또는 내용으로 검색"
                  value={reviewSearch}
                  onChange={(e) => setReviewSearch(e.target.value)}
                  className="h-9 text-sm"
                />
                <Select
                  value={reviewRatingFilter}
                  onValueChange={(value) =>
                    setReviewRatingFilter(value as 'all' | '1' | '2' | '3' | '4' | '5')
                  }
                >
                  <SelectTrigger className="h-9 w-full sm:w-40 text-xs">
                    <SelectValue placeholder="별점 필터" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="5">5점</SelectItem>
                    <SelectItem value="4">4점</SelectItem>
                    <SelectItem value="3">3점</SelectItem>
                    <SelectItem value="2">2점</SelectItem>
                    <SelectItem value="1">1점</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingReviews ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground gap-2">
                <Loader2 className="size-4 animate-spin" />
                불러오는 중...
              </div>
            ) : filteredReviews.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {reviews.length === 0 ? '등록된 리뷰가 없습니다.' : '조건에 맞는 리뷰가 없습니다.'}
              </p>
            ) : (
              filteredReviews.map((review) => (
                <div
                  key={review.review_id}
                  className={`flex flex-col sm:flex-row sm:items-start justify-between gap-3 rounded-lg border px-4 py-3 ${
                    review.is_featured ? 'bg-primary/5 border-primary/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={review.user_avatar ?? undefined}
                        alt={review.user_name ?? '사용자'}
                      />
                      <AvatarFallback>{review.user_name?.at(0) ?? '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-sm">{review.user_name ?? '알 수 없음'}</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`size-3 ${
                                star <= review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-muted-foreground/30'
                              }`}
                            />
                          ))}
                        </div>
                        {review.is_featured && (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0.5">
                            랜딩 노출
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-3">
                        {review.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(review.created_at).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={review.is_featured ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleToggleFeatured(review.review_id, review.is_featured)}
                      disabled={!review.is_featured && featuredCount >= 10}
                      title={
                        !review.is_featured && featuredCount >= 10
                          ? '최대 10개까지만 노출 가능합니다'
                          : review.is_featured
                          ? '랜딩 페이지에서 제외'
                          : '랜딩 페이지에 노출'
                      }
                    >
                      <Eye className="size-4" />
                      <span className="text-xs">{review.is_featured ? '노출중' : '노출'}</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteReview(review.review_id)}
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

      {/* 시스템 공지 발송 */}
      {activeTab === 'system-notification' && (
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
