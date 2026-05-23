ALTER TABLE "profiles" ADD COLUMN "position" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "manager_type" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "founded_year" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "specialties" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "activity_regions" jsonb DEFAULT '[]'::jsonb;