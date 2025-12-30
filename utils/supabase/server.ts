import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type CookieStore = Awaited<ReturnType<typeof cookies>>;

export const createClient = async (): Promise<SupabaseClient> => {
  const cookieStore = (await cookies()) as unknown as CookieStore;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = createServerClient<any>(SUPABASE_URL!, SUPABASE_KEY!, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set(name, value, options) {
        try {
          cookieStore.set(name, value, options);
        } catch {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing sessions.
        }
      },
      remove(name, options) {
        try {
          cookieStore.set(name, '', { ...options, maxAge: 0 });
        } catch {
          // Ignore when not supported (e.g., Server Components).
        }
      },
    },
  });

  return client as unknown as SupabaseClient;
};
