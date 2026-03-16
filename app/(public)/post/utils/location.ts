const PROVINCE_SHORT: Record<string, string> = {
  서울특별시: '서울',
  세종특별자치시: '세종',
  제주특별자치도: '제주',
  경기도: '경기',
  강원도: '강원',
  충청북도: '충북',
  충청남도: '충남',
  전라북도: '전북',
  전북특별자치도: '전북',
  전라남도: '전남',
  경상북도: '경북',
  경상남도: '경남',
};

/**
 * 주소 문자열에서 시/도(줄임) + 구/시/군 형태로 반환합니다.
 * 예: "서울특별시 서초구 XX로 1" → "서울 서초구"
 *     "경기도 화성시 팔탄면" → "경기 화성시"
 *     "부산광역시 해운대구 XX동" → "부산 해운대구"
 */
export function formatLocationShort(loc: string): string {
  if (!loc) return loc;
  const parts = loc.trim().split(/\s+/);
  if (parts.length === 0) return loc;

  const raw = parts[0];
  const district = parts[1]; // 구/시/군 등

  let short = PROVINCE_SHORT[raw];
  if (!short) {
    // X광역시, X특별시, X특별자치시 → X
    if (raw.endsWith('광역시')) short = raw.replace('광역시', '');
    else if (raw.endsWith('특별자치시')) short = raw.replace('특별자치시', '');
    else if (raw.endsWith('특별시')) short = raw.replace('특별시', '');
    else if (raw.endsWith('특별자치도')) short = raw.replace('특별자치도', '');
    else short = raw;
  }

  if (!district) return short;
  return `${short} ${district}`;
}
