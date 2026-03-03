import {
  Users,
  Search,
  CircleCheckBig,
  Gem,
  Calendar,
  History,
  Target,
  Shield,
} from 'lucide-react';

export const steps = [
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

export const features = [
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
    level: '스탭',
    desc: '출결과 평가가 점수로 누적되어 매칭 승인 확률이 높아집니다.',
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
