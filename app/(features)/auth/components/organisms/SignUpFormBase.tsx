'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { signUpAction } from '../../action';
import { ActionState, RoleOption } from '../../types';
import { useAuthRedirect } from '../../hooks/useAuthRedirect';
import { TermsAgreeSection } from '../TermsBottomSheet';
import AuthFormField from '../molecules/AuthFormField';
import ActionStateMessage from '../molecules/ActionStateMessage';

interface SignUpFormBaseProps {
  role: RoleOption;
}

const initialState: ActionState = { ok: false, message: '' };

const SignUpFormBase = ({ role }: SignUpFormBaseProps) => {
  const [state, formAction] = useActionState(signUpAction, initialState);
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    serviceAgree: false,
    privacyAgree: false,
  });

  useAuthRedirect(state?.redirectTo);

  const setField =
    (field: keyof Pick<typeof formValues, 'name' | 'email' | 'password' | 'passwordConfirm'>) =>
    (value: string) =>
      setFormValues((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-4">
      <form className="space-y-4" action={formAction}>
        <AuthFormField
          id="name"
          name="name"
          label="이름"
          placeholder="홍길동"
          required
          value={formValues.name}
          onChange={setField('name')}
          error={state?.fieldErrors?.name}
        />
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
        <AuthFormField
          id="passwordConfirm"
          name="passwordConfirm"
          label="비밀번호 확인"
          type="password"
          placeholder="••••••••"
          required
          value={formValues.passwordConfirm}
          onChange={setField('passwordConfirm')}
          error={state?.fieldErrors?.passwordConfirm}
        />
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
        <ActionStateMessage state={state} />
        <input type="hidden" name="role" value={role} />
        <Button type="submit" className="w-full">
          회원가입
        </Button>
      </form>
      <div className="text-sm text-muted-foreground mt-2 text-center">
        <span>이미 계정이 있으신가요?</span>{' '}
        <Link href="/auth/login" className="text-blue-500">
          로그인
        </Link>
      </div>
    </div>
  );
};

export default SignUpFormBase;
