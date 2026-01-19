-- Remove NOT NULL constraint from profiles.name
ALTER TABLE "public"."profiles" 
ALTER COLUMN "name" DROP NOT NULL;
