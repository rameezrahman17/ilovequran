-- Bookmarks Table Migration (Safe to re-run)
-- Run this in your Supabase SQL Editor!

CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  surah_number INTEGER NOT NULL,
  ayah_number INTEGER NOT NULL,
  surah_name TEXT,
  ayah_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, surah_number, ayah_number)
);

-- Enable Row Level Security (RLS)
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before re-creating (safe to re-run)
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can insert their own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON bookmarks;

-- Policy: Users can only see their own bookmarks
CREATE POLICY "Users can view their own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own bookmarks
CREATE POLICY "Users can insert their own bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own bookmarks
CREATE POLICY "Users can delete their own bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- Grant privileges for authenticated users
GRANT ALL ON bookmarks TO authenticated;
GRANT ALL ON bookmarks TO service_role;
