-- Skip dropping constraints that may not exist
-- ALTER TABLE "profiles" DROP CONSTRAINT "profiles_email_unique";
-- ALTER TABLE "posts" DROP CONSTRAINT "posts_author_id_profiles_id_fk";

-- Profiles table alterations
ALTER TABLE "profiles" ALTER COLUMN "recent_photos" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "name" DROP NOT NULL;--> statement-breakpoint

-- Ensure posts foreign key is correct (will be no-op if already exists with correct name)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'posts_author_id_profiles_user_id_fk'
  ) THEN
    ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_profiles_user_id_fk"
    FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("user_id")
    ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;