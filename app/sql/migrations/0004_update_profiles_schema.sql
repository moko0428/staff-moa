-- Update profiles table to match TypeScript schema
-- This migration syncs the database schema with the TypeScript definition

-- 1. Remove NOT NULL constraint from name (if not already done)
ALTER TABLE "public"."profiles" 
ALTER COLUMN "name" DROP NOT NULL;

-- 2. Remove UNIQUE constraint from email (if not already done)
ALTER TABLE "public"."profiles" 
DROP CONSTRAINT IF EXISTS "profiles_email_unique";

-- 3. Remove NOT NULL constraint from recent_photos
-- (TypeScript schema has default but no NOT NULL)
ALTER TABLE "public"."profiles" 
ALTER COLUMN "recent_photos" DROP NOT NULL;
