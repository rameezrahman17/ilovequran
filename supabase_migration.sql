-- Supabase Migration Script for Contact Submissions
-- Run this in your Supabase SQL Editor

-- Create the contact_submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  contact TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_created_at ON contact_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email ON contact_submissions(email);

-- Add comment to table
COMMENT ON TABLE contact_submissions IS 'Stores contact form submissions from the I Love Quran website';

-- Verify table creation
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'contact_submissions'
ORDER BY 
    ordinal_position;
