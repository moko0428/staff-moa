export type WorkType = 'single' | 'range' | 'multi';

export type PostRow = {
  id: string;
  author_id: string;
  title: string;
  description: string;
  location?: string;
  work_slots: Array<{
    date: string;
    start: string;
    end: string;
    work_type?: WorkType;
    location?: string;
    pay_type: 'hourly' | 'daily' | 'weekly' | 'monthly';
    pay_amount: number;
    tax_withholding: boolean;
  }>;
  recruit_count: number;
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
  work_type: WorkType;
  date: string;
  start: string;
  end: string;
  location: string;
  pay_type: 'hourly' | 'daily' | 'weekly' | 'monthly';
  pay_amount: number;
  tax_withholding: boolean;
  meal_included: boolean;
  meal_amount: number;
};

export type EditWorkSlot = {
  date: string;
  start: string;
  end: string;
  location: string;
  pay_type: 'hourly' | 'daily' | 'weekly' | 'monthly';
  pay_amount: number;
  tax_withholding: boolean;
};

export type ActionResult<T = void> = {
  ok: boolean;
  message: string;
  data?: T;
  fieldErrors?: Record<string, string>;
};
