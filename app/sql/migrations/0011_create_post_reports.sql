-- Create enum for report reasons
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_reason') THEN
    CREATE TYPE report_reason AS ENUM (
      'fraud_investment',
      'obscene',
      'child_abuse',
      'hate_violence',
      'illegal_product',
      'privacy_violation',
      'abnormal_usage',
      'scam_impersonation',
      'defamation_copyright',
      'illegal_filming',
      'false_advertisement',
      'spam',
      'other'
    );
  END IF;
END$$;

-- Create enum for report status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
    CREATE TYPE report_status AS ENUM (
      'pending',
      'reviewed',
      'dismissed',
      'resolved'
    );
  END IF;
END$$;

-- Create post_reports table
CREATE TABLE IF NOT EXISTS post_reports (
  report_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  post_id BIGINT NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  reason report_reason NOT NULL,
  detail TEXT,
  status report_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  UNIQUE(post_id, reporter_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_post_reports_post_id ON post_reports(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reports_status ON post_reports(status);
CREATE INDEX IF NOT EXISTS idx_post_reports_created_at ON post_reports(created_at);

-- Enable RLS
ALTER TABLE post_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create their own reports
CREATE POLICY "Users can create reports" ON post_reports
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Policy: Users can view their own reports
CREATE POLICY "Users can view own reports" ON post_reports
  FOR SELECT
  USING (auth.uid() = reporter_id);

-- Policy: Admins can view all reports
CREATE POLICY "Admins can view all reports" ON post_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can update reports
CREATE POLICY "Admins can update reports" ON post_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
