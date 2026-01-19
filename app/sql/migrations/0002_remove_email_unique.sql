-- Remove unique constraint from profiles.email
ALTER TABLE "public"."profiles" DROP CONSTRAINT IF EXISTS "profiles_email_unique";
