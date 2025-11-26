'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export default function AuthButtons() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    try {
      const flag =
        typeof window !== 'undefined' ? localStorage.getItem('auth') : null;
      setIsAuthenticated(flag === '1');
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  return (
    <div className="shrink-0 flex items-center gap-2">
      {isAuthenticated ? (
        <Button variant="secondary" size="sm" type="button">
          프로필
        </Button>
      ) : (
        <>
          <Button variant="outline" size="sm" type="button">
            로그인
          </Button>
          <Button variant="default" size="sm" type="button">
            회원가입
          </Button>
        </>
      )}
    </div>
  );
}
