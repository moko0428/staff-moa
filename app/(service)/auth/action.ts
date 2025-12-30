'use server';

import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';
import { errorMessages, successMessages } from './messages';

type ActionResult = {
  ok: boolean;
  message: string;
  redirectTo?: string;
  fieldErrors?: Record<string, string>;
};

const signInSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요.'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
});

const signUpSchema = z
  .object({
    email: z.string().email('유효한 이메일을 입력해주세요.'),
    password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
    passwordConfirm: z.string().min(8),
    name: z.string().min(2, '이름은 2자 이상 입력해주세요.'),
    role: z.enum(['member', 'manager']),
    termsAgree: z.literal(true, {
      message: '약관에 동의해주세요.',
    }),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.passwordConfirm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '비밀번호가 일치하지 않습니다.',
        path: ['passwordConfirm'],
      });
    }

    // 매니저 회사 정보는 프로필 관리 플로우에서 처리
  });

export async function signInAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? errorMessages.unknown;
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const key = issue.path[0];
      if (typeof key === 'string' && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    });
    return { ok: false, message: firstError, fieldErrors };
  }

  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);

    if (error) {
      return { ok: false, message: errorMessages.invalidCredentials };
    }

    return { ok: true, message: successMessages.signIn, redirectTo: '/post' };
  } catch {
    return { ok: false, message: errorMessages.unknown };
  }
}

export async function signUpAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    passwordConfirm: formData.get('passwordConfirm'),
    name: formData.get('name'),
    role: formData.get('role'),
    termsAgree: formData.get('termsAgree') === 'on',
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? errorMessages.unknown;
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const key = issue.path[0];
      if (typeof key === 'string' && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    });
    return { ok: false, message: firstError, fieldErrors };
  }

  const { passwordConfirm: _passwordConfirm, ...payload } = parsed.data;
  void _passwordConfirm;

  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          name: payload.name,
          role: payload.role,
        },
      },
    });

    if (error) {
      return { ok: false, message: errorMessages.signUpFailed };
    }

    return {
      ok: true,
      message: successMessages.signUp,
      redirectTo: '/auth/login',
    };
  } catch {
    return { ok: false, message: errorMessages.signUpFailed };
  }
}

export async function signOutAction() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { ok: false, message: errorMessages.signOutFailed };
  }
  return { ok: true, message: successMessages.signOut };
}
