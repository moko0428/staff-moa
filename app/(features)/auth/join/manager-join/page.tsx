'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useActionState } from 'react';
import { signUpAction } from '../../action';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { ChevronLeft } from 'lucide-react';
import { RoleOption } from '../types';
import { TermsAgreeSection } from '../../components/TermsBottomSheet';

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

export default function ManagerJoinPage() {
  const router = useRouter();
  const [state, formAction] = useActionState(signUpAction, initialState);
  // 매니저 회원가입 페이지이므로 항상 'manager'로 고정
  const role: RoleOption = 'pending_manager';

  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    serviceAgree: false,
    privacyAgree: false,
  });

  useEffect(() => {
    if (state?.redirectTo) {
      router.push(state.redirectTo);
    }
  }, [state?.redirectTo, router]);

  return (
    <div className="w-full h-full flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2">
          <Link href="/auth">
            <ChevronLeft className="size-6" />
          </Link>
          <header className="space-y-2">
            <h2 className="text-xl font-semibold">매니저 회원가입</h2>
          </header>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          가입 후 프로필 관리 페이지에서 회사 정보를 추가하여 관리자에게 승인을
          받아야 합니다.
        </p>
        <main className="space-y-4 mt-12">
          <div className="space-y-6">
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

              <TermsAgreeSection
                serviceChecked={formValues.serviceAgree}
                privacyChecked={formValues.privacyAgree}
                onServiceChange={(checked) =>
                  setFormValues((prev) => ({ ...prev, serviceAgree: checked }))
                }
                onPrivacyChange={(checked) =>
                  setFormValues((prev) => ({ ...prev, privacyAgree: checked }))
                }
                fieldError={state?.fieldErrors?.termsAgree}
              />

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
          </div>
          <div className="text-sm text-muted-foreground mt-2 text-center">
            <span>이미 계정이 있으신가요?</span>{' '}
            <Link href="/auth/login" className="text-blue-500">
              로그인
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
