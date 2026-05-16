// 신뢰점수 시스템 — 상수 및 순수 계산 함수

// 네이밍 상수 (변경 시 이 파일만 수정하면 됨)
export const TRUST_SCORE_LABEL = '신뢰점수';
export const TRUST_SCORE_MAX = 100;
export const TRUST_SCORE_PROFILE_POINTS = 50;
export const TRUST_SCORE_ACTIVITY_MAX = 50;
export const TRUST_SCORE_INITIAL = 0;

// 활동 점수 증감 상수
export const TRUST_PER_GOOD_REVIEW = 3;    // score ≥ 80
export const TRUST_PER_NEUTRAL_REVIEW = 2; // 50 ≤ score < 80
export const TRUST_PER_POOR_REVIEW = 1;    // score < 50

/**
 * 프로필 완성 점수 계산 (0 또는 50)
 * 7개 필드(name, phone, kakao_id, birth_date, gender, bio, avatar) 모두 채워야 50점
 */
export function calculateProfileScore(profile: {
  name?: string | null;
  phone?: string | null;
  kakao_id?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  bio?: string | null;
  avatar?: string | null;
}): 0 | 50 {
  const fields = [
    profile.name,
    profile.phone,
    profile.kakao_id,
    profile.birth_date,
    profile.gender,
    profile.bio,
    profile.avatar,
  ];
  return fields.every(Boolean) ? TRUST_SCORE_PROFILE_POINTS : 0;
}

/**
 * 평가 이벤트로 인한 활동 점수 증감 계산
 * @param reviewScore  매니저 평가 점수 (20~100)
 * @param penaltyTotal 감점 항목 합계
 */
export function calcReviewDelta(reviewScore: number, penaltyTotal: number): number {
  const bonus =
    reviewScore >= 80 ? TRUST_PER_GOOD_REVIEW :
    reviewScore >= 50 ? TRUST_PER_NEUTRAL_REVIEW :
    TRUST_PER_POOR_REVIEW;
  return bonus - penaltyTotal;
}

/**
 * 최종 신뢰점수 합산 (0~100 clamp)
 */
export function computeTrustScore(profileScore: 0 | 50, activityScore: number): number {
  return Math.max(0, Math.min(TRUST_SCORE_MAX, profileScore + activityScore));
}
