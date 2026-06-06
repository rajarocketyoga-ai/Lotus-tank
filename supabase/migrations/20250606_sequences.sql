-- Raja Rocket Flow: Cloud Sequence Storage Schema
-- Migration: 20250606_sequences

-- 1. Create sequences table
CREATE TABLE IF NOT EXISTS sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES sequences(id) ON DELETE SET NULL,
    experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
    active_filters JSONB DEFAULT '[]',
    rocket_sequence INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create sequence_poses junction table
CREATE TABLE IF NOT EXISTS sequence_poses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_id UUID REFERENCES sequences(id) ON DELETE CASCADE,
    pose_english_name TEXT NOT NULL,
    pose_sanskrit_name TEXT,
    order_index INTEGER NOT NULL,
    duration_breaths INTEGER DEFAULT 5,
    notes TEXT,
    UNIQUE (sequence_id, order_index)
);

-- 3. Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_sequences_user_id ON sequences(user_id);
CREATE INDEX IF NOT EXISTS idx_sequences_public ON sequences(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_sequence_poses_sequence_id ON sequence_poses(sequence_id);
CREATE INDEX IF NOT EXISTS idx_sequence_poses_order ON sequence_poses(sequence_id, order_index);

-- 4. Function to update updated_at on sequence changes
CREATE OR REPLACE FUNCTION update_sequence_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger to auto-update timestamps
DROP TRIGGER IF EXISTS sequence_updated_at ON sequences;
CREATE TRIGGER sequence_updated_at
    BEFORE UPDATE ON sequences
    FOR EACH ROW
    EXECUTE FUNCTION update_sequence_timestamp();
