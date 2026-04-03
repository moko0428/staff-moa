export type WorkType = 'single' | 'range' | 'multi';

export type WorkShift = {
  date: string;       // YYYY-MM-DD (시작일 또는 당일)
  date_end?: string;  // YYYY-MM-DD (기간 종료일, undefined = 당일 근무)
  start: string;      // HH:mm
  end: string;        // HH:mm
};

export type WorkPart = {
  name: string;            // "세팅/철수 파트", "행사 운영 파트"
  description?: string;   // 파트별 업무 설명 (선택)
  location: string;        // 근무 장소
  pay_type: 'hourly' | 'daily' | 'weekly' | 'monthly';
  pay_amount: number;      // 파트별 독립 급여
  recruit_count: number;
  tax_withholding: boolean;
  meal_included: boolean;
  meal_amount: number;
  shifts: WorkShift[];     // 이 파트의 날짜별 근무 일정
};

export type PostRow = {
  id: string;
  author_id: string;
  title: string;
  description: string;
  location?: string;
  work_slots: WorkPart[];
  recruit_count: number;
  recruit_male?: number | null;
  recruit_female?: number | null;
  manager_name: string;
  manager_phone: string;
  equipments?: string | null;
  qualifications?: string | null;
  preferences?: string | null;
  notes?: string | null;
  external_link?: string | null;
  keywords?: string[];
  status: 'recruiting' | 'completed' | 'urgent';
  form_type?: 'basic' | 'free';
  created_at: string;
  applicant_stats?: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
  };
};

export type ActionResult<T = void> = {
  ok: boolean;
  message: string;
  data?: T;
  fieldErrors?: Record<string, string>;
};
