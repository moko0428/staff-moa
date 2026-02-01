CREATE TABLE IF NOT EXISTS "favorites_keywords" (
	"user_id" uuid NOT NULL,
	"keyword" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "favorites_keywords_user_id_keyword_pk" PRIMARY KEY("user_id","keyword")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "manager_follows" (
	"follower_id" uuid NOT NULL,
	"manager_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "manager_follows_follower_id_manager_id_pk" PRIMARY KEY("follower_id","manager_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favorites_keywords" ADD CONSTRAINT "favorites_keywords_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "manager_follows" ADD CONSTRAINT "manager_follows_follower_id_profiles_user_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "manager_follows" ADD CONSTRAINT "manager_follows_manager_id_profiles_user_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

