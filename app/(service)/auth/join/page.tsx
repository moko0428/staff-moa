'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { mockUsers } from '@/lib/mockData';
import Link from 'next/link';

type RoleOption = 'member' | 'manager';
type CompanyType = 'individual' | 'corporate';

export default function JoinPage() {
  const router = useRouter();
  const [role, setRole] = useState<RoleOption>('member');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [companyType, setCompanyType] = useState<CompanyType>('individual');
  const [companyName, setCompanyName] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    // 기존 계정 중복 검사 (mock + custom)
    const storedCustom = localStorage.getItem('customUsers');
    const customUsers = storedCustom ? JSON.parse(storedCustom) : [];
    const allUsers = [...mockUsers, ...customUsers];
    const exists = allUsers.some((u) => u.email === email.trim());
    if (exists) {
      setError('이미 존재하는 이메일입니다.');
      return;
    }

    const newUser = {
      id: `custom-${Date.now()}`,
      email: email.trim(),
      name: name.trim(),
      role: role,
      password,
      createdAt: new Date().toISOString(),
      attendanceScore: 0,
      companyName:
        role === 'manager' && companyType === 'corporate'
          ? companyName.trim()
          : undefined,
      businessNumber:
        role === 'manager' && companyType === 'corporate'
          ? businessNumber.trim()
          : undefined,
    };

    // 사용자 저장
    const updatedUsers = [...customUsers, newUser];
    localStorage.setItem('customUsers', JSON.stringify(updatedUsers));

    // 매니저라면 승인 요청 큐에 추가
    if (role === 'manager') {
      if (companyType === 'corporate') {
        if (!companyName.trim() || !businessNumber.trim()) {
          setError('법인 선택 시 회사명과 사업자번호를 입력해주세요.');
          return;
        }
      }

      const storedReq = localStorage.getItem('managerRequestsExtra');
      const extraReqs = storedReq ? JSON.parse(storedReq) : [];
      const request = {
        id: `local-req-${Date.now()}`,
        user: newUser,
        requestedAt: newUser.createdAt,
      };
      localStorage.setItem(
        'managerRequestsExtra',
        JSON.stringify([...extraReqs, request])
      );
      alert(
        '매니저 승인 요청이 접수되었습니다. 관리자가 승인하면 로그인할 수 있습니다.'
      );
    } else {
      alert('회원가입이 완료되었습니다. 로그인해주세요.');
    }

    router.push('/auth/login');
  };

  return (
    <div className="w-full h-full flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">회원가입</CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            일반 회원 또는 매니저를 선택해 가입할 수 있습니다.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label>가입 유형</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={role === 'member' ? 'default' : 'outline'}
                  onClick={() => setRole('member')}
                >
                  일반 회원
                </Button>
                <Button
                  type="button"
                  variant={role === 'manager' ? 'default' : 'outline'}
                  onClick={() => setRole('manager')}
                >
                  매니저
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                매니저를 선택하면 관리자 승인 대기 목록에 추가됩니다.
              </p>
            </div>

            {role === 'manager' && (
              <div className="space-y-2">
                <Label>사업자 유형</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={
                      companyType === 'individual' ? 'default' : 'outline'
                    }
                    onClick={() => setCompanyType('individual')}
                  >
                    개인
                  </Button>
                  <Button
                    type="button"
                    variant={
                      companyType === 'corporate' ? 'default' : 'outline'
                    }
                    onClick={() => setCompanyType('corporate')}
                  >
                    법인
                  </Button>
                </div>
                {companyType === 'corporate' && (
                  <div className="space-y-2">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">회사 이름</Label>
                      <Input
                        id="companyName"
                        placeholder="예) (주)바이브코퍼레이션"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessNumber">사업자번호</Label>
                      <Input
                        id="businessNumber"
                        placeholder="예) 123-45-67890"
                        value={businessNumber}
                        onChange={(e) => setBusinessNumber(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
              <Input
                id="passwordConfirm"
                type="password"
                placeholder="••••••••"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full">
              회원가입
            </Button>
          </form>
          <div className="text-sm text-gray-500 mt-2 text-center">
            <span>이미 계정이 있으신가요?</span>{' '}
            <Link href="/auth/login" className="text-blue-500">
              로그인
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
