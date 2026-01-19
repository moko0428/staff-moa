-- 기존 트리거 제거
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 수정된 트리거 함수 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- profiles 테이블의 실제 컬럼에 맞춰 INSERT
  INSERT INTO public.profiles (
    user_id,
    email,
    name,
    role,
    is_banned,
    attendance_score
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    'member',
    false,
    50
  )
  -- 중복 시 아무것도 하지 않음 (UPSERT가 처리)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 트리거 생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'auth.users 생성 시 자동으로 public.profiles에 레코드 생성 (ON CONFLICT DO NOTHING)';
