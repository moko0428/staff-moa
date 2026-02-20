CREATE TABLE "attendance_reviews" (
	"review_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" bigint NOT NULL,
	"member_id" uuid NOT NULL,
	"reviewed_by" uuid NOT NULL,
	"score" integer NOT NULL,
	"comment" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_reviews_post_member_unique" UNIQUE("post_id","member_id")
);
--> statement-breakpoint
ALTER TABLE "attendance_reviews" ADD CONSTRAINT "attendance_reviews_post_id_posts_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("post_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_reviews" ADD CONSTRAINT "attendance_reviews_member_id_profiles_user_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_reviews" ADD CONSTRAINT "attendance_reviews_reviewed_by_profiles_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;