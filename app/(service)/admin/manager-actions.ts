'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Supabase service role 환경변수가 설정되지 않았습니다.');
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export type PendingManager = {
  id: string;
  name: string;
  email: string;
  photo?: string | null;
  companyName?: string | null;
  businessNumber?: string | null;
  companyCertificate?: string | null;
  phone?: string | null;
  kakaoId?: string | null;
  verifyStatus: 'pending' | 'approved' | 'rejected' | null;
  requestedAt: string;
  profileCompleted: boolean;
};

export async function fetchPendingManagersAction(): Promise<PendingManager[]> {
  const { data, error } = await adminClient
    .from('user_profiles')
    .select(
      'user_id, name, email, photo, phone, kakao_id, company_name, business_number, company_certificate, company_verify_status, created_at, updated_at, role'
    )
    // 승인 대기만 노출: pending_manager이며 status가 null 또는 pending
    .eq('role', 'pending_manager')
    .or('company_verify_status.is.null,company_verify_status.eq.pending')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('fetchPendingManagersAction error', error);
    throw error;
  }

  return (
    data?.map((row) => {
      const requiredFilled = [
        row.phone,
        row.kakao_id,
        row.company_name,
        row.business_number,
        row.company_certificate,
      ].every((v) => !!v && String(v).trim().length > 0);

      return {
        id: row.user_id,
        name: row.name,
        email: row.email,
        photo: row.photo,
        phone: row.phone,
        kakaoId: row.kakao_id,
        companyName: row.company_name,
        businessNumber: row.business_number,
        companyCertificate: row.company_certificate,
        verifyStatus:
          (row.company_verify_status as
            | 'pending'
            | 'approved'
            | 'rejected'
            | null) ?? 'pending',
        requestedAt: row.updated_at || row.created_at || '',
        profileCompleted: requiredFilled,
      };
    }) ?? []
  );
}

export async function updateManagerStatusAction(
  userId: string,
  decision: 'approve' | 'reject'
): Promise<void> {
  const nextStatus = decision === 'approve' ? 'approved' : 'rejected';
  const nextRole = decision === 'approve' ? 'manager' : 'pending_manager';

  const { error } = await adminClient
    .from('user_profiles')
    .update({ company_verify_status: nextStatus, role: nextRole })
    .eq('user_id', userId);

  if (error) {
    console.error('updateManagerStatusAction error', error);
    throw error;
  }

  // auth.users 메타데이터도 동기화하여 재로그인 시 role이 올바르게 반영되도록 한다.
  const { error: authError } = await adminClient.auth.admin.updateUserById(
    userId,
    {
      user_metadata: {
        role: nextRole,
        company_verify_status: nextStatus,
      },
    }
  );
  if (authError) {
    // 서비스 롤 키가 없거나 권한 부족(403 not_admin) 시에는 조용히 패스
    if (authError?.status === 403 || authError?.code === 'not_admin') {
      return;
    }
    console.warn('updateManagerStatusAction auth sync skipped', authError);
  }
}
