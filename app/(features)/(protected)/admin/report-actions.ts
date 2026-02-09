'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import type {
  ReportReason,
  ReportStatus,
  PostReportWithDetails,
  ReportedPostSummary,
} from './report-constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase service role 환경변수가 설정되지 않았습니다.');
  }
  return createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

type ActionResult<T = void> = {
  ok: boolean;
  message: string;
  data?: T;
};

// Create a new report
export async function createReportAction(
  postId: number,
  reason: ReportReason,
  detail?: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: '로그인이 필요합니다.' };
  }

  // Check user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!profile || !['member', 'manager', 'admin'].includes(profile.role)) {
    return { ok: false, message: '신고 권한이 없습니다.' };
  }

  // Check if already reported
  const { data: existingReport } = await supabase
    .from('post_reports')
    .select('report_id')
    .eq('post_id', postId)
    .eq('reporter_id', user.id)
    .single();

  if (existingReport) {
    return { ok: false, message: '이미 신고한 게시물입니다.' };
  }

  // Validate detail length
  if (detail && detail.length > 200) {
    return { ok: false, message: '기타 사항은 200자 이내로 작성해주세요.' };
  }

  // Create report
  const { error } = await supabase.from('post_reports').insert({
    post_id: postId,
    reporter_id: user.id,
    reason,
    detail: detail || null,
    status: 'pending',
  });

  if (error) {
    console.error('[createReportAction] Error:', error);
    return { ok: false, message: '신고 접수 중 오류가 발생했습니다.' };
  }

  return { ok: true, message: '신고가 접수되었습니다.' };
}

// Check if user has already reported a post
export async function checkReportAction(
  postId: number
): Promise<ActionResult<boolean>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: true, data: false, message: '' };
  }

  const { data: existingReport } = await supabase
    .from('post_reports')
    .select('report_id')
    .eq('post_id', postId)
    .eq('reporter_id', user.id)
    .single();

  return { ok: true, data: !!existingReport, message: '' };
}

// Get all reports grouped by post (for admin)
export async function getReportedPostsAction(): Promise<
  ActionResult<ReportedPostSummary[]>
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: '로그인이 필요합니다.', data: [] };
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return { ok: false, message: '관리자 권한이 필요합니다.', data: [] };
  }

  // Use admin client to bypass RLS
  const adminClient = getAdminClient();

  // Get all pending/reviewed reports with post and author info
  const { data: reports, error } = await adminClient
    .from('post_reports')
    .select(
      `
      report_id,
      post_id,
      reason,
      status,
      created_at
    `
    )
    .in('status', ['pending', 'reviewed'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getReportedPostsAction] Error:', error);
    return { ok: false, message: '신고 목록 조회 중 오류가 발생했습니다.', data: [] };
  }

  if (!reports || reports.length === 0) {
    return { ok: true, message: '', data: [] };
  }

  // Get unique post IDs
  const postIds = [...new Set(reports.map((r) => r.post_id))];

  // Fetch posts separately
  const { data: postsData, error: postsError } = await adminClient
    .from('posts')
    .select('post_id, title, location, author_id')
    .in('post_id', postIds);

  if (postsError) {
    console.error('[getReportedPostsAction] Posts error:', postsError);
    return { ok: false, message: '게시물 조회 중 오류가 발생했습니다.', data: [] };
  }

  // Get author IDs
  const authorIds = [...new Set(postsData?.map((p) => p.author_id) || [])];

  // Fetch authors
  const { data: authorsData } = await adminClient
    .from('profiles')
    .select('user_id, name')
    .in('user_id', authorIds);

  // Create lookup maps
  const postsMap = new Map(postsData?.map((p) => [p.post_id, p]) || []);
  const authorsMap = new Map(authorsData?.map((a) => [a.user_id, a.name]) || []);

  // Group by post
  const postMap = new Map<number, ReportedPostSummary>();

  for (const report of reports) {
    const postId = report.post_id;
    const post = postsMap.get(postId);

    if (!post) continue;

    const authorName = authorsMap.get(post.author_id) || '알 수 없음';

    if (postMap.has(postId)) {
      const existing = postMap.get(postId)!;
      existing.report_count += 1;
      if (!existing.reasons.includes(report.reason as ReportReason)) {
        existing.reasons.push(report.reason as ReportReason);
      }
      if (new Date(report.created_at) > new Date(existing.latest_report_at)) {
        existing.latest_report_at = report.created_at;
      }
    } else {
      postMap.set(postId, {
        post_id: postId,
        post_title: post.title,
        post_location: post.location,
        post_author_id: post.author_id,
        post_author_name: authorName,
        report_count: 1,
        reasons: [report.reason as ReportReason],
        latest_report_at: report.created_at,
        status: report.status as ReportedPostSummary['status'],
      });
    }
  }

  const result = Array.from(postMap.values()).sort(
    (a, b) => b.report_count - a.report_count
  );

  return { ok: true, message: '', data: result };
}

