'use client';

import { usePathname } from 'next/navigation';
import HeaderNav from './HeaderNav';

const HEADER_HIDDEN_PATHS = [
  '/profile',
  '/notification',
  '/settings',
];

export default function ConditionalHeaderNav() {
  const pathname = usePathname();
  const hidden = HEADER_HIDDEN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (hidden) return null;
  return <HeaderNav />;
}
