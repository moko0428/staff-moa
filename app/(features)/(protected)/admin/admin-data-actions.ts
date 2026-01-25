'use server';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Supabase service role 환경변수가 설정되지 않았습니다.');
}

const adminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export type AdminMemberItem = {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  photo?: string | null;
  attendanceScore?: number | null;
};

export type AdminPostItem = {
  id: string;
  title: string;
  description: string;
  location: string;
  workDate: string;
  workTimeStart: string;
  workTimeEnd: string;
  payAmount: string;
  payType: string;
  recruitCount: number;
  authorId: string;
  authorName: string;
  status: 'recruiting' | 'completed' | 'urgent';
  createdAt: string;
};

/**
 * 회원 관리 탭 - member, manager, pending_manager 조회
 */
export async function fetchMembersAction(): Promise<AdminMemberItem[]> {
  const { data, error } = await adminClient
    .from('profiles')
    .select('user_id, email, name, avatar, role, attendance_score')
    .in('role', ['member', 'manager', 'pending_manager'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('fetchMembersAction error:', error);
    throw error;
  }

  return (
    data?.map((row) => ({
      id: row.user_id,
      email: row.email,
      name: row.name,
      photo: row.avatar,
      role: row.role,
      attendanceScore: row.role === 'member' ? row.attendance_score : null,
    })) ?? []
  );
}

/**
 * 게시글 관리 탭 - 모든 게시글 조회
 */
export async function fetchPostsAction(): Promise<AdminPostItem[]> {
  const { data, error } = await adminClient
    .from('posts')
    .select(`
      post_id,
      title,
      description,
      location,
      work_date,
      work_time_start,
      work_time_end,
      pay_amount,
      pay_type,
      recruit_count,
      author_id,
      status,
      created_at
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('fetchPostsAction error:', error);
    throw error;
  }

  // 작성자 정보 가져오기
  const authorIds = [...new Set(data?.map((row) => row.author_id) || [])];

  if (authorIds.length === 0) {
    return [];
  }

  const { data: profilesData, error: profilesError } = await adminClient
    .from('profiles')
    .select('user_id, name')
    .in('user_id', authorIds);

  if (profilesError) {
    console.error('fetchPostsAction profiles error:', profilesError);
  }

  const profilesMap = new Map(
    profilesData?.map((p) => [p.user_id, p.name ?? '알 수 없음']) || []
  );

  return (
    data?.map((row) => ({
      id: row.post_id.toString(),
      title: row.title,
      description: row.description,
      location: row.location,
      workDate: row.work_date,
      workTimeStart: row.work_time_start,
      workTimeEnd: row.work_time_end,
      payAmount: row.pay_amount.toString(),
      payType: row.pay_type,
      recruitCount: row.recruit_count,
      authorId: row.author_id,
      authorName: profilesMap.get(row.author_id) || '알 수 없음',
      status: row.status as 'recruiting' | 'completed' | 'urgent',
      createdAt: row.created_at,
    })) ?? []
  );
}
