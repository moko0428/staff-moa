-- Create app_reviews table for storing user reviews about the app
CREATE TABLE IF NOT EXISTS "app_reviews" (
  "review_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "profiles"("profile_id") ON DELETE CASCADE,
  "rating" integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  "content" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS "app_reviews_user_id_idx" ON "app_reviews" ("user_id");

-- Add unique constraint to allow only one review per user
CREATE UNIQUE INDEX IF NOT EXISTS "app_reviews_user_id_unique" ON "app_reviews" ("user_id");

-- Enable RLS
ALTER TABLE "app_reviews" ENABLE ROW LEVEL SECURITY;

-- Allow users to read all reviews (for average calculation)
CREATE POLICY "Anyone can read app reviews" ON "app_reviews"
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert their own review
CREATE POLICY "Users can insert their own review" ON "app_reviews"
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own review
CREATE POLICY "Users can update their own review" ON "app_reviews"
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to delete their own review
CREATE POLICY "Users can delete their own review" ON "app_reviews"
  FOR DELETE
  USING (auth.uid() = user_id);
