-- auth.users에 유저가 생성되면 자동으로 public.profiles에 레코드 생성하는 트리거

-- 1. 기존 트리거와 함수 삭제 (있다면)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. 트리거 함수 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    email,
    name,
    role,
    is_banned,
    attendance_score,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    'member', -- 기본값
    false,
    50,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- 3. 트리거 생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. 확인
COMMENT ON FUNCTION public.handle_new_user() IS 'auth.users 생성 시 자동으로 public.profiles에 레코드 생성';
