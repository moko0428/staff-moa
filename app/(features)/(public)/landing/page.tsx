'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { motion, type Variants } from 'framer-motion';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import {
  Briefcase,
  Building2,
  Zap,
  Search,
  ArrowRight,
  User,
  Star,
  Calendar,
  Users,
  Shield,
  Target,
  Gem,
  CircleCheckBig,
  History,
} from 'lucide-react';
import {
  getLandingStatsAction,
  getTopReviewsAction,
  type LandingStats,
  type LandingReview,
} from './actions';
import { getActivePopupAction, type LandingPopup } from './popup-actions';
import SectionBadge from './components/section-badge';
import LandingPopupModal from './components/LandingPopup';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/app/components/ui/avatar';
import { Marquee } from '@/components/ui/marquee';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { NumberTicker } from '@/components/ui/number-ticker';

// 애니메이션 variants
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6 },
  },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const scaleOnHover: Variants = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -8,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// 기능별 아이콘 색상 매핑
const featureColorClasses: Record<string, string> = {
  blue: 'bg-gradient-to-b from-blue-500 to-blue-300',
  pink: 'bg-gradient-to-b from-pink-500 to-pink-300',
  green: 'bg-gradient-to-b from-green-500 to-green-300',
  orange: 'bg-gradient-to-b from-orange-500 to-orange-300',
  purple: 'bg-gradient-to-b from-purple-500 to-purple-300',
};

// 역할별 배지 색상 매핑
const levelColorClasses: Record<string, string> = {
  스탭: 'text-blue-500 bg-blue-500/10',
  매니저: 'text-green-500 bg-green-500/10',
  전체: 'text-purple-500 bg-purple-500/10',
};

const steps = [
  {
    title: '스탭 · 매니저 가입',
    desc: '역할을 선택하고 신뢰 기반 프로필을 완성하세요.',
    icon: <Users className="size-6" />,
  },
  {
    title: '공고 등록 및 탐색',
    desc: '매니저는 인재를 찾고, 스탭은 조건에 맞는 공고를 발견합니다.',
    icon: <Search className="size-6" />,
  },
  {
    title: '지원 및 매칭',
    desc: '검증된 정보 기반으로 빠르고 정확하게 연결됩니다.',
    icon: <CircleCheckBig className="size-6" />,
  },
  {
    title: '근무 · 평가 · 경력 축적',
    desc: '근무 이력과 평판이 기록되어 다음 기회로 이어집니다.',
    icon: <Gem className="size-6" />,
  },
];

