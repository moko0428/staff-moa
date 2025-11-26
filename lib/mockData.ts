import {
  User,
  Post,
  Application,
  Schedule,
  AttendanceReview,
} from '@/types/mockData';

export const mockUsers: User[] = [
  {
    id: 'admin-1',
    email: 'admin@staffjob.com',
    name: '관리자',
    role: 'admin',
    phone: '010-0000-0000',
    attendanceScore: 100,
    createdAt: '2024-01-01',
  },
  {
    id: 'manager-1',
    email: 'manager@company.com',
    name: '김매니저',
    role: 'manager',
    phone: '010-1111-1111',
    attendanceScore: 95,
    createdAt: '2024-02-01',
  },
  {
    id: 'member-1',
    email: 'worker1@email.com',
    name: '이알바',
    role: 'member',
    phone: '010-2222-2222',
    age: 25,
    gender: '남성',
    experience: '마라톤 행사 3회, 팝업스토어 5회',
    introduction: '성실하고 책임감 있게 일하겠습니다.',
    attendanceScore: 92,
    createdAt: '2024-03-01',
    documents: {
      idCard: true,
      bankbook: true,
      healthCertificate: true,
    },
  },
  {
    id: 'member-2',
    email: 'worker2@email.com',
    name: '박아르바이트',
    role: 'member',
    phone: '010-3333-3333',
    age: 23,
    gender: '여성',
    experience: '박람회 스탭 경험 2회',
    introduction: '밝은 성격으로 고객 응대에 자신 있습니다.',
    attendanceScore: 88,
    createdAt: '2024-03-15',
    documents: {
      idCard: true,
      bankbook: true,
    },
  },
];

export const mockPosts: Post[] = [
  {
    id: 'post-1',
    authorId: 'manager-1',
    authorName: '김매니저',
    status: 'urgent',
    title: '서울 마라톤 대회 스탭 급구',
    keywords: ['마라톤', '행사', '스포츠'],
    date: '2024-12-15',
    location: '서울 잠실종합운동장',
    time: '06:00 - 14:00',
    salary: 120000,
    paymentDate: '행사 종료 후 7일 이내',
    preparation: '편한 운동화, 검은색 상하의',
    description:
      '서울 국제 마라톤 대회 운영 스탭을 모집합니다. 참가자 접수 및 안내, 물품 배포 등의 업무를 담당하게 됩니다.',
    managerInfo: {
      name: '김매니저',
      phone: '010-1111-1111',
    },
    recruitCount: 20,
    currentApplicants: 15,
    notes: '새벽 집결이므로 대중교통 이용 어려움. 차량 소지자 우대',
    requirements: '체력 좋으신 분',
    preferences: '마라톤 행사 경험자, 차량 소지자 우대',
    createdAt: '2024-11-20',
    updatedAt: '2024-11-20',
  },
  {
    id: 'post-2',
    authorId: 'manager-1',
    authorName: '김매니저',
    status: 'recruiting',
    title: '강남 팝업스토어 판매 스탭 모집',
    keywords: ['팝업', '판매', '강남'],
    date: '2024-12-20',
    location: '강남구 신사동 가로수길',
    time: '10:00 - 20:00',
    salary: 100000,
    paymentDate: '행사 종료 후 3일 이내',
    preparation: '깔끔한 복장 (청바지, 흰티)',
    description:
      '유명 브랜드 팝업스토어 오픈 행사 스탭을 모집합니다. 고객 응대 및 제품 안내, 포장 업무를 담당합니다.',
    managerInfo: {
      name: '김매니저',
      phone: '010-1111-1111',
    },
    recruitCount: 5,
    currentApplicants: 3,
    requirements: '밝고 친절한 서비스 마인드',
    preferences: '판매 경험자 우대',
    createdAt: '2024-11-22',
    updatedAt: '2024-11-22',
  },
  {
    id: 'post-3',
    authorId: 'manager-1',
    authorName: '김매니저',
    status: 'recruiting',
    title: '코엑스 박람회 안내 스탭',
    keywords: ['박람회', '안내', '코엑스'],
    date: '2024-12-18',
    location: '삼성동 코엑스',
    time: '09:00 - 18:00',
    salary: 90000,
    paymentDate: '익일 지급',
    preparation: '정장 착용',
    description:
      '국제 전시회 안내 및 통역 보조 업무를 담당할 스탭을 모집합니다.',
    managerInfo: {
      name: '김매니저',
      phone: '010-1111-1111',
    },
    recruitCount: 10,
    currentApplicants: 8,
    preferences: '영어 가능자 우대',
    createdAt: '2024-11-21',
    updatedAt: '2024-11-21',
  },
  {
    id: 'post-4',
    authorId: 'manager-1',
    authorName: '김매니저',
    status: 'completed',
    title: '홍대 페스티벌 스탭 (종료)',
    keywords: ['페스티벌', '행사', '홍대'],
    date: '2024-11-10',
    location: '홍대입구역 일대',
    time: '12:00 - 22:00',
    salary: 110000,
    paymentDate: '지급 완료',
    preparation: '페스티벌 제공 유니폼',
    description: '홍대 거리 페스티벌 운영 스탭',
    managerInfo: {
      name: '김매니저',
      phone: '010-1111-1111',
    },
    recruitCount: 15,
    currentApplicants: 15,
    createdAt: '2024-10-25',
    updatedAt: '2024-11-11',
  },
];

