CREATE TABLE "posts" (
	"post_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "posts_post_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"title" text NOT NULL,
	"description" text NOT NULL,
	"work_date" date NOT NULL,
	"work_time_start" time NOT NULL,
	"work_time_end" time NOT NULL,
	"location" text NOT NULL,
	"pay_amount" numeric NOT NULL,
	"pay_type" "pay_type" DEFAULT 'hourly' NOT NULL,
	"recruit_count" integer NOT NULL,
	"manager_name" text NOT NULL,
	"manager_phone" text NOT NULL,
	"equipments" text,
	"qualifications" text,
	"preferences" text,
	"notes" text,
	"external_link" text,
	"keywords" text[] DEFAULT '{}',
	"author_id" uuid NOT NULL,
	"status" "post_status" DEFAULT 'recruiting' NOT NULL,
	"form_type" text DEFAULT 'basic',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"tax_withholding" boolean DEFAULT false NOT NULL,
	"work_slots" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_profiles_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;