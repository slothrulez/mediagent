/*
  # Create MediTech EMR Database Schema

  1. New Tables
    - `users` - Medical professionals using the system
    - `patients` - Patient records with medical information
    - `audio_recordings` - Audio files uploaded/recorded for processing
    - `transcriptions` - Speech-to-text results with translations
    - `medical_reports` - AI-extracted medical data and treatment suggestions

  2. Security
    - Enable RLS on all tables
    - Add policies for user data isolation
    - Ensure HIPAA compliance through proper access controls

  3. Performance
    - Add indexes for common query patterns
    - Automatic timestamp updates via triggers
*/

-- Create updated_at trigger function first
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text,
  role text DEFAULT 'doctor' CHECK (role IN ('doctor', 'nurse', 'admin')),
  license_number text,
  specialty text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date,
  gender text CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
  phone text,
  email text,
  address text,
  emergency_contact text,
  emergency_phone text,
  blood_type text,
  allergies jsonb DEFAULT '[]'::jsonb,
  medications jsonb DEFAULT '[]'::jsonb,
  medical_history jsonb DEFAULT '[]'::jsonb,
  insurance_provider text,
  insurance_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create audio_recordings table
CREATE TABLE IF NOT EXISTS audio_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  file_path text,
  file_size bigint,
  duration integer, -- in seconds
  format text,
  language text DEFAULT 'auto',
  status text DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'completed', 'failed')),
  created_at timestamptz DEFAULT now()
);

-- Create transcriptions table
CREATE TABLE IF NOT EXISTS transcriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id uuid REFERENCES audio_recordings(id) ON DELETE CASCADE,
  original_text text,
  translated_text text,
  source_language text,
  target_language text DEFAULT 'en',
  confidence_score decimal(5,4) DEFAULT 0.0,
  processing_time integer, -- in milliseconds
  created_at timestamptz DEFAULT now()
);

-- Create medical_reports table
CREATE TABLE IF NOT EXISTS medical_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  transcription_id uuid REFERENCES transcriptions(id) ON DELETE CASCADE,
  extracted_data jsonb DEFAULT '{}'::jsonb,
  treatment_suggestions jsonb DEFAULT '[]'::jsonb,
  confidence_score decimal(5,4) DEFAULT 0.0,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'reviewed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_audio_recordings_user_id ON audio_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_recordings_patient_id ON audio_recordings(patient_id);
CREATE INDEX IF NOT EXISTS idx_audio_recordings_status ON audio_recordings(status);
CREATE INDEX IF NOT EXISTS idx_transcriptions_recording_id ON transcriptions(recording_id);
CREATE INDEX IF NOT EXISTS idx_medical_reports_user_id ON medical_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_reports_patient_id ON medical_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_reports_status ON medical_reports(status);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Users can read and update their own data
CREATE POLICY "meditech_users_read_own" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "meditech_users_update_own" ON users
  FOR UPDATE USING (id = auth.uid());

-- Users can manage their own patients
CREATE POLICY "meditech_patients_manage_own" ON patients
  FOR ALL USING (user_id = auth.uid());

-- Users can manage their own audio recordings
CREATE POLICY "meditech_recordings_manage_own" ON audio_recordings
  FOR ALL USING (user_id = auth.uid());

-- Users can access transcriptions for their recordings
CREATE POLICY "meditech_transcriptions_access_own" ON transcriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM audio_recordings 
      WHERE audio_recordings.id = transcriptions.recording_id 
      AND audio_recordings.user_id = auth.uid()
    )
  );

-- Users can manage their own medical reports
CREATE POLICY "meditech_reports_manage_own" ON medical_reports
  FOR ALL USING (user_id = auth.uid());

-- Create triggers for updated_at (only after tables exist)
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_reports_updated_at
  BEFORE UPDATE ON medical_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();