import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rating, content } = body as { rating: number; content: string };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false, message: '로그인이 필요합니다.' }, { status: 401 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ ok: false, message: '별점은 1~5점 사이여야 합니다.' }, { status: 400 });
    }
    if (!content?.trim()) {
      return NextResponse.json({ ok: false, message: '리뷰 내용을 입력해주세요.' }, { status: 400 });
    }

    const { data: existingReview } = await supabase
      .from('app_reviews')
      .select('review_id')
      .eq('user_id', user.id)
      .single();

    if (existingReview) {
      const { error } = await supabase
        .from('app_reviews')
        .update({
          rating,
          content: content.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Failed to update review:', error);
        return NextResponse.json({ ok: false, message: '리뷰 수정에 실패했습니다.' }, { status: 500 });
      }
      return NextResponse.json({ ok: true, message: '리뷰가 수정되었습니다.' });
    }

    const { error } = await supabase.from('app_reviews').insert({
      user_id: user.id,
      rating,
      content: content.trim(),
    });

    if (error) {
      console.error('Failed to submit review:', error);
      return NextResponse.json({ ok: false, message: '리뷰 제출에 실패했습니다.' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, message: '리뷰가 제출되었습니다.' });
  } catch (e) {
    console.error('Submit review error:', e);
    return NextResponse.json({ ok: false, message: '오류가 발생했습니다.' }, { status: 500 });
  }
}
