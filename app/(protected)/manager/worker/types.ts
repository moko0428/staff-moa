export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export type ApplicantData = {
  member_schedule_id: string;
  post_id: number;
  member_id: string;
  status: ApplicationStatus;
  message: string | null;
  created_at: string;
  updated_at: string;
  posts?: {
    post_id: number;
    title: string;
    description: string;
    work_date: string;
    location: string;
    pay_amount: number;
    pay_type: string;
    work_slots: unknown;
    status: 'recruiting' | 'completed' | 'urgent';
  } | null;
  profiles?: {
    user_id: string;
    name: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    attendance_score: number;
    birth_date: string | null;
    gender: string | null;
    kakao_id: string | null;
    bio: string | null;
    experiences: unknown;
    documents: unknown;
    profile_visibility: unknown;
  } | null;
};

export interface ApplicationWithPost {
  id: string;
  postId: number;
  applicantId: string;
  applicantName: string;
  postTitle: string;
  postDate: string;
  postLocation: string;
  postStatus?: 'recruiting' | 'completed' | 'urgent';
  workSlots?: Array<{ date: string; start_time?: string; end_time?: string }>;
  appliedAt: string;
  status: ApplicationStatus;
  message?: string | null;
  applicantInfo?: {
    name: string;
    email: string;
    phone?: string | null;
    photo?: string | null;
    attendanceScore?: number;
    age?: number | null;
    gender?: string | null;
    kakaoId?: string | null;
    introduction?: string | null;
    experiences?: Array<{
      title?: string;
      date?: string;
      location?: string;
    }>;
    documents?: {
      idCard?: string;
      bankbook?: string;
      healthCertificate?: string;
      certificates?: string[];
      language?: string[];
      extraDocuments?: string[];
    };
    profileVisibility?: {
      email?: boolean;
      phone?: boolean;
      kakaoId?: boolean;
      age?: boolean;
      gender?: boolean;
      experiences?: boolean;
      documents?: boolean;
      certificates?: boolean;
      languages?: boolean;
    };
  };
  applicantPhoto?: string;
  applicantAttendanceScore?: number;
  applicantKakaoId?: string;
  applicantGender?: string;
  applicantAge?: number;
  workerManagement?: {
    rating?: number | null;
    notes?: string | null;
    is_favorite?: boolean;
    is_blacklisted?: boolean;
  };
}

export interface GroupedWorker {
  applicantId: string;
  applicantName: string;
  applicantPhoto?: string;
  applicantAttendanceScore?: number;
  applicantKakaoId?: string;
  applicantGender?: string;
  applicantAge?: number;
  applicantInfo?: ApplicationWithPost['applicantInfo'];
  workerManagement?: ApplicationWithPost['workerManagement'];
  schedules: Array<{
    id: string;
    postId: number;
    postTitle: string;
    postDate: string;
    postLocation: string;
    postStatus?: 'recruiting' | 'completed' | 'urgent';
    appliedAt: string;
    status: ApplicationStatus;
    message?: string | null;
  }>;
}

export type TabType = 'all' | 'favorite' | 'blacklist';
