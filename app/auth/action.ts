'use server';

import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';
import { errorMessages, successMessages } from './messages';
import { ensureProfile } from './utils/ensure-profile';

type ActionResult = {
  ok: boolean;
  message: string;
  redirectTo?: string;
  fieldErrors?: Record<string, string>;
};

const envStatus = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  return {
    ok: Boolean(supabaseUrl && supabaseKey && siteUrl),
    supabaseUrl: supabaseUrl ?? '(unset)',
    supabaseKeyPreview: supabaseKey
      ? `${supabaseKey.slice(0, 4)}...${supabaseKey.slice(-4)}`
      : '(unset)',
    siteUrl: siteUrl ?? '(unset)',
  };
};

/* =========================
   Schema
========================= */

const signInSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요.')
    .email('유효한 이메일을 입력해주세요.'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
});

const signUpSchema = z
  .object({
    email: z
      .string()
      .min(1, '이메일을 입력해주세요.')
      .email('유효한 이메일을 입력해주세요.'),
    password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
    passwordConfirm: z.string().min(8),
    name: z.string().min(2, '이름은 2자 이상 입력해주세요.'),
    role: z.literal('member'),
    termsAgree: z.boolean().refine((v) => v === true, { message: '이용약관에 동의해주세요.' }),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.passwordConfirm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '비밀번호가 일치하지 않습니다.',
        path: ['passwordConfirm'],
      });
    }
  });

/* =========================
   Sign In
========================= */

export const signInAction = async (
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> => {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((i) => {
      if (typeof i.path[0] === 'string') {
        fieldErrors[i.path[0]] = i.message;
      }
    });
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? errorMessages.unknown,
      fieldErrors,
    };
  }

  const env = envStatus();
  if (!env.ok) {
    return { ok: false, message: '환경변수가 올바르지 않습니다.' };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);

    if (error) {
      if (
        error.code === 'email_not_confirmed' ||
        error.message.toLowerCase().includes('not confirmed')
      ) {
        return {
          ok: false,
          message: errorMessages.emailNotConfirmed,
          fieldErrors: { email: errorMessages.emailNotConfirmed },
        };
      }
      return {
        ok: false,
        message: errorMessages.invalidCredentials,
        fieldErrors: { password: errorMessages.invalidCredentials },
      };
    }

    const returnUrl = formData.get('returnUrl');
    const safeReturnUrl =
      typeof returnUrl === 'string' &&
      returnUrl.startsWith('/') &&
      !returnUrl.includes('://')
        ? returnUrl
        : '/post';

    return {
      ok: true,
      message: successMessages.signIn,
      redirectTo: safeReturnUrl,
    };
  } catch {
    return { ok: false, message: errorMessages.unknown };
  }
}

/* =========================
   Sign Up
========================= */

export const signUpAction = async (
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> => {
  const parsed = signUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    passwordConfirm: formData.get('passwordConfirm'),
    name: formData.get('name'),
    role: formData.get('role'),
    termsAgree: formData.get('termsAgree') === 'on',
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((i) => {
      if (typeof i.path[0] === 'string') {
        fieldErrors[i.path[0]] = i.message;
      }
    });
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? errorMessages.unknown,
      fieldErrors,
    };
  }

  const { passwordConfirm: _, ...payload } = parsed.data;
  void _;

  const env = envStatus();
  if (!env.ok) {
    return { ok: false, message: '환경변수가 올바르지 않습니다.' };
  }

  try {
    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

    /* 1️⃣ Auth 회원가입 (role 전달 ✅) */
    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          name: payload.name,
          role: payload.role, // 트리거가 raw_user_meta_data에서 읽음
        },
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error) {
      if (error.code === 'weak_password') {
        return {
          ok: false,
          message: errorMessages.weakPassword,
          fieldErrors: { password: errorMessages.weakPassword },
        };
      }
      if (
        error.code === 'over_email_send_rate_limit' ||
        error.code === 'over_request_rate_limit'
      ) {
        return { ok: false, message: errorMessages.rateLimited };
      }
      if (
        error.code === 'signup_disabled' ||
        error.code === 'email_provider_disabled'
      ) {
        return { ok: false, message: errorMessages.signupDisabled };
      }
      return { ok: false, message: errorMessages.signUpFailed };
    }

    /* 2️⃣ 중복 이메일 감지 (Supabase는 보안상 에러 대신 빈 identities 반환) */
    if (data.user?.identities?.length === 0) {
      return {
        ok: false,
        message: errorMessages.emailExists,
        fieldErrors: { email: errorMessages.emailExists },
      };
    }

    return {
      ok: true,
      message: successMessages.signUp,
      redirectTo: `/auth/pending?email=${encodeURIComponent(payload.email)}`,
    };
  } catch {
    return { ok: false, message: errorMessages.signUpFailed };
  }
}

/* =========================
   Verify Email OTP
========================= */

export const verifyEmailOtpAction = async (
  email: string,
  token: string
): Promise<ActionResult> => {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
    if (error) return { ok: false, message: '인증 코드가 올바르지 않거나 만료되었습니다.' };
    const isNewUser = await ensureProfile(supabase);
    return { ok: true, message: '', redirectTo: isNewUser ? '/profile?welcome=1' : '/post' };
  } catch {
    return { ok: false, message: errorMessages.unknown };
  }
};

/* =========================
   Resend Verification Email
========================= */

export const resendVerificationAction = async (email: string): Promise<ActionResult> => {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) return { ok: false, message: '재전송에 실패했습니다.' };
    return { ok: true, message: '인증 메일을 다시 보냈습니다.' };
  } catch {
    return { ok: false, message: errorMessages.unknown };
  }
};

/* =========================
   Kakao OAuth
========================= */

export const signInWithKakaoAction = async (): Promise<ActionResult> => {
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    return { ok: false, message: '환경변수가 올바르지 않습니다.' };
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error || !data.url) {
    return {
      ok: false,
      message: '카카오 로그인을 시작할 수 없습니다.',
    };
  }

  return {
    ok: true,
    message: '',
    redirectTo: data.url,
  };
}

/* =========================
   Sign Out
========================= */

export const signOutAction = async () => {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { ok: false, message: errorMessages.signOutFailed };
  }

  return { ok: true, message: successMessages.signOut };
}
