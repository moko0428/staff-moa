import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = '고인력 | 단기알바·스탭 구인구직';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          gap: '24px',
        }}
      >
        {/* 로고 */}
        <img
          src="https://www.goinlyeog.com/assets/primary_text_logo.png"
          width={320}
          height={80}
          style={{ objectFit: 'contain' }}
        />
        {/* 슬로건 */}
        <p
          style={{
            fontSize: '36px',
            fontWeight: 700,
            color: '#111827',
            margin: 0,
          }}
        >
          단기알바·스탭 구인구직 플랫폼
        </p>
        {/* 서브 */}
        <p
          style={{
            fontSize: '24px',
            color: '#6b7280',
            margin: 0,
          }}
        >
          고인력에서 빠르게 구인하고 지원하세요
        </p>
        {/* 도메인 */}
        <p
          style={{
            fontSize: '20px',
            color: '#9ca3af',
            margin: 0,
          }}
        >
          www.goinlyeog.com
        </p>
      </div>
    ),
    { ...size },
  );
}
