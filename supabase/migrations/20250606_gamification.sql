-- Raja Rocket Flow: Gamification Schema
-- Migration: 20250606_gamification

-- Add gamification columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_sessions INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_remixes INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_shares INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_achievements_xp INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS achievements JSONB DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_last_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_freezes_available INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rocket_template_completions JSONB DEFAULT '{}';

-- Index for leaderboards
CREATE INDEX IF NOT EXISTS idx_users_total_xp ON users(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_users_current_streak ON users(current_streak DESC);