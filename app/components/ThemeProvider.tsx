'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ComponentProps, useEffect } from 'react';
import { useTheme } from 'next-themes';

type ThemeProviderProps = ComponentProps<typeof NextThemesProvider>;

function ThemeSystemGuard() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    // 시스템 모드를 제거: 기존 저장값이 system이면 현재 해석된 테마로 고정
    if (theme === 'system') {
      setTheme(resolvedTheme === 'dark' ? 'dark' : 'light');
    }
  }, [theme, resolvedTheme, setTheme]);

  return null;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ThemeSystemGuard />
      {children}
    </NextThemesProvider>
  );
}
