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

/**
 * TTL 기반 체크인 코드 생성 (30분마다 갱신)
 * - postId + 30분 윈도우 기반 → DB 저장 불필요
 * - 서버/클라이언트 동일 알고리즘으로 검증 가능
 */
export function generateCheckinCode(postId: number, windowMinutes = 30): string {
  const windowMs = windowMinutes * 60 * 1000;
  const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
  const windowDate = new Date(windowStart).toISOString();
  const seed = `smoa-checkin-${postId}-${windowDate}`;
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h, 31) + seed.charCodeAt(i);
  }
  return String(Math.abs(h) % 1_000_000).padStart(6, '0');
}

/** 다음 체크인 코드 갱신까지 남은 ms */
export function checkinCodeExpiresInMs(windowMinutes = 30): number {
  const windowMs = windowMinutes * 60 * 1000;
  const now = Date.now();
  const nextWindow = (Math.floor(now / windowMs) + 1) * windowMs;
  return nextWindow - now;
}
