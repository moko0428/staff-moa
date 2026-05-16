-- Backfill attendance_score for existing users based on new trust score system
-- profileScore: 50 if all 7 required fields filled, otherwise 0
-- activityScore: trust_activity_score (0 for all existing users at this point)
UPDATE "profiles"
SET "attendance_score" = (
  CASE
    WHEN (
      "name"       IS NOT NULL AND "name"       != '' AND
      "phone"      IS NOT NULL AND "phone"      != '' AND
      "kakao_id"   IS NOT NULL AND "kakao_id"   != '' AND
      "birth_date" IS NOT NULL AND
      "gender"     IS NOT NULL AND
      "bio"        IS NOT NULL AND "bio"        != '' AND
      "avatar"     IS NOT NULL AND "avatar"     != ''
    ) THEN 50
    ELSE 0
  END
) + COALESCE("trust_activity_score", 0);
