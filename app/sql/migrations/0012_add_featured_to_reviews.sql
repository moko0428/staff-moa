-- Add is_featured column to app_reviews table
ALTER TABLE app_reviews ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE NOT NULL;

-- Create index for faster featured reviews lookup
CREATE INDEX IF NOT EXISTS idx_app_reviews_is_featured ON app_reviews(is_featured) WHERE is_featured = TRUE;
