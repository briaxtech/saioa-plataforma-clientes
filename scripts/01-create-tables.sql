-- Create enum types
CREATE TYPE case_status AS ENUM ('pending', 'in_progress', 'under_review', 'approved', 'rejected', 'completed');
CREATE TYPE case_type AS ENUM ('family', 'employment', 'asylum', 'citizenship', 'visa', 'green_card', 'other');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE document_status AS ENUM ('pending', 'submitted', 'approved', 'rejected', 'requires_action');
CREATE TYPE user_role AS ENUM ('admin', 'staff', 'client');
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');

-- Users table (extends neon_auth.users_sync)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'client',
  phone TEXT,
  address TEXT,
  date_of_birth DATE,
  country_of_origin TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients table (additional client information)
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  user_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  case_count INTEGER DEFAULT 0,
  assigned_staff_id TEXT REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Case type templates for configurable workflows
CREATE TABLE IF NOT EXISTS case_type_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  states JSONB DEFAULT '[]'::jsonb,
  timeframe TEXT,
  base_case_type case_type DEFAULT 'other',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cases table
CREATE TABLE IF NOT EXISTS cases (
  id SERIAL PRIMARY KEY,
  case_number TEXT UNIQUE NOT NULL,
  client_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  assigned_staff_id TEXT REFERENCES users(id),
  case_type case_type NOT NULL,
  status case_status NOT NULL DEFAULT 'pending',
  priority priority_level NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT,
  filing_date DATE,
  deadline_date DATE,
  completion_date DATE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  google_drive_folder_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Case timeline/milestones
CREATE TABLE IF NOT EXISTS case_milestones (
  id SERIAL PRIMARY KEY,
  case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
  uploaded_by TEXT REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  status document_status NOT NULL DEFAULT 'pending',
  google_drive_file_id TEXT,
  is_required BOOLEAN DEFAULT FALSE,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
  sender_id TEXT REFERENCES users(id),
  receiver_id TEXT REFERENCES users(id),
  subject TEXT,
  content TEXT NOT NULL,
  status message_status DEFAULT 'sent',
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT,
  related_case_id INTEGER REFERENCES cases(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity log table
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  case_id INTEGER REFERENCES cases(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cases_client_id ON cases(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_staff_id ON cases(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON documents(case_id);
CREATE INDEX IF NOT EXISTS idx_messages_case_id ON messages(case_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_case_id ON activity_logs(case_id);
