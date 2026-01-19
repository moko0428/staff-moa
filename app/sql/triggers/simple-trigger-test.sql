-- 단계별 트리거 테스트 (매우 간단한 버전)

-- 기존 트리거 제거
DROP TRIGGER IF EXISTS user_to_profile_trigger ON auth.users;
DROP FUNCTION IF EXISTS public.create_profile_for_new_user();

-- 1단계: 최소한의 트리거 (enum 캐스팅 없이)
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 매우 간단한 버전: 모든 사용자를 member로 생성
  INSERT INTO public.profiles (
    user_id,
    email,
    name,
    role,
    is_banned,
    attendance_score
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', '새로운 사용자'),
    'member',  -- 하드코딩된 값
    false,
    50
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- 에러를 로그에 남기고 회원가입은 계속 진행
    RAISE WARNING 'Profile creation failed for user_id %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

CREATE TRIGGER user_to_profile_trigger
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_new_user();

-- 이 간단한 버전이 작동하면, 점진적으로 role 처리를 추가합니다.
