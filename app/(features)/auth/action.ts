'use server';

import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';
import { errorMessages, successMessages } from './messages';
import { notifyAdminsNewUserAction } from '@/app/(features)/(protected)/notification/actions';

type ActionResult = {
  ok: boolean;
  message: string;
  redirectTo?: string;
  fieldErrors?: Record<string, string>;
  debug?: {
    supabaseUrl?: string;
    supabaseKeyPreview?: string;
    supabaseErrorCode?: string;
    supabaseErrorMessage?: string;
    siteUrl?: string;
  };
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
    role: z
      .string()
      .refine(
        (v) => v === 'member' || v === 'pending_manager',
        '가입 유형을 선택해주세요.'
      ) as z.ZodType<'member' | 'pending_manager'>,
    termsAgree: z.literal(true),
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

export async function signInAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
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
    return {
      ok: false,
      message: '환경변수가 올바르지 않습니다.',
      debug: env,
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);

    if (error) {
      if (
        error.code === 'email_not_confirmed' ||
        error.message.toLowerCase().includes('not confirmed')
      ) {
        return { ok: false, message: errorMessages.emailNotConfirmed };
      }
      return { ok: false, message: errorMessages.invalidCredentials };
    }

    return {
      ok: true,
      message: successMessages.signIn,
      redirectTo: '/post',
    };
  } catch {
    return { ok: false, message: errorMessages.unknown };
  }
}

/* =========================
   Sign Up
========================= */

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
    return {
      ok: false,
      message: '환경변수가 올바르지 않습니다.',
      debug: env,
    };
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
      return {
        ok: false,
        message: errorMessages.signUpFailed,
        debug: {
          supabaseErrorCode: error.code,
          supabaseErrorMessage: error.message,
        },
      };
    }

    /* 2️⃣ profiles 레코드 생성 또는 업데이트 (트리거 없이도 작동) */
    const userId = data.user?.id;

    if (userId) {
      // UPSERT: 트리거가 이미 생성했다면 UPDATE, 없다면 INSERT
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          email: payload.email,
          name: payload.name,
          role: payload.role,
          company_verify_status:
            payload.role === 'pending_manager' ? 'pending' : null,
          is_banned: false,
          attendance_score: 50,
        }, {
          onConflict: 'user_id',
        });

      if (profileError) {
        console.error(
          '[signUpAction] profile upsert failed',
          profileError
        );
        // 회원가입 자체는 성공 → throw 하지 않음
      }

      // 어드민에게 신규 가입 알림 발송 (fire-and-forget)
      notifyAdminsNewUserAction({
        userName: payload.name,
        userRole: payload.role,
      }).catch((err) => console.error('[signUpAction] Admin notification error', err));
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

/* =========================
   Kakao OAuth
========================= */

export async function signInWithKakaoAction(): Promise<ActionResult> {
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

export async function signOutAction() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { ok: false, message: errorMessages.signOutFailed };
  }

  return { ok: true, message: successMessages.signOut };
}
