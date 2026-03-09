-- ====================================================
-- Keyword Mappings Table Migration
-- Run this in your Supabase SQL Editor
-- ====================================================

CREATE TABLE IF NOT EXISTS keyword_mappings (
  id SERIAL PRIMARY KEY,
  keyword TEXT NOT NULL,
  reference TEXT NOT NULL,  -- e.g. '2:255', '36', '2:285-286'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(keyword)
);

-- Enable Row Level Security (read-only for everyone)
ALTER TABLE keyword_mappings ENABLE ROW LEVEL SECURITY;

-- Anyone can read the mappings (no login required)
DROP POLICY IF EXISTS "Public can read keyword mappings" ON keyword_mappings;
CREATE POLICY "Public can read keyword mappings"
  ON keyword_mappings FOR SELECT
  USING (true);

-- Only service role can insert/update/delete
GRANT SELECT ON keyword_mappings TO anon;
GRANT SELECT ON keyword_mappings TO authenticated;
GRANT ALL ON keyword_mappings TO service_role;

-- ====================================================
-- Insert All Keyword Mappings
-- ====================================================
INSERT INTO keyword_mappings (keyword, reference) VALUES
  -- Famous Verses
  ('ayatul kursi', '2:255'),
  ('kursi', '2:255'),
  ('throne verse', '2:255'),
  ('last 2 ayat baqarah', '2:285'),
  ('amanar rasool', '2:285'),
  ('fasting verse', '2:183'),
  ('ramadan verse', '2:185'),
  ('shahada verse', '3:18'),
  ('3 quls', '112'),
  ('kul huwa allahu ahad', '112:1'),

  -- Surah Popular Names
  ('surah yaseen', '36'),
  ('yaseen', '36'),
  ('surah rahman', '55'),
  ('ar rahman', '55'),
  ('surah mulk', '67'),
  ('tabarak', '67'),
  ('surah kahf', '18'),
  ('surah ikhlas', '112'),
  ('surah falaq', '113'),
  ('surah nas', '114'),
  ('surah baqarah', '2'),
  ('surah fatiha', '1'),
  ('ummul kitab', '1'),
  ('seven oft repeated', '1'),

  -- Protection & Dua
  ('protection verse', '2:255'),
  ('ruqyah verse', '2:255'),
  ('evil eye verse', '113'),
  ('hasbunallahu', '3:173'),
  ('tawakkul verse', '65:3'),
  ('dua for forgiveness', '39:53'),
  ('mercy verse', '39:53'),
  ('la tahzan', '9:40'),
  ('sabr verse', '2:153'),
  ('patience verse', '2:153'),
  ('hardship ease', '94:5'),

  -- Topic Based
  ('jihad verse', '22:39'),
  ('hijab verse', '24:31'),
  ('marriage verse', '30:21'),
  ('interest riba', '2:275'),
  ('justice verse', '4:135'),
  ('parents respect', '17:23'),
  ('zina verse', '17:32'),
  ('backbiting verse', '49:12'),
  ('equality verse', '49:13'),
  ('trust amanah', '4:58'),

  -- Emotional Searches
  ('depression verse', '13:28'),
  ('anxiety verse', '94:5'),
  ('hope verse', '39:53'),
  ('sadness verse', '9:40'),
  ('gratitude verse', '14:7'),
  ('guidance verse', '1:6'),
  ('light verse', '24:35')

ON CONFLICT (keyword) DO UPDATE SET reference = EXCLUDED.reference;

-- Verify
SELECT COUNT(*) AS total_mappings FROM keyword_mappings;
