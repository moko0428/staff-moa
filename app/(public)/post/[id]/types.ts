export type WorkPart = {
  label: 'A' | 'B' | 'C';
  name: string;
  start: string;
  end: string;
  recruit_count: number;
};

export type WorkSlot = {
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
  parts?: WorkPart[];
};

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
  work_slots?: WorkSlot[];
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
