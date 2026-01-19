-- 기존 트리거 제거
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS user_to_profile_trigger ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.create_profile_for_new_user();

-- 안전한 트리거 (enum 캐스팅 없이 직접 값 사용)
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
  -- role 처리
  v_role := NEW.raw_user_meta_data->>'role';

  -- role 유효성 검사 및 기본값
  IF v_role IS NULL OR v_role = '' OR v_role NOT IN ('member', 'manager', 'pending_manager', 'rejected_manager', 'admin') THEN
    v_role := 'member';
  END IF;

  -- company_verify_status 처리
  IF v_role = 'pending_manager' THEN
    v_company_status := 'pending';
  ELSE
    v_company_status := NULL;
  END IF;

  -- profiles 테이블에 레코드 생성 (enum 캐스팅 없이)
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
    COALESCE(NEW.raw_user_meta_data->>'name', '새로운 사용자'),
    NEW.email,
    v_role,  -- 직접 text 값 사용 (PostgreSQL이 자동 변환)
    v_company_status,  -- 직접 text 값 사용
    false,
    50
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- 에러 로그만 남기고 트랜잭션은 계속 진행
    RAISE WARNING 'Profile creation failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

CREATE TRIGGER user_to_profile_trigger
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_new_user();

COMMENT ON FUNCTION public.create_profile_for_new_user() IS 'Auth users 생성 시 profiles 자동 생성 (안전한 버전)';