export const mockApplications: Application[] = [
  {
    id: 'app-1',
    postId: 'post-1',
    applicantId: 'member-1',
    applicantName: '이알바',
    status: 'accepted',
    appliedAt: '2024-11-21',
    message: '마라톤 행사 경험 있습니다. 열심히 하겠습니다!',
  },
  {
    id: 'app-2',
    postId: 'post-1',
    applicantId: 'member-2',
    applicantName: '박아르바이트',
    status: 'pending',
    appliedAt: '2024-11-22',
    message: '성실히 임하겠습니다.',
  },
  {
    id: 'app-3',
    postId: 'post-2',
    applicantId: 'member-1',
    applicantName: '이알바',
    status: 'pending',
    appliedAt: '2024-11-23',
    message: '팝업스토어 경험 많습니다.',
  },
];

export const mockSchedules: Schedule[] = [
  {
    id: 'sch-1',
    userId: 'member-1',
    postId: 'post-4',
    title: '홍대 페스티벌 스탭',
    date: '2024-11-10',
    salary: 110000,
    paid: true,
  },
  {
    id: 'sch-2',
    userId: 'member-1',
    postId: 'post-1',
    title: '서울 마라톤 대회 스탭',
    date: '2024-12-15',
    salary: 120000,
    paid: false,
  },
];

export const mockAttendanceReviews: AttendanceReview[] = [
  {
    id: 'rev-1',
    postId: 'post-4',
    userId: 'member-1',
    score: 95,
    comment: '성실하고 책임감 있게 근무했습니다.',
    reviewedBy: 'manager-1',
    createdAt: '2024-11-11',
  },
  {
    id: 'rev-2',
    postId: 'post-4',
    userId: 'member-2',
    score: 85,
    comment: '전반적으로 양호하나 지각이 있었습니다.',
    reviewedBy: 'manager-1',
    createdAt: '2024-11-11',
  },
];

// Mock 로그인 함수
export function mockLogin(email: string, password: string): User | null {
  const user = mockUsers.find((u) => u.email === email);
  if (user && password === 'password123') {
    return user;
  }
  return null;
}

// Mock 회원가입 함수
export function mockSignup(
  email: string,
  password: string,
  name: string,
  role: 'member' | 'manager'
): User {
  const newUser: User = {
    id: `user-${Date.now()}`,
    email,
    name,
    role: role === 'manager' ? 'member' : role, // 매니저는 관리자 승인 필요
    attendanceScore: 100,
    createdAt: new Date().toISOString(),
  };
  mockUsers.push(newUser);
  return newUser;
}