const features = [
  {
    icon: <Search className="size-6" />,
    title: '맞춤 공고 탐색',
    level: '스탭',
    desc: '키워드, 관심 매니저, 조건 설정을 통해 나에게 최적화된 공고를 받아보세요.',
    color: 'blue',
  },
  {
    icon: <Calendar className="size-6" />,
    title: '통합 스케줄·수익 관리',
    level: '스탭',
    desc: '누적 수익과 근무 일정을 한눈에 관리하세요.',
    color: 'pink',
  },
  {
    icon: <History className="size-6" />,
    title: '경력 자동 기록 시스템',
    level: '스탭',
    desc: '근무 이력이 자동 저장되고 프로필에 반영되어 나만의 경력 자산이 됩니다.',
    color: 'blue',
  },
  {
    icon: <Target className="size-6" />,
    title: '근태 신뢰 점수',
    desc: '출결과 평가가 점수로 누적되어 매칭 승인 확률이 높아집니다.',
    level: '스탭',
    color: 'orange',
  },
  {
    icon: <Users className="size-6" />,
    title: '지원자 관리',
    level: '매니저',
    desc: '공고별 지원자를 효율적으로 관리하고 근태 점수를 부여하세요',
    color: 'green',
  },

  {
    icon: <Shield className="size-6" />,
    title: '안전한 신고 시스템',
    level: '전체',
    desc: '부적절한 공고나 행위를 신고하여 건전한 플랫폼 환경을 만들어갑니다',
    color: 'purple',
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

// 이름 마스킹 함수 (가운데 글자를 O로 변경)
const maskName = (name: string | null): string => {
  if (!name) return '익명';
  const trimmed = name.trim();
  if (trimmed.length <= 1) return trimmed;
  if (trimmed.length === 2) return trimmed[0] + 'O';
  // 3글자 이상: 첫글자 + O(가운데 모두) + 마지막 글자
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  const middleCount = trimmed.length - 2;
  return first + 'O'.repeat(middleCount) + last;
};

export default function LandingPage() {
  const router = useRouter();
  const [stats, setStats] = useState<LandingStats | null>(null);
  const [topReviews, setTopReviews] = useState<LandingReview[]>([]);
  const [activePopup, setActivePopup] = useState<LandingPopup | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const authed =
      !!localStorage.getItem('userId') || !!localStorage.getItem('authToken');
    if (authed) router.replace('/post');
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      const [statsResult, reviewsResult, popupResult] = await Promise.all([
        getLandingStatsAction(),
        getTopReviewsAction(),
        getActivePopupAction(),
      ]);
      if (statsResult.ok && statsResult.data) {
        setStats(statsResult.data);
      }
      if (reviewsResult.ok && reviewsResult.data) {
        setTopReviews(reviewsResult.data);
      }
      if (popupResult.ok && popupResult.data) {
        setActivePopup(popupResult.data);
      }
    };
    fetchData();
  }, []);

  type StatItem = {
    label: string;
    display: string;
    icon: ReactNode;
    tickerValue?: number;
    suffix?: string;
    decimalPlaces?: number;
  };

  const toCountTicker = (
    count: number,
  ): { tickerValue: number; suffix?: string } => {
    if (count >= 1000)
      return { tickerValue: Math.floor(count / 1000), suffix: 'K+' };
    if (count >= 100) return { tickerValue: count, suffix: '+' };
    return { tickerValue: count };
  };

  const statsItems: StatItem[] = [
    {
      label: '등록 스탭',
      display: stats ? formatCount(stats.memberCount) : '-',
      ...(stats ? toCountTicker(stats.memberCount) : {}),
      icon: <User className="size-6" />,
    },
    {
      label: '활성 공고',
      display: stats ? formatCount(stats.activePostCount) : '-',
      ...(stats ? toCountTicker(stats.activePostCount) : {}),
      icon: <Briefcase className="size-6" />,
    },
    {
      label: '파트너 업체',
      display: stats ? formatCount(stats.managerCount) : '-',
      ...(stats ? toCountTicker(stats.managerCount) : {}),
      icon: <Building2 className="size-6" />,
    },
    {
      label: '평균 평점',
      display:
        stats && stats.averageRating !== null
          ? `${stats.averageRating.toFixed(1)}`
          : '-',
      tickerValue:
        stats && stats.averageRating !== null
          ? Number(stats.averageRating.toFixed(1))
          : undefined,
      suffix: undefined,
      decimalPlaces: 1,
      icon: <Star className="size-6" />,
    },
  ];

  return (
    <div className="flex flex-col bg-gradient-to-b from-primary/90 to-background overflow-hidden">
      {activePopup && <LandingPopupModal popup={activePopup} />}
      {/* 플로팅 배경 요소 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl"
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"
          animate={{
            y: [0, 20, 0],
            rotate: [0, -5, 5, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-40 left-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"
          animate={{
            y: [0, -15, 0],
            rotate: [0, 3, -3, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Hero */}
      <section className="max-w-3xl mx-auto p-4 relative z-10">
        <div className="flex flex-col items-center justify-center pt-6 pb-12">
          <motion.div
            className="space-y-12"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div
              variants={fadeInUp}
              className="flex items-center justify-center gap-2 bg-white/10 rounded-full px-4 py-2 w-fit mx-auto text-center"
            >
              <Zap className="size-4 text-white" />
              <span className="text-xs font-semibold text-white">
                기업과 인재를 잇는 신뢰형 매칭 플랫폼
              </span>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="space-y-4 w-full max-w-xl mx-auto"
            >
              <h1 className="text-4xl font-bold leading-tight text-white text-center">
                사람을 찾는 기업과 <br /> 기회를 찾는 인재를 연결하다
              </h1>
              <p className="text-white text-lg text-center w-full">
                정교한 매칭 시스템과 통합 스케줄·경력 관리 솔루션으로
                <br />
                채용의 모든 단계를 하나로.
              </p>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="flex flex-wrap gap-3 justify-center"
            >
              <Button asChild variant="ghost" size="lg">
                <Link
                  href="/post"
                  className="border border-white/50 rounded-full px-4 py-2 hover:bg-white/10"
                >
                  <Search className="size-4 text-white" />
                  <span className="text-white">공고 둘러보기</span>
                </Link>
              </Button>

              <InteractiveHoverButton className="border border-white/50 rounded-lg px-6 py-1 hover:bg-white/10 bg-primary/10 text-white">
                <Link href="/auth"> 무료로 시작하기</Link>
              </InteractiveHoverButton>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              className="grid grid-cols-2 sm:grid-cols-4 gap-8 pt-4"
            >
              {statsItems.map((s, idx) => (
                <motion.div
                  key={s.label}
                  variants={staggerItem}
                  custom={idx}
                  className="flex flex-col items-center justify-center gap-3 *:text-white"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="flex items-center justify-center gap-2 bg-white/10 rounded-lg p-4">
                    {s.icon}
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-white">
                    {typeof s.tickerValue === 'number' &&
                    Number.isFinite(s.tickerValue) ? (
                      <>
                        <NumberTicker
                          startValue={0}
                          value={s.tickerValue}
                          decimalPlaces={s.decimalPlaces ?? 0}
                          className="text-white"
                        />
                        {s.suffix ? <span>{s.suffix}</span> : null}
                      </>
                    ) : (
                      <span>{s.display}</span>
                    )}
                  </p>
                  <p className="text-sm text-white/80">{s.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 이용 방법 */}
      <section className="bg-background border-t border-b border-border relative z-10">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-14 space-y-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeInUp}
          >
            <SectionBadge
              title="이용 방법"
              textColor="text-primary"
              bgColor="bg-primary/10"
            />
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeInUp}
            className="flex flex-col items-center justify-center gap-2"
          >
            <h2 className="text-4xl font-bold text-foreground">
              4단계로 간편하게
            </h2>
            <small className="text-sm text-muted-foreground">
              누구나 쉽게 사용할 수 있습니다.
            </small>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:items-stretch"
          >
            {steps.map((step, idx) => (
              <motion.div
                key={step.title}
                variants={staggerItem}
                whileHover="hover"
                initial="rest"
                animate="rest"
                className="h-full min-h-0 flex flex-col"
              >
                <motion.div
                  variants={scaleOnHover}
                  className="h-full flex flex-col"
                >
                  <Card className="h-full min-h-0 flex flex-col relative overflow-visible">
                    {idx < 3 && (
                      <div className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                        <div className="size-7 rounded-full bg-background border border-border flex items-center justify-center">
                          <ArrowRight className="size-4 text-muted-foreground" />
                        </div>
                      </div>
                    )}
                    <CardContent className="p-4 space-y-2 flex-1 flex flex-col min-h-0">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center size-10 bg-primary rounded-lg">
                          <span className="text-xl font-semibold text-primary-foreground">
                            {idx + 1}
                          </span>
                        </div>
                        <div className="flex items-center justify-center size-10 bg-primary/20 text-primary rounded-lg">
                          {step.icon}
                        </div>
                      </div>
                      <p className="font-bold text-foreground">{step.title}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.desc}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 주요 기능 */}
      <section className="bg-background border-t border-b border-border relative z-10">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-14 space-y-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeInUp}
          >
            <SectionBadge
              title="주요 기능"
              textColor="text-purple-500"
              bgColor="bg-purple-500/20"
            />
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeInUp}
            className="flex flex-col items-center justify-center gap-2"
          >
            <h2 className="text-4xl font-bold text-foreground">
              모든 기능을 한 곳에서
            </h2>
            <small className="text-sm text-muted-foreground">
              역할별 사용자 중심의 편리한 기능을 제공합니다.
            </small>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={staggerItem}
                whileHover="hover"
                initial="rest"
                animate="rest"
              >
                <motion.div variants={scaleOnHover}>
                  <Card className="h-full border-none shadow-md hover:shadow-xl transition-shadow duration-300">
                    <CardContent className="p-4 space-y-2">
                      <div
                        className={`flex items-center justify-center size-10 ${
                          featureColorClasses[feature.color]
                        } rounded-lg text-white`}
                      >
                        {feature.icon}
                      </div>
                      <div className="flex gap-1 items-center">
                        <p className="font-bold text-foreground">
                          {feature.title}
                        </p>
                        <p
                          className={`text-xs leading-relaxed ${
                            levelColorClasses[feature.level]
                          } rounded-full px-2 py-1`}
                        >
                          {feature.level}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.desc}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 사용자 후기 */}
      <section className="bg-background border-t border-b border-border overflow-hidden relative z-10">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-14 space-y-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeInUp}
          >
            <SectionBadge
              title="사용자 후기"
              textColor="text-purple-500"
              bgColor="bg-purple-500/20"
            />
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeInUp}
            className="flex flex-col items-center justify-center gap-2"
          >
            <h2 className="text-4xl font-bold text-foreground">
              실제 사용자들의 이야기
            </h2>
            <small className="text-sm text-muted-foreground">
              많은 분들이 고인력과 함께하고 있습니다
            </small>
          </motion.div>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeIn}
          className="relative pb-10"
        >
          {topReviews.length === 0 ? (
            <div className="max-w-6xl mx-auto px-4 pb-10">
              <Card className="bg-card">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  아직 노출 중인 후기가 없습니다. (관리자 대시보드에서 후기를
                  선택할 수 있어요)
                </CardContent>
              </Card>
            </div>
          ) : (
            <Marquee pauseOnHover className="[--duration:30s]">
              {topReviews.map((review, idx) => {
                const maskedName = maskName(review.user_name);
                return (
                  <Card
                    key={review.review_id ?? `review-${idx}`}
                    className="w-80 shrink-0 bg-card hover:shadow-lg transition-shadow duration-300"
                  >
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`size-4 ${
                              i < review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground/30'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-foreground leading-relaxed line-clamp-3">
                        &ldquo;{review.content}&rdquo;
                      </p>
                      <div className="flex items-center gap-3 pt-2 border-t">
                        <Avatar className="size-10">
                          <AvatarImage src={review.user_avatar ?? undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {maskedName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {maskedName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            사용자
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </Marquee>
          )}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-background to-transparent" />
        </motion.div>
      </section>

      {/* CTA */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeInUp}
        className="bg-gradient-to-b from-primary/60 to-primary relative z-10"
      >
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-14 text-background space-y-4 text-center">
          <motion.h3
            variants={fadeInUp}
            className="text-2xl sm:text-3xl font-bold"
          >
            지금 바로 시작해보세요
          </motion.h3>
          <motion.p
            variants={fadeInUp}
            className="text-sm sm:text-base text-background/80"
          >
            가입 후 공고를 등록하거나 원하는 공고에 지원해보세요.
          </motion.p>
          <motion.div
            variants={fadeInUp}
            className="flex flex-wrap gap-3 justify-center"
          >
            <InteractiveHoverButton className="border border-white/50 rounded-lg px-6 py-1 hover:bg-white/10 bg-primary/10 text-white">
              <Link href="/auth">회원가입</Link>
            </InteractiveHoverButton>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
        className="bg-zinc-900 text-zinc-300 relative z-10"
      >
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Briefcase className="size-4 text-white" />
            <span className="text-sm font-semibold text-white">고인력</span>
          </div>
          <div className="text-xs text-zinc-400">
            © {new Date().getFullYear()} goinlyeog All rights reserved.
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
