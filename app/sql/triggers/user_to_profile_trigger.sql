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

  -- company_verify_status 안전 처리
  v_company_status := NEW.raw_user_meta_data ->> 'company_verify_status';
  IF v_company_status NOT IN ('pending', 'approved', 'rejected') THEN
    v_company_status := NULL;
  END IF;

  -- email이 없으면 프로필 생성하지 않음
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RAISE WARNING 'User email is empty for user_id: %', NEW.id;
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (
    user_id,
    name,
    email,
    role,
    company_verify_status
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
    END
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Profile creation failed for user_id: %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_to_profile_trigger ON auth.users;

CREATE TRIGGER user_to_profile_trigger
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_new_user();
