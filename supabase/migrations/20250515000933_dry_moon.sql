/*
  # Add support for tags, activities, documents and history

  1. New Tables
    - `lead_tags`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `created_at` (timestamptz)
    
    - `lead_activities`
      - `id` (uuid, primary key) 
      - `lead_id` (uuid, references leads)
      - `type` (text, not null)
      - `title` (text, not null)
      - `description` (text)
      - `scheduled_for` (timestamptz)
      - `created_at` (timestamptz)
      - `created_by` (uuid, references auth.users)

    - `lead_documents`
      - `id` (uuid, primary key)
      - `lead_id` (uuid, references leads)
      - `name` (text, not null) 
      - `file_key` (text, not null)
      - `file_size` (bigint)
      - `content_type` (text)
      - `uploaded_at` (timestamptz)
      - `uploaded_by` (uuid, references auth.users)

    - `lead_history`
      - `id` (uuid, primary key)
      - `lead_id` (uuid, references leads)
      - `event_type` (text, not null)
      - `description` (text, not null)
      - `created_at` (timestamptz)
      - `created_by` (uuid, references auth.users)

  2. Changes
    - Add source_id to leads table referencing lead_tags

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users
*/

-- Create lead_tags table
CREATE TABLE IF NOT EXISTS lead_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Create lead_activities table
CREATE TABLE IF NOT EXISTS lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  description text,
  scheduled_for timestamptz,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  CONSTRAINT valid_activity_type CHECK (
    type IN ('follow_up', 'email', 'meeting', 'call', 'task')
  )
);

-- Create lead_documents table
CREATE TABLE IF NOT EXISTS lead_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_key text NOT NULL,
  file_size bigint,
  content_type text,
  uploaded_at timestamptz DEFAULT now(),
  uploaded_by uuid REFERENCES auth.users(id)
);

-- Create lead_history table
CREATE TABLE IF NOT EXISTS lead_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Add source_id to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_id uuid REFERENCES lead_tags(id);

-- Enable RLS
ALTER TABLE lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lead_tags
CREATE POLICY "Enable read access for authenticated users" ON lead_tags
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert access for authenticated users" ON lead_tags
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for lead_activities
CREATE POLICY "Enable all access for authenticated users" ON lead_activities
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

-- RLS Policies for lead_documents
CREATE POLICY "Enable all access for authenticated users" ON lead_documents
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

-- RLS Policies for lead_history
CREATE POLICY "Enable all access for authenticated users" ON lead_history
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);