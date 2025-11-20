-- Create new enums for lifecycle and stage statuses
CREATE TYPE case_lifecycle_status AS ENUM ('preparation', 'submitted', 'resolution', 'completed');
CREATE TYPE case_stage_status AS ENUM ('pending', 'in_progress', 'completed', 'blocked');

-- Extend cases with richer contact + lifecycle information
ALTER TABLE cases
  ADD COLUMN contact_name TEXT,
  ADD COLUMN contact_email TEXT,
  ADD COLUMN contact_phone TEXT,
  ADD COLUMN internal_notes TEXT,
  ADD COLUMN lifecycle_status case_lifecycle_status NOT NULL DEFAULT 'preparation';

-- Extend case milestones to behave as intelligent stages
ALTER TABLE case_milestones
  ADD COLUMN status case_stage_status NOT NULL DEFAULT 'pending',
  ADD COLUMN assigned_staff_id TEXT,
  ADD COLUMN required_documents JSONB,
  ADD COLUMN subtasks JSONB,
  ADD COLUMN notes TEXT;

-- Timeline events linked to each case
CREATE TABLE case_events (
  id SERIAL PRIMARY KEY,
  case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT REFERENCES users(id),
  attachments JSONB DEFAULT '[]'::JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX case_events_case_id_idx ON case_events(case_id);
