export type UserRole = 'guest' | 'member' | 'manager' | 'admin';

export type PostStatus = 'recruiting' | 'completed' | 'urgent';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  age?: number;
  gender?: '남성' | '여성' | '기타';
  photo?: string;
  experience?: string;
  introduction?: string;
  attendanceScore: number;
  createdAt: string;
  documents?: {
    idCard?: boolean;
    bankbook?: boolean;
    healthCertificate?: boolean;
  };
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
  keywords: string[];
}
