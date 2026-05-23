'use server';

import { createClient } from '@/utils/supabase/server';

export type ActivePost = {
  post_id: number;
  title: string;
  location: string | null;
  status: 'recruiting' | 'urgent' | 'completed';
  keywords: string[] | null;
  pay_amount: number | null;
  pay_type: string | null;
};

export type StaffReview = {
  id: string;
  reviewerName: string;
  rating: number;
  date: string;
  content: string;
};

export type PublicManagerProfile = {
  id: string;
  name: string | null;
  email: string | null;
  photo: string | null;
  role: string;
  introduction: string | null;
  followerCount: number;
  postCount: number;
  activePostCount: number;
  activePosts: ActivePost[];
  companyName: string | null;
  companyVerifyStatus: string | null;
  coverImage: string | null;
  phone: string | null;
  kakaoId: string | null;
  position: string | null;
  managerType: string | null;
  address: string | null;
  website: string | null;
  foundedYear: string | null;
  specialties: string[];
  activityRegions: string[];
  profileVisibility: { email: boolean; phone: boolean; kakaoId: boolean };
  createdAt: string | null;
  staffReviews: StaffReview[];
  averageRating: number | null;
};

export async function getPublicManagerProfileAction(
  userId: string
): Promise<{ ok: boolean; data: PublicManagerProfile | null }> {
  try {
    const supabase = await createClient();

    const [profileResult, followerResult, postResult, activePostResult] = await Promise.all([
      supabase
        .from('profiles')
        .select(
          'user_id, name, email, phone, kakao_id, avatar, role, bio, company_name, company_verify_status, cover_image, position, manager_type, address, website, founded_year, specialties, activity_regions, profile_visibility, created_at'
        )
        .eq('user_id', userId)
        .single(),
      supabase
        .from('manager_follows')
        .select('follower_id', { count: 'exact', head: true })
        .eq('manager_id', userId),
      supabase
        .from('posts')
        .select('post_id', { count: 'exact', head: true })
        .eq('author_id', userId),
      supabase
        .from('posts')
        .select('post_id, title, location, status, keywords, pay_amount, pay_type')
        .eq('author_id', userId)
        .in('status', ['recruiting', 'urgent'])
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    if (profileResult.error || !profileResult.data) {
      return { ok: false, data: null };
    }

    const d = profileResult.data;
    const rawVis = d.profile_visibility as Record<string, unknown> | null | undefined;

    const activePosts: ActivePost[] = (activePostResult.data ?? []).map((p) => ({
      post_id: p.post_id as number,
      title: (p.title as string) ?? '',
      location: (p.location as string | null) ?? null,
      status: (p.status as 'recruiting' | 'urgent' | 'completed') ?? 'recruiting',
      keywords: (p.keywords as string[] | null) ?? null,
      pay_amount: (p.pay_amount as number | null) ?? null,
      pay_type: (p.pay_type as string | null) ?? null,
    }));

    return {
      ok: true,
      data: {
        id: d.user_id as string,
        name: (d.name as string | null) ?? null,
        email: (d.email as string | null) ?? null,
        photo: (d.avatar as string | null) ?? null,
        role: (d.role as string) ?? 'member',
        introduction: (d.bio as string | null) ?? null,
        followerCount: followerResult.count ?? 0,
        postCount: postResult.count ?? 0,
        activePostCount: activePosts.length,
        activePosts,
        companyName: (d.company_name as string | null) ?? null,
        companyVerifyStatus: (d.company_verify_status as string | null) ?? null,
        coverImage: (d.cover_image as string | null) ?? null,
        phone: (d.phone as string | null) ?? null,
        kakaoId: (d.kakao_id as string | null) ?? null,
        position: (d.position as string | null) ?? null,
        managerType: (d.manager_type as string | null) ?? null,
        address: (d.address as string | null) ?? null,
        website: (d.website as string | null) ?? null,
        foundedYear: (d.founded_year as string | null) ?? null,
        specialties: (d.specialties as string[] | null) ?? [],
        activityRegions: (d.activity_regions as string[] | null) ?? [],
        profileVisibility: {
          email: rawVis?.email !== false,
          phone: rawVis?.phone !== false,
          kakaoId: rawVis?.kakaoId !== false,
        },
        createdAt: (d.created_at as string | null) ?? null,
        staffReviews: [],
        averageRating: null,
      },
    };
  } catch {
    return { ok: false, data: null };
  }
}
