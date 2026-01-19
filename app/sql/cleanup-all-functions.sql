-- 모든 기존 함수 완전 제거
-- Supabase Dashboard > SQL Editor에서 실행하세요

-- 1. 알려진 모든 트리거 제거
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS user_to_profile_trigger ON auth.users CASCADE;

-- 2. 모든 함수 제거 (CASCADE로 의존성까지)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_for_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_profile() CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_profile_sync() CASCADE;

-- 3. 확인용 쿼리
-- 실행 후 아래 쿼리로 확인하세요:

-- 트리거 확인 (비어있어야 함)
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth';

-- 함수 확인 (비어있어야 함)
SELECT proname
FROM pg_proc
WHERE proname LIKE '%user%'
  AND proname LIKE '%profile%';
