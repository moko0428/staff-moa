export type WorkType = 'single' | 'range' | 'multi';

export type WorkPart = {
  label: 'A' | 'B' | 'C';
  name: string;
  start: string;
  end: string;
  recruit_count: number;
};

export type PostRow = {
  id: string;
  author_id: string;
  title: string;
  description: string;
  location?: string;
  work_slots: Array<{
    date: string;
    location?: string;
    pay_type: 'hourly' | 'daily' | 'weekly' | 'monthly';
    pay_amount: number;
    tax_withholding: boolean;
    meal_included?: boolean;
    meal_amount?: number;
    parts?: WorkPart[];
    // Legacy backward compat
    start?: string;
    end?: string;
    start_time?: string;
    end_time?: string;
  }>;
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

export type WorkSlot = {
  date: string;
  location: string;
  pay_type: 'hourly' | 'daily' | 'weekly' | 'monthly';
  pay_amount: number;
  tax_withholding: boolean;
  meal_included: boolean;
  meal_amount: number;
  parts: WorkPart[];
};

export type ActionResult<T = void> = {
  ok: boolean;
  message: string;
  data?: T;
  fieldErrors?: Record<string, string>;
};
