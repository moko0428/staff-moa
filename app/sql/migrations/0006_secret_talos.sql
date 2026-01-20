CREATE TABLE "manager_worker_management" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"manager_id" uuid NOT NULL,
	"worker_id" uuid NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"is_blacklisted" boolean DEFAULT false NOT NULL,
	"rating" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "manager_worker_management" ADD CONSTRAINT "manager_worker_management_manager_id_profiles_user_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_worker_management" ADD CONSTRAINT "manager_worker_management_worker_id_profiles_user_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;