export type WorkShift = {
  date: string;
  date_end?: string;   // 기간 근무 종료일 (undefined = 당일 근무)
  start: string;
  end: string;
};

// New v3: part-centric
export type WorkPart = {
  name: string;
  description?: string;
  location?: string;
  pay_type?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  pay_amount?: number;
  recruit_count: number;
  tax_withholding?: boolean;
  meal_included?: boolean;
  meal_amount?: number;
  shifts: WorkShift[];
};

// Legacy v2/v1: date-centric
export type LegacySlot = {
  date: string;
  start_time?: string;
  end_time?: string;
  start?: string;
  end?: string;
  location?: string;
  pay_type?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  pay_amount?: number;
  tax_withholding?: boolean;
  meal_included?: boolean;
  meal_amount?: number;
  parts?: Array<{
    label: 'A' | 'B' | 'C';
    name: string;
    start: string;
    end: string;
    recruit_count: number;
  }>;
};

export const isNewPart = (item: unknown): item is WorkPart =>
  typeof item === 'object' && item !== null && 'shifts' in item;

export type PostData = {
  post_id: number;
  author_id: string;
  title: string;
  description: string;
  work_date?: string;
  work_time_start?: string;
  work_time_end?: string;
  location?: string;
  pay_amount?: string | number;
  pay_type?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  tax_withholding?: boolean;
  work_slots?: Array<WorkPart | LegacySlot>;
  recruit_count: number;
  recruit_male?: number | null;
  recruit_female?: number | null;
  manager_name: string;
  manager_contact_type?: 'phone' | 'kakao' | 'email' | 'other';
  manager_phone: string;
  equipments?: string;
  qualifications?: string;
  preferences?: string;
  notes?: string;
  external_link?: string;
  keywords?: string[];
  status: 'recruiting' | 'completed' | 'urgent';
  created_at: string;
  currentApplicants?: number;
  author_name?: string;
  author_avatar?: string;
  company_name?: string;
};
