import {
  Users,
  Search,
  CircleCheckBig,
  Calendar,
  History,
  Target,
  Shield,
  AlarmCheck,
  User,
} from 'lucide-react';

export const steps = [
  {
    title: '스탭·매니저 가입',
    desc: '역할을 선택하고 간편하게 가입하세요.',
    icon: <Users className="size-6" />,
    iconName: 'Users',
    color: 'blue',
    link: [
      { href: '/auth', label: '스탭으로 시작' },
      { href: '/auth/join/manager-join', label: '매니저로 시작' },
    ],
  },
  {
    title: '프로필 작성',
    desc: '내 정보를 입력하고 신뢰 기반 프로필을 완성하세요.',
    icon: <User className="size-6" />,
    iconName: 'User',
    color: 'blue',
    link: [
      { href: '/auth', label: '스탭으로 시작' },
      { href: '/auth/join/manager-join', label: '매니저로 시작' },
    ],
  },
  {
    title: '공고 등록 및 탐색',
    desc: '매니저는 인재를 찾고, 스탭은 조건에 맞는 공고를 발견합니다.',
    icon: <Search className="size-6" />,
    iconName: 'Search',
    color: 'pink',
    link: [{ href: '/post', label: '공고 보기' }],
  },
  {
    title: '지원 및 매칭',
    desc: '검증된 정보 기반으로 빠르고 정확하게 연결됩니다.',
    icon: <CircleCheckBig className="size-6" />,
    iconName: 'CircleCheckBig',
    color: 'green',
  },
  {
    title: '웹 푸시 알림 받기',
    desc: '핸드폰에 내장된 "홈 화면에 추가" 기능을 통해 알림을 받을 수 있습니다.',
    icon: <AlarmCheck className="size-6" />,
    iconName: 'AlarmCheck',
    color: 'orange',
  },
];

export const features = [
  {
    icon: <Search className="size-6" />,
    title: '관심 공고 저장',
    level: '스탭',
    desc: '내가 원하는 컨텐츠의 공고를 관심 목록에 추가하기',
    color: 'blue',
  },
  {
    icon: <Target className="size-6" />,
    title: '신뢰 점수',
    level: '스탭',
    desc: '신뢰 점수 상승으로 더 많은 기회 얻기',
    color: 'orange',
  },
  {
    icon: <History className="size-6" />,
    title: '경력 자동 기록 시스템',
    level: '스탭',
    desc: '일할수록 쌓이는 나만의 경력 데이터',
    color: 'blue',
  },
  {
    icon: <Calendar className="size-6" />,
    title: '통합 스케줄·수익 관리',
    level: '스탭',
    desc: '내 알바 수익과 일정을 한눈에 관리',
    color: 'pink',
  },

  {
    icon: <Users className="size-6" />,
    title: '지원자 관리',
    level: '매니저',
    desc: '공고별 지원자를 효율적으로 관리하고 신뢰 점수를 부여하세요',
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
