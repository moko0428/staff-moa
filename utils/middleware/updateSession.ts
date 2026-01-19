import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'

type UserWithRole = User & {
  role?: string;
  company_verify_status?: string;
}

export async function updateSession(
  request: NextRequest
): Promise<[NextResponse, UserWithRole | null]> {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data } = await supabase.auth.getUser()
  const user = data?.user

  // user가 있으면 profiles 테이블에서 role 조회
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, company_verify_status')
      .eq('user_id', user.id)
      .single()

    // user 객체에 profile 정보 추가
    if (profile) {
      return [supabaseResponse, { ...user, role: profile.role, company_verify_status: profile.company_verify_status }]
    }
  }

  return [supabaseResponse, user ?? null]
}
