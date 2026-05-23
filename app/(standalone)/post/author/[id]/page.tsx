'use client';

import { use, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Share2,
  MoreVertical,
  ShieldCheck,
  Briefcase,
  MapPin,
  Heart,
  Tag,
  Mail,
  Phone,
  MessageCircle,
  Banknote,
  Calendar,
  Star,
  User,
} from 'lucide-react';
import UserAvatar from '@/app/common/components/UserAvatar';
import { cn } from '@/lib/utils';
import {
  getPublicManagerProfileAction,
  type PublicManagerProfile,
  type ActivePost,
  type StaffReview,
} from './actions';

// ── 유틸 ────────────────────────────────────────────────

const PAY_TYPE_LABEL: Record<string, string> = {
  hourly: '시급',
  daily: '일급',
  weekly: '주급',
  monthly: '월급',
};

function formatPay(amount: number | null, type: string | null) {
  if (!amount) return null;
  const label = (type && PAY_TYPE_LABEL[type]) ?? '';
  return `${label} ${amount.toLocaleString()}원`.trim();
}

// ── 내부 컴포넌트 ────────────────────────────────────────

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {children}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  count,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  count?: string;
}) {
  return (
    <div className="px-4 pt-4 pb-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
          <Icon className="size-4 text-red-500" />
        </div>
        <span className="font-bold text-sm">{title}</span>
        {count && <span className="text-sm text-muted-foreground">{count}</span>}
      </div>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1.5 ml-9">{subtitle}</p>
      )}
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-t border-border">
      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
        <Icon className="size-4 text-red-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

function ActivityInfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-t border-border">
      <Icon className="size-4 text-muted-foreground shrink-0" />
      <span className="w-20 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium flex-1">{value}</span>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'size-3',
            i < rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'
          )}
        />
      ))}
    </div>
  );
}

