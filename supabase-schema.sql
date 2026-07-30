-- Run this in your Supabase SQL Editor to set up the database

-- Raids table
CREATE TABLE IF NOT EXISTS raids (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  tank_limit INTEGER NOT NULL DEFAULT 3,
  healer_limit INTEGER NOT NULL DEFAULT 5,
  melee_limit INTEGER NOT NULL DEFAULT 8,
  range_limit INTEGER NOT NULL DEFAULT 9,
  created_by TEXT NOT NULL,
  created_by_name TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Signups table
CREATE TABLE IF NOT EXISTS signups (
  id BIGSERIAL PRIMARY KEY,
  raid_id BIGINT NOT NULL REFERENCES raids(id) ON DELETE CASCADE,
  discord_id TEXT NOT NULL,
  discord_name TEXT DEFAULT '',
  character_name TEXT NOT NULL,
  class TEXT NOT NULL,
  spec TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('tank', 'healer', 'melee', 'range')),
  signed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(raid_id, discord_id)
);

-- Managers table
CREATE TABLE IF NOT EXISTS managers (
  discord_id TEXT PRIMARY KEY,
  added_by TEXT DEFAULT '',
  added_by_name TEXT DEFAULT ''
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_signups_raid_id ON signups(raid_id);
CREATE INDEX IF NOT EXISTS idx_signups_discord_id ON signups(discord_id);
CREATE INDEX IF NOT EXISTS idx_raids_status ON raids(status);

-- Row Level Security
ALTER TABLE raids ENABLE ROW LEVEL SECURITY;
ALTER TABLE signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE managers ENABLE ROW LEVEL SECURITY;

-- Policies (drop first to avoid errors on re-run)
DROP POLICY IF EXISTS "Anyone can read raids" ON raids;
CREATE POLICY "Anyone can read raids" ON raids FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read signups" ON signups;
CREATE POLICY "Anyone can read signups" ON signups FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read managers" ON managers;
CREATE POLICY "Anyone can read managers" ON managers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert raids" ON raids;
CREATE POLICY "Anyone can insert raids" ON raids FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert signups" ON signups;
CREATE POLICY "Anyone can insert signups" ON signups FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert managers" ON managers;
CREATE POLICY "Anyone can insert managers" ON managers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete signups" ON signups;
CREATE POLICY "Anyone can delete signups" ON signups FOR DELETE USING (true);

DROP POLICY IF EXISTS "Anyone can delete managers" ON managers;
CREATE POLICY "Anyone can delete managers" ON managers FOR DELETE USING (true);

DROP POLICY IF EXISTS "Anyone can update raids" ON raids;
CREATE POLICY "Anyone can update raids" ON raids FOR UPDATE USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE raids;
ALTER PUBLICATION supabase_realtime ADD TABLE signups;