// Get detailed reports for a specific post (for admin)
export async function getPostReportsAction(
  postId: number
): Promise<ActionResult<PostReportWithDetails[]>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: '로그인이 필요합니다.', data: [] };
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return { ok: false, message: '관리자 권한이 필요합니다.', data: [] };
  }

  const { data: reports, error } = await supabase
    .from('post_reports')
    .select(
      `
      *,
      posts!inner (
        title,
        location,
        author_id,
        profiles!posts_author_id_fkey (
          name
        )
      ),
      reporter:profiles!post_reports_reporter_id_fkey (
        name,
        email
      )
    `
    )
    .eq('post_id', postId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getPostReportsAction] Error:', error);
    return { ok: false, message: '신고 상세 조회 중 오류가 발생했습니다.', data: [] };
  }

  const result: PostReportWithDetails[] = (reports || []).map((report) => {
    const post = report.posts as unknown as {
      title: string;
      location: string;
      author_id: string;
      profiles: { name: string } | null;
    };
    const reporter = report.reporter as unknown as {
      name: string;
      email: string;
    } | null;

    return {
      report_id: report.report_id,
      post_id: report.post_id,
      reporter_id: report.reporter_id,
      reason: report.reason as ReportReason,
      detail: report.detail,
      status: report.status as ReportStatus,
      admin_notes: report.admin_notes,
      created_at: report.created_at,
      reviewed_at: report.reviewed_at,
      reviewed_by: report.reviewed_by,
      post_title: post.title,
      post_location: post.location,
      post_author_id: post.author_id,
      post_author_name: post.profiles?.name || '알 수 없음',
      reporter_name: reporter?.name || '알 수 없음',
      reporter_email: reporter?.email || '',
    };
  });

  return { ok: true, message: '', data: result };
}

// Update report status (for admin)
export async function updateReportStatusAction(
  postId: number,
  status: ReportStatus,
  adminNotes?: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: '로그인이 필요합니다.' };
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return { ok: false, message: '관리자 권한이 필요합니다.' };
  }

  // Use admin client to bypass RLS
  const adminClient = getAdminClient();

  // Update all reports for this post
  const { error } = await adminClient
    .from('post_reports')
    .update({
      status,
      admin_notes: adminNotes || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq('post_id', postId);

  if (error) {
    console.error('[updateReportStatusAction] Error:', error);
    return { ok: false, message: '신고 처리 중 오류가 발생했습니다.' };
  }

  return { ok: true, message: '신고가 처리되었습니다.' };
}

// Delete post and resolve reports (for admin)
export async function deleteReportedPostAction(
  postId: number
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: '로그인이 필요합니다.' };
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return { ok: false, message: '관리자 권한이 필요합니다.' };
  }

  // Use admin client to bypass RLS
  const adminClient = getAdminClient();

  // Update all reports for this post to resolved
  await adminClient
    .from('post_reports')
    .update({
      status: 'resolved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq('post_id', postId);

  // Delete the post
  const { error } = await adminClient.from('posts').delete().eq('post_id', postId);

  if (error) {
    console.error('[deleteReportedPostAction] Error:', error);
    return { ok: false, message: '게시물 삭제 중 오류가 발생했습니다.' };
  }

  return { ok: true, message: '게시물이 삭제되고 신고가 처리되었습니다.' };
}
