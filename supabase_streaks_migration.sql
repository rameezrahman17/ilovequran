-- 1. Create the streaks table if it doesn't exist
CREATE TABLE IF NOT EXISTS streaks (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_type TEXT DEFAULT 'time', -- 'time', 'quran_30_days', 'custom'
    goal_value INTEGER DEFAULT 10,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    daily_progress_minutes INTEGER DEFAULT 0,
    daily_progress_verses INTEGER DEFAULT 0,
    total_verses_read INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

-- 3. Safely create policies (Drops them first if they exist to avoid the "Already Exists" error)
DROP POLICY IF EXISTS "Users can view their own streak" ON streaks;
DROP POLICY IF EXISTS "Users can update their own streak" ON streaks;
DROP POLICY IF EXISTS "Users can insert their own streak" ON streaks;

-- 4. Apply clean policies
CREATE POLICY "Users can view their own streak" ON streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own streak" ON streaks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own streak" ON streaks FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Grant Permissions
GRANT ALL ON streaks TO authenticated;
GRANT ALL ON streaks TO service_role;
