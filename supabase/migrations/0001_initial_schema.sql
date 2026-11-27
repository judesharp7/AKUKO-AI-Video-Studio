-- AKUKO AI Video Studio - Initial Database Schema
-- 15 tables with indexes and Row-Level Security (RLS)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  plan VARCHAR(50) NOT NULL DEFAULT 'free',
  credit_balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  country VARCHAR(100),
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'story',
  aspect_ratio VARCHAR(10) NOT NULL DEFAULT '16:9',
  target_duration_seconds INTEGER NOT NULL DEFAULT 1800,
  style_bible JSONB,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  current_step VARCHAR(50) NOT NULL DEFAULT 'setup',
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Credit Ledger (append-only)
CREATE TABLE IF NOT EXISTS credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delta DECIMAL(10, 2) NOT NULL,
  reason VARCHAR(50) NOT NULL CHECK (reason IN ('purchase', 'generation', 'refund', 'bonus')),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  provider_cost DECIMAL(10, 4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Assets
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('image', 'video', 'audio', 'subtitle')),
  storage_key VARCHAR(500) NOT NULL,
  public_url TEXT,
  mimetype VARCHAR(100),
  size_bytes BIGINT,
  duration_seconds DECIMAL(6, 2),
  checksum VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Characters
CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  age INTEGER,
  gender VARCHAR(50),
  appearance TEXT,
  clothing TEXT,
  personality TEXT,
  voice_id VARCHAR(255),
  voice_settings JSONB,
  reference_asset_ids UUID[] NOT NULL DEFAULT '{}',
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  consistency_thumbs_up INTEGER NOT NULL DEFAULT 0,
  consistency_total INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Locations
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  reference_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL
);

-- 7. Scripts (versioned)
CREATE TABLE IF NOT EXISTS scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  story_json JSONB,
  script_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Scenes
CREATE TABLE IF NOT EXISTS scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  position DECIMAL(10, 4) NOT NULL,
  duration_seconds DECIMAL(6, 2) NOT NULL DEFAULT 10.0,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  location_name VARCHAR(255),
  character_ids UUID[] NOT NULL DEFAULT '{}',
  action TEXT,
  dialogue TEXT,
  camera VARCHAR(100),
  mood VARCHAR(100),
  visual_prompt TEXT,
  ai_prompt TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  selected_take_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Takes
CREATE TABLE IF NOT EXISTS takes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  provider VARCHAR(100) NOT NULL,
  model_id VARCHAR(100) NOT NULL,
  model_version VARCHAR(50),
  parameters JSONB,
  input_asset_ids UUID[] NOT NULL DEFAULT '{}',
  provider_job_id VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  output_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  billed_cost DECIMAL(10, 4),
  error_class VARCHAR(50),
  error_message TEXT,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE scenes
  ADD CONSTRAINT fk_scenes_selected_take
  FOREIGN KEY (selected_take_id) REFERENCES takes(id) ON DELETE SET NULL;

-- 10. Voice Lines
CREATE TABLE IF NOT EXISTS voice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  voice_settings JSONB,
  audio_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  start_time_seconds DECIMAL(6, 3),
  end_time_seconds DECIMAL(6, 3)
);

-- 11. Timelines (versioned Edit Decision List)
CREATE TABLE IF NOT EXISTS timelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  edit_decision_list JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Subtitles
CREATE TABLE IF NOT EXISTS subtitles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  cues JSONB NOT NULL,
  style_preset VARCHAR(50) NOT NULL DEFAULT 'clean',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Exports (immutable)
CREATE TABLE IF NOT EXISTS exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  timeline_version INTEGER,
  resolution VARCHAR(10) NOT NULL,
  format VARCHAR(10) NOT NULL DEFAULT 'mp4',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  output_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 14. Job Runs
CREATE TABLE IF NOT EXISTS job_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workflow_run_id VARCHAR(255) NOT NULL,
  kind VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

-- 15. Provider Calls
CREATE TABLE IF NOT EXISTS provider_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  take_id UUID REFERENCES takes(id) ON DELETE SET NULL,
  job_run_id UUID REFERENCES job_runs(id) ON DELETE SET NULL,
  provider VARCHAR(100) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  request_id VARCHAR(255),
  charge DECIMAL(10, 4),
  latency_ms INTEGER,
  outcome VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_scenes_project_position ON scenes(project_id, position);
CREATE INDEX IF NOT EXISTS idx_takes_scene ON takes(scene_id);
CREATE INDEX IF NOT EXISTS idx_takes_provider_job ON takes(provider_job_id);
CREATE INDEX IF NOT EXISTS idx_assets_user_type ON assets(user_id, type);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_user ON credit_ledger(user_id, created_at DESC);

-- Enable Row-Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE takes ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtitles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_runs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users manage own projects" ON projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view own ledger" ON credit_ledger FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own assets" ON assets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own characters" ON characters FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage project locations" ON locations FOR ALL
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = locations.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users manage project scripts" ON scripts FOR ALL
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = scripts.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users manage project scenes" ON scenes FOR ALL
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = scenes.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users manage scene takes" ON takes FOR ALL
  USING (EXISTS (SELECT 1 FROM scenes JOIN projects ON projects.id = scenes.project_id WHERE scenes.id = takes.scene_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users manage voice lines" ON voice_lines FOR ALL
  USING (EXISTS (SELECT 1 FROM scenes JOIN projects ON projects.id = scenes.project_id WHERE scenes.id = voice_lines.scene_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users manage project timelines" ON timelines FOR ALL
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = timelines.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users manage project subtitles" ON subtitles FOR ALL
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = subtitles.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users manage project exports" ON exports FOR ALL
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = exports.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users view project job runs" ON job_runs FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = job_runs.project_id AND projects.user_id = auth.uid()));

