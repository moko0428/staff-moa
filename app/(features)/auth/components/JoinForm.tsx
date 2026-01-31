'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import Link from 'next/link';
import { useActionState } from 'react';
import { signUpAction } from '../action';
import { cn } from '@/lib/utils';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Checkbox } from '@/app/components/ui/checkbox';

type RoleOption = 'member' | 'manager';

type ActionState = {
  ok: boolean;
  message: string;
  redirectTo?: string;
  fieldErrors?: Record<string, string>;
};

const initialState: ActionState = {
  ok: false,
  message: '',
};

export default function JoinPage() {
  const router = useRouter();
  const [state, formAction] = useActionState(signUpAction, initialState);
  const [role, setRole] = useState<RoleOption>('member');
  // const [activeTab, setActiveTab] = useState<'integrated' | 'social'>('social');
  const [activeTab, setActiveTab] = useState<'integrated' | 'social'>(
    'integrated'
  );
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    termsAgree: false,
  });

  useEffect(() => {
    if (state?.redirectTo) {
      router.push(state.redirectTo);
    }
  }, [state?.redirectTo, router]);

  return (
    <div className="w-full h-full flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            {' '}
            {role === 'member' ? '회원가입' : '매니저 회원가입'}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {role === 'member'
              ? '회원가입을 통해 원하는 공고에 지원해보세요.'
              : '회원가입 후 프로필 관리에서 회사 정보를 추가하세요.'}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>가입 유형</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="managerRole"
                  checked={role === 'manager'}
                  onCheckedChange={(checked) =>
                    setRole(checked ? 'manager' : 'member')
                  }
                />
                <Label htmlFor="managerRole" className="text-sm">
                  매니저로 가입하기
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                가입 후 프로필 관리 페이지에서 회사 정보를 추가하여 관리자에게
                승인을 받아야 합니다.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={'ghost'}
                onClick={() => setActiveTab('social')}
                className={cn(
                  'border-b-2 border-border rounded-none',
                  activeTab === 'social'
                    ? 'border-b-primary text-primary'
                    : 'bg-transparent text-foreground'
                )}
              >
                간편로그인
              </Button>
              <Button
                type="button"
                variant={'ghost'}
                onClick={() => setActiveTab('integrated')}
                className={cn(
                  'border-b-2 border-border rounded-none',
                  activeTab === 'integrated'
                    ? 'border-b-primary text-primary'
                    : 'bg-transparent text-foreground'
                )}
              >
                통합 회원가입
              </Button>
            </div>

            {activeTab === 'integrated' && (
              <form className="space-y-4" action={formAction}>
                <div className="space-y-2">
                  <Label htmlFor="name">이름</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="홍길동"
                    required
                    value={formValues.name}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                  {state?.fieldErrors?.name && (
                    <p className="text-xs text-red-500">
                      {state.fieldErrors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="email@example.com"
                    required
                    value={formValues.email}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                  {state?.fieldErrors?.email && (
                    <p className="text-xs text-red-500">
                      {state.fieldErrors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">비밀번호</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={formValues.password}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                  />
                  {state?.fieldErrors?.password && (
                    <p className="text-xs text-red-500">
                      {state.fieldErrors.password}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
                  <Input
                    id="passwordConfirm"
                    name="passwordConfirm"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={formValues.passwordConfirm}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        passwordConfirm: e.target.value,
                      }))
                    }
                  />
                  {state?.fieldErrors?.passwordConfirm && (
                    <p className="text-xs text-red-500">
                      {state.fieldErrors.passwordConfirm}
                    </p>
                  )}
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox
                    id="termsAgree"
                    name="termsAgree"
                    checked={formValues.termsAgree}
                    onCheckedChange={(checked) =>
                      setFormValues((prev) => ({
                        ...prev,
                        termsAgree: Boolean(checked),
                      }))
                    }
                  />
                  <Label htmlFor="termsAgree" className="text-sm leading-tight">
                    약관에 동의합니다. (필수)
                  </Label>
                </div>

                {state?.fieldErrors?.termsAgree && (
                  <p className="text-xs text-red-500">
                    {state.fieldErrors.termsAgree}
                  </p>
                )}

                {state?.message && (
                  <p
                    className={`text-sm ${
                      state.ok ? 'text-green-600' : 'text-red-500'
                    }`}
                  >
                    {state.message}
                  </p>
                )}
                <input type="hidden" name="role" value={role} />

                <Button type="submit" className="w-full">
                  회원가입
                </Button>
              </form>
            )}

            {activeTab === 'social' && (
              // <div className="space-y-3">
              //   <Button
              //     type="button"
              //     variant="outline"
              //     className="w-full bg-[#FEE500] text-black"
              //   >
              //     카카오로 계속하기
              //   </Button>
              //   <Button
              //     type="button"
              //     variant="outline"
              //     className="w-full bg-[#4285F4] text-white"
              //   >
              //     구글로 계속하기
              //   </Button>
              // </div>
              <div className="text-center text-sm text-muted-foreground">
                소셜 로그인 기능은 준비 중입니다.
              </div>
            )}
          </div>
          <div className="text-sm text-muted-foreground mt-2 text-center">
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
