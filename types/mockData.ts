export type UserRole = 'guest' | 'member' | 'manager' | 'admin';

export type PostStatus = 'recruiting' | 'completed' | 'urgent';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  kakaoId?: string;
  photo?: string;
  password?: string;
  mbti?: string;
  // Member 전용 필드
  birthDate?: string; // 'YYYY-MM-DD' 형식
  age?: number; // 계산된 나이 (선택적)
  gender?: '남성' | '여성' | '기타';
  height?: number;
  weight?: number;
  personality?: string;
  features?: string;
  experiences?: Array<{
    title: string;
    date: string;
    location: string;
  }>;
  introduction?: string;
  documents?: {
    idCard?: string; // 파일 경로
    bankbook?: string; // 파일 경로
    healthCertificate?: string; // 파일 경로
    driverLicense?: string; // 파일 경로
    certificates?: string[]; // 자격증 이름 배열
    language?: string[];
  };

  // Manager 전용 필드
  companyName?: string;

  attendanceScore: number;
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  status: PostStatus;
  title: string;
  keywords: string[];
  date: string;
  location: string;
  time: string;
  salary: number;
  paymentDate: string;
  preparation: string;
  description: string;
  managerInfo: {
    name: string;
    phone: string;
  };
  recruitCount: number;
  currentApplicants: number;
  notes?: string;
  requirements?: string;
  preferences?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  postId: string;
  applicantId: string;
  applicantName: string;
  status: 'pending' | 'accepted' | 'rejected';
  appliedAt: string;
  message?: string;
}

export interface AttendanceReview {
  id: string;
  postId: string;
  userId: string;
  score: number;
  comment: string;
  reviewedBy: string;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  targetType: 'post' | 'user';
  targetId: string;
  reason: string;
  status: 'pending' | 'resolved' | 'rejected';
  createdAt: string;
}

export interface Schedule {
  id: string;
  userId: string;
  postId: string;
  title: string;
  date: string;
  salary: number;
  paid: boolean;
}

export interface Favorite {
  id: string;
  userId: string;
  postIds: string[]; // 관심 공고 ID 목록
  keywords?: string[]; // 관심 키워드 (선택적)
}
