-- profile_visibility JSONB에서 mbti, heightWeight, personalityFeatures 키 제거
UPDATE profiles
SET profile_visibility = profile_visibility #- '{mbti}' #- '{heightWeight}' #- '{personalityFeatures}'
WHERE profile_visibility IS NOT NULL;

-- 컬럼 기본값 업데이트
ALTER TABLE "profiles"
  ALTER COLUMN "profile_visibility"
  SET DEFAULT '{"email":true,"phone":true,"kakaoId":true,"age":true,"gender":true,"experiences":true,"documents":true,"certificates":true,"languages":true}'::jsonb;
