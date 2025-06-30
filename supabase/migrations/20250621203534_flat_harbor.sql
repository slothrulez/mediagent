/*
  # Create workflow automation schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `created_at` (timestamp)
    - `workflows`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `title` (text)
      - `prompt_text` (text)
      - `agent_config` (jsonb)
      - `n8n_json` (jsonb)
      - `status` (text with check constraint)
      - `last_run` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `audit_logs`
      - `id` (uuid, primary key)
      - `workflow_id` (uuid, foreign key to workflows)
      - `timestamp` (timestamp)
      - `output` (jsonb)
      - `success` (boolean)
      - `message` (text)

  2. Security
    - Enable RLS on all tables
    - Add policies for user-scoped access
    - Create indexes for performance

  3. Triggers
    - Auto-update `updated_at` column on workflows
*/

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create workflows table
CREATE TABLE IF NOT EXISTS workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  prompt_text text NOT NULL,
  agent_config jsonb DEFAULT '{}'::jsonb,
  n8n_json jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'draft'::text,
  last_run timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT workflows_status_check CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'paused'::text, 'error'::text]))
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE,
  timestamp timestamptz DEFAULT now(),
  output jsonb DEFAULT '{}'::jsonb,
  success boolean DEFAULT false,
  message text NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for users (users can only see their own data)
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Create policies for workflows
CREATE POLICY "Users can manage their own workflows"
  ON workflows
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create policies for audit_logs
CREATE POLICY "Users can access audit logs for their workflows"
  ON audit_logs
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM workflows 
    WHERE workflows.id = audit_logs.workflow_id 
    AND workflows.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM workflows 
    WHERE workflows.id = audit_logs.workflow_id 
    AND workflows.user_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_created_at ON workflows(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_workflow_id ON audit_logs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for workflows updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_workflows_updated_at'
  ) THEN
    CREATE TRIGGER update_workflows_updated_at
      BEFORE UPDATE ON workflows
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;