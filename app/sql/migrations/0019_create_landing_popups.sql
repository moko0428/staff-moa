-- Create landing_popups table for admin-managed popups shown on the landing page
CREATE TABLE IF NOT EXISTS "landing_popups" (
  "popup_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "content" text NOT NULL,
  "image_url" text,
  "link_url" text,
  "link_text" text,
  "is_active" boolean NOT NULL DEFAULT false,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE "landing_popups" ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can read active popups for the landing page
CREATE POLICY "Anyone can read landing popups" ON "landing_popups"
  FOR SELECT
  USING (true);

-- Only service role can insert/update/delete (admin actions use service role client)
