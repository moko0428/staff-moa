/**
 * 결정론적 당일 도착 인증 코드 생성
 * - postId + UTC 날짜 기반 → DB 변경 없이 서버/클라이언트 공유 가능
 * - 자정(UTC)마다 자동 갱신
 */
export function generateDailyCode(postId: number): string {
  const today = new Date().toISOString().split('T')[0]; // UTC YYYY-MM-DD
  const seed = `smoa-${postId}-${today}`;
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h, 31) + seed.charCodeAt(i);
  }
  return String(Math.abs(h) % 1_000_000).padStart(6, '0');
}