function PostCard({ post }: { post: ActivePost }) {
  const payText = formatPay(post.pay_amount, post.pay_type);
  const isUrgent = post.status === 'urgent';
  const keywords = post.keywords ?? [];

  return (
    <Link href={`/post/${post.post_id}`}>
      <div className="bg-card rounded-2xl border border-border p-4 space-y-2 active:opacity-75 transition-opacity">
        <div className="flex flex-wrap gap-1.5">
          {isUrgent && (
            <span className="text-xs font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
              급구
            </span>
          )}
          {keywords.slice(0, 3).map((kw, i) => (
            <span
              key={i}
              className="text-xs font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full"
            >
              {kw}
            </span>
          ))}
        </div>
        <p className="font-bold text-base leading-snug line-clamp-2">{post.title}</p>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          {post.location ? (
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5 shrink-0" />
              {post.location}
            </span>
          ) : (
            <span />
          )}
          {payText && (
            <span className="flex items-center gap-1 text-primary font-semibold">
              <Banknote className="size-3.5 shrink-0" />
              {payText}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── 프로필 뷰 ──────────────────────────────────────────

function ManagerPublicProfileView({ user }: { user: PublicManagerProfile }) {
  const [tab, setTab] = useState<'intro' | 'posts'>('intro');

  const isVerified = user.companyVerifyStatus === 'approved';

  const visibleEmail = user.profileVisibility.email && user.email;
  const visiblePhone = user.profileVisibility.phone && user.phone;
  const visibleKakaoId = user.profileVisibility.kakaoId && user.kakaoId;
  const hasAnyContact = visibleEmail || visiblePhone || visibleKakaoId;

  const activityStartYear = user.createdAt ? new Date(user.createdAt).getFullYear() : null;
  const hasActivityInfo =
    user.activityRegions.length > 0 ||
    activityStartYear !== null ||
    !!user.managerType ||
    user.specialties.length > 0;

  return (
    <div className="bg-muted min-h-screen pb-20">

      {/* ── 히어로 ── */}
      <div className="relative">
        {/* 커버 */}
        <div className="h-52 w-full overflow-hidden relative">
          {user.coverImage ? (
            <Image src={user.coverImage} alt="커버" fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-rose-300 to-rose-500" />
          )}
        </div>

        {/* 아바타 */}
        <div className="px-4 -mt-12 bg-card">
          <div className="relative w-fit">
            <UserAvatar
              src={user.photo}
              name={user.name}
              className="w-24 h-24 border-4 border-background shadow-md"
              fallbackClassName="text-2xl bg-muted text-foreground"
            />
            {isVerified && (
              <div className="absolute bottom-0.5 right-0.5 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center ring-2 ring-background">
                <ShieldCheck className="size-3.5 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 이름 · 정보 ── */}
      <div className="px-4 bg-card pt-2 pb-4">
        <h1 className="text-xl font-bold">{user.name ?? '알 수 없음'}</h1>
        {(user.companyName || user.position || user.activityRegions.length > 0) && (
          <p className="mt-1 text-sm text-muted-foreground">
            {[user.companyName, user.position, ...user.activityRegions].filter(Boolean).join(' · ')}
          </p>
        )}

        {/* 자기소개 */}
        {user.introduction && (
          <div className="mt-3 bg-muted rounded-xl p-3">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {user.introduction}
            </p>
          </div>
        )}

        {/* 스탯 */}
        <div className="mt-4 grid grid-cols-4 divide-x divide-border border border-border rounded-2xl overflow-hidden">
          <div className="flex flex-col items-center py-3 gap-0.5">
            <span className="text-lg font-bold">{user.postCount}</span>
            <span className="text-xs text-muted-foreground">공고</span>
          </div>
          <div className="flex flex-col items-center py-3 gap-0.5">
            <span className="text-lg font-bold">{user.activePostCount}</span>
            <span className="text-xs text-muted-foreground">진행 중</span>
          </div>
          <div className="flex flex-col items-center py-3 gap-0.5">
            <span className="text-lg font-bold">{user.followerCount}</span>
            <span className="text-xs text-muted-foreground">팔로워</span>
          </div>
          <div className="flex flex-col items-center py-3 gap-0.5">
            <span className="text-lg font-bold">
              {user.averageRating !== null ? user.averageRating.toFixed(1) : '—'}
            </span>
            <span className="text-xs text-muted-foreground">평점</span>
          </div>
        </div>
      </div>

      {/* ── 탭 ── */}
      <div className="bg-card border-b border-border flex mt-2">
        <button
          type="button"
          onClick={() => setTab('intro')}
          className={cn(
            'flex-1 py-3 text-sm font-semibold transition-colors',
            tab === 'intro'
              ? 'text-primary border-b-2 border-primary -mb-px'
              : 'text-muted-foreground'
          )}
        >
          소개
        </button>
        <button
          type="button"
          onClick={() => setTab('posts')}
          className={cn(
            'flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5',
            tab === 'posts'
              ? 'text-primary border-b-2 border-primary -mb-px'
              : 'text-muted-foreground'
          )}
        >
          진행 중 공고
          {user.activePostCount > 0 && (
            <span
              className={cn(
                'text-xs px-1.5 py-0.5 rounded-full font-semibold',
                tab === 'posts'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {user.activePostCount}
            </span>
          )}
        </button>
      </div>

      {/* ── 탭 콘텐츠 ── */}
      <div className="px-4 mt-4 space-y-4">

        {tab === 'intro' && (
          <>
            {/* 연락처 */}
            {hasAnyContact && (
              <SectionCard>
                <SectionHeader
                  icon={Mail}
                  title="연락처"
                  subtitle="매니저가 공개한 항목만 표시돼요."
                />
                <div>
                  {visibleEmail && (
                    <ContactRow icon={Mail} label="이메일" value={user.email!} />
                  )}
                  {visiblePhone && (
                    <ContactRow icon={Phone} label="전화번호" value={user.phone!} />
                  )}
                  {visibleKakaoId && (
                    <ContactRow
                      icon={MessageCircle}
                      label="카카오톡 ID"
                      value={user.kakaoId!}
                    />
                  )}
                </div>
              </SectionCard>
            )}

            {/* 활동 정보 */}
            {hasActivityInfo && (
              <SectionCard>
                <SectionHeader icon={Briefcase} title="활동 정보" />
                <div>
                  {user.activityRegions.length > 0 && (
                    <ActivityInfoRow
                      icon={MapPin}
                      label="활동 지역"
                      value={user.activityRegions.join(' · ')}
                    />
                  )}
                  {activityStartYear && (
                    <ActivityInfoRow
                      icon={Calendar}
                      label="활동 시작"
                      value={`${activityStartYear}년부터 활동`}
                    />
                  )}
                  {user.managerType && (
                    <ActivityInfoRow
                      icon={User}
                      label="매니저 유형"
                      value={
                        user.managerType === 'personal'
                          ? '개인 (사업자 없음)'
                          : '컴퍼니 (회사 운영)'
                      }
                    />
                  )}
                </div>
                {user.specialties.length > 0 && (
                  <div className="px-4 pb-4 pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Tag className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground">전문 분야</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {user.specialties.map((s, i) => (
                        <span
                          key={i}
                          className="bg-red-50 text-red-700 text-sm px-3 py-1 rounded-full border border-red-100"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </SectionCard>
            )}

            {/* 스탭 후기 */}
            <SectionCard>
              <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                    <Star className="size-4 text-red-500" />
                  </div>
                  <span className="font-bold text-sm">스탭 후기</span>
                  {user.staffReviews.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      ({user.staffReviews.length})
                    </span>
                  )}
                </div>
                {user.staffReviews.length > 0 && (
                  <button type="button" className="text-sm text-primary font-medium">
                    전체보기
                  </button>
                )}
              </div>
              {user.staffReviews.length === 0 ? (
                <div className="px-4 pb-4 border-t border-border pt-4 text-center">
                  <p className="text-sm text-muted-foreground">아직 후기가 없습니다.</p>
                </div>
              ) : (
                <div className="divide-y divide-border border-t border-border">
                  {user.staffReviews.slice(0, 3).map((review: StaffReview) => (
                    <div key={review.id} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{review.reviewerName}</span>
                          <StarRating rating={review.rating} />
                        </div>
                        <span className="text-xs text-muted-foreground">{review.date}</span>
                      </div>
                      <p className="text-sm text-foreground">{review.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </>
        )}

        {tab === 'posts' && (
          user.activePosts.length === 0 ? (
            <div className="flex justify-center items-center py-16 text-muted-foreground text-sm">
              진행 중인 공고가 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {user.activePosts.map((post) => (
                <PostCard key={post.post_id} post={post} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ── 페이지 ──────────────────────────────────────────────

export default function AuthorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<PublicManagerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getPublicManagerProfileAction(id).then((result) => {
      if (result.ok && result.data) setUser(result.data);
      setIsLoading(false);
    });
  }, [id]);

  return (
    <div className="relative min-h-screen bg-muted">
      {/* ── 플로팅 헤더 ── */}
      <div className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-4 pointer-events-none">
        <button
          type="button"
          onClick={() => router.back()}
          className="pointer-events-auto w-9 h-9 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center text-white shadow"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex gap-2 pointer-events-auto">
          <button
            type="button"
            className="w-9 h-9 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center text-white shadow"
            onClick={async () => {
              if (typeof navigator !== 'undefined') {
                if (navigator.share) {
                  await navigator.share({
                    title: user?.name ?? '매니저 프로필',
                    url: window.location.href,
                  });
                } else {
                  await navigator.clipboard.writeText(window.location.href);
                }
              }
            }}
          >
            <Share2 className="size-4" />
          </button>
          <button
            type="button"
            className="w-9 h-9 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center text-white shadow"
          >
            <Heart className="size-4" />
          </button>
          <button
            type="button"
            className="w-9 h-9 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center text-white shadow"
          >
            <MoreVertical className="size-4" />
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center min-h-screen">
          <p className="text-muted-foreground text-sm">로딩 중...</p>
        </div>
      )}

      {!isLoading && !user && (
        <div className="flex justify-center items-center min-h-screen">
          <p className="text-muted-foreground text-sm">프로필을 불러올 수 없습니다.</p>
        </div>
      )}

      {user && <ManagerPublicProfileView user={user} />}
    </div>
  );
}
