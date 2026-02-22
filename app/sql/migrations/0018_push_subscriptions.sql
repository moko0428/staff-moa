CREATE TABLE IF NOT EXISTS "push_subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "profiles"("user_id") ON DELETE CASCADE,
  "endpoint" text NOT NULL UNIQUE,
  "auth" text NOT NULL,
  "p256dh" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
