ALTER TABLE "profiles" ALTER COLUMN "attendance_score" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "trust_activity_score" integer DEFAULT 0 NOT NULL;