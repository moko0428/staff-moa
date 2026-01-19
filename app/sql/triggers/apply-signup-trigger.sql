-- 기존 트리거 제거
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS user_to_profile_trigger ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.create_profile_for_new_user();

-- 완성된 트리거 함수 생성
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_company_status text;
BEGIN
  -- role 안전 처리
  v_role := COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'role', ''), 'member');
  IF v_role NOT IN ('member', 'manager', 'pending_manager', 'rejected_manager', 'admin') THEN
    v_role := 'member';
  END IF;

  -- company_verify_status 처리: pending_manager인 경우 자동으로 'pending' 설정
  IF v_role = 'pending_manager' THEN
    v_company_status := 'pending';
  ELSE
    v_company_status := NEW.raw_user_meta_data ->> 'company_verify_status';
    IF v_company_status NOT IN ('pending', 'approved', 'rejected') THEN
      v_company_status := NULL;
    END IF;
  END IF;

  -- email이 없으면 프로필 생성하지 않음
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RAISE WARNING 'User email is empty for user_id: %', NEW.id;
    RETURN NEW;
  END IF;

  -- profiles 테이블에 레코드 생성
  INSERT INTO public.profiles (
    user_id,
    name,
    email,
    role,
    company_verify_status,
    is_banned,
    attendance_score
  ) VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data ->> 'name', ''),
      NULLIF(NEW.raw_user_meta_data ->> 'user_name', ''),
      '새로운 사용자'
    ),
    NEW.email,
    v_role::user_role,
    CASE
      WHEN v_company_status IS NOT NULL
      THEN v_company_status::company_verify_status
      ELSE NULL
    END,
    false,  -- is_banned 기본값
    50      -- attendance_score 기본값
  )
  ON CONFLICT (user_id) DO NOTHING;  -- UPSERT와 충돌 방지

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Profile creation failed for user_id: %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 트리거 생성
CREATE TRIGGER user_to_profile_trigger
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_new_user();

-- 확인 메시지
COMMENT ON FUNCTION public.create_profile_for_new_user() IS 'auth.users 생성 시 raw_user_meta_data의 role을 참조하여 profiles에 레코드 생성';
