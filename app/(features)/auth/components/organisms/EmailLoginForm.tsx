'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { signInAction } from '../../action';
import { ActionState } from '../../types';
import { useAuthRedirect } from '../../hooks/useAuthRedirect';
import AuthFormField from '../molecules/AuthFormField';
import ActionStateMessage from '../molecules/ActionStateMessage';

const initialState: ActionState = { ok: false, message: '' };

const EmailLoginForm = () => {
  const [state, formAction] = useActionState(signInAction, initialState);
  const [formValues, setFormValues] = useState({ email: '', password: '' });

  useAuthRedirect(state?.redirectTo);

  const setField = (field: keyof typeof formValues) => (value: string) =>
    setFormValues((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-4">
      <form className="space-y-4" action={formAction}>
        <AuthFormField
          id="email"
          name="email"
          label="이메일"
          type="email"
          placeholder="email@example.com"
          required
          value={formValues.email}
          onChange={setField('email')}
          error={state?.fieldErrors?.email}
        />
        <AuthFormField
          id="password"
          name="password"
          label="비밀번호"
          type="password"
          placeholder="••••••••"
          required
          value={formValues.password}
          onChange={setField('password')}
          error={state?.fieldErrors?.password}
        />
        <ActionStateMessage state={state} />
        <Button type="submit" className="w-full">
          로그인
        </Button>
      </form>
      <div className="text-sm text-muted-foreground mt-3 text-center">
        <span>계정이 없으신가요?</span>{' '}
        <Link href="/auth/join" className="text-blue-500">
          회원가입
        </Link>
      </div>
    </div>
  );
};

export default EmailLoginForm;
