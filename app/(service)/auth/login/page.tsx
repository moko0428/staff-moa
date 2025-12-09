'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { mockUsers } from '@/lib/mockData';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const storedCustom = localStorage.getItem('customUsers');
    const customUsers = storedCustom ? JSON.parse(storedCustom) : [];
    const allUsers = [...mockUsers, ...customUsers];

    const user = allUsers.find(
      (u) => u.email === email.trim() && u.password === password
    );

    if (!user) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      return;
    }

    // 로그인 상태 저장 (프로토타입용)
    localStorage.setItem('userId', user.id);
    localStorage.setItem('userRole', user.role);
    localStorage.setItem('userEmail', user.email);

    // 서버 미들웨어/SSR에서도 인증을 감지할 수 있도록 쿠키로도 보관
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `userId=${user.id}; path=/; expires=${expires}`;
    document.cookie = `authToken=mock-token; path=/; expires=${expires}`;

    // 로그인 상태 변화 이벤트 발행 (동일 탭 실시간 반영)
    window.dispatchEvent(new Event('auth-changed'));

    alert(`${user.name} (${user.role})으로 로그인되었습니다.`);
    router.push('/post');
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">로그인</CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            테스트 계정으로 로그인하세요.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full">
              로그인
            </Button>
          </form>

          <div className="text-sm text-gray-500 mt-2 text-center">
            <span>계정이 없으신가요?</span>{' '}
            <Link href="/auth/join" className="text-blue-500">
              회원가입
            </Link>
          </div>
          <div className="mt-6 space-y-2 text-sm text-gray-600">
            <p className="font-semibold text-gray-700">테스트 계정</p>
            <p>관리자: admin@staffjob.com / admin1234</p>
            <p>매니저: manager@company.com / manager1234</p>
            <p>회원: worker1@email.com / worker11234</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
