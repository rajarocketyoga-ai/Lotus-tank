-- Raja Rocket Flow: Sequence Sharing & Remixing Schema
-- Migration: 20250606_sharing

-- 1. Create shared_sequences table
CREATE TABLE IF NOT EXISTS shared_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_id UUID REFERENCES sequences(id) ON DELETE CASCADE,
    shared_by_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL,
    view_count INTEGER DEFAULT 0,
    remix_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Index for slug lookups
CREATE INDEX IF NOT EXISTS idx_shared_sequences_slug ON shared_sequences(slug);
CREATE INDEX IF NOT EXISTS idx_shared_sequences_popular ON shared_sequences(view_count DESC, remix_count DESC);

-- 3. Function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(seq_slug TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE shared_sequences
    SET view_count = view_count + 1
    WHERE slug = seq_slug;
END;
$$ LANGUAGE plpgsql;

-- 4. Function to increment remix count
CREATE OR REPLACE FUNCTION increment_remix_count(seq_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE shared_sequences
    SET remix_count = remix_count + 1
    WHERE sequence_id = seq_id;
END;
$$ LANGUAGE plpgsql;

-- 5. RLS Policies
ALTER TABLE shared_sequences ENABLE ROW LEVEL SECURITY;

-- Anyone can view shared sequences
CREATE POLICY "Shared sequences are viewable by everyone"
    ON shared_sequences FOR SELECT
    USING (true);

-- Authenticated users can share
CREATE POLICY "Authenticated users can share sequences"
    ON shared_sequences FOR INSERT
    WITH CHECK (auth.uid() = shared_by_user_id);

-- Only the creator can delete
CREATE POLICY "Creators can delete their shared sequences"
    ON shared_sequences FOR DELETE
    USING (auth.uid() = shared_by_user_id);
