'use server';

import { createClient } from '@/utils/supabase/server';

export type LandingStats = {
  memberCount: number;
  activePostCount: number;
  managerCount: number;
};

export async function getLandingStatsAction(): Promise<{
  ok: boolean;
  message: string;
  data?: LandingStats;
}> {
  try {
    const supabase = await createClient();

    // 병렬로 모든 통계 조회
    const [memberResult, postResult, managerResult] = await Promise.all([
      // 등록 스탭 수 (member 역할)
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'member'),

      // 활성 공고 수 (recruiting 또는 urgent 상태)
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .in('status', ['recruiting', 'urgent']),

      // 파트너 업체 수 (manager 역할)
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'manager'),
    ]);

    return {
      ok: true,
      message: '통계 조회 성공',
      data: {
        memberCount: memberResult.count ?? 0,
        activePostCount: postResult.count ?? 0,
        managerCount: managerResult.count ?? 0,
      },
    };
  } catch (error) {
    console.error('Failed to fetch landing stats:', error);
    return {
      ok: false,
      message: '통계 조회 중 오류가 발생했습니다.',
    };
  }
}
