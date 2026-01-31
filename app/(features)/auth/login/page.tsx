'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import Link from 'next/link';
import { useActionState } from 'react';
import { signInAction } from '../action';
import { ChevronLeft } from 'lucide-react';

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

export default function LoginPage() {
  const router = useRouter();
  const [state, formAction] = useActionState(signInAction, initialState);
  const [formValues, setFormValues] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    if (state?.redirectTo) {
      router.push(state.redirectTo);
    }
  }, [state?.redirectTo, router]);

  return (
    <div className="w-full h-full flex items-center justify-center px-4 py-10">
      <div className="flex flex-col w-full max-w-md">
        <div className="flex items-center gap-2">
          <Link href="/auth">
            <ChevronLeft className="size-6" />
          </Link>
          <header className="space-y-2">
            <h2 className="text-xl font-semibold">이메일로 로그인</h2>
          </header>
        </div>
        <main className="space-y-4 mt-12">
          <form className="space-y-4" action={formAction}>
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
                  setFormValues((prev) => ({ ...prev, email: e.target.value }))
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
            {state?.message && (
              <p
                className={`text-sm ${
                  state.ok ? 'text-green-600' : 'text-red-500'
                }`}
              >
                {state.message}
              </p>
            )}
            <Button type="submit" className="w-full">
              로그인
            </Button>
          </form>

          {/* <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex-1 h-px bg-border" />
              <span>간편 로그인</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full bg-[#FEE500] text-black"
            >
              카카오로 계속하기
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full bg-[#4285F4] text-white"
            >
              구글로 계속하기
            </Button>
          </div> */}

          <div className="text-sm text-muted-foreground mt-3 text-center">
            <span>계정이 없으신가요?</span>{' '}
            <Link href="/auth/join" className="text-blue-500">
              회원가입
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
