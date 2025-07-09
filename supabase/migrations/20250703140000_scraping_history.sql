/*
  # Sistema de Histórico de Scraping

  1. New Tables
    - `scraping_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `business_type` (text, not null)
      - `state` (text, not null)
      - `city` (text, not null)
      - `neighborhood` (text)
      - `limit_requested` (integer, not null)
      - `results_count` (integer, not null)
      - `status` (text, not null) - 'completed', 'failed', 'partial'
      - `error_message` (text)
      - `created_at` (timestamptz)
      - `completed_at` (timestamptz)

  2. Changes to existing tables
    - Add `session_id` to scrapping_leads table to link results to sessions

  3. Security
    - Enable RLS on scraping_sessions table
    - Add policies for authenticated users to manage their own sessions
    - Update scrapping_leads policies to include session-based access
*/

-- Create scraping_sessions table
CREATE TABLE IF NOT EXISTS scraping_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  business_type text NOT NULL,
  state text NOT NULL,
  city text NOT NULL,
  neighborhood text,
  limit_requested integer NOT NULL,
  results_count integer NOT NULL DEFAULT 0,
  status text NOT NULL CHECK (status IN ('completed', 'failed', 'partial')) DEFAULT 'completed',
  error_message text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz DEFAULT now()
);

-- Add session_id to scrapping_leads table
ALTER TABLE scrapping_leads 
ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES scraping_sessions(id) ON DELETE CASCADE;

-- Enable RLS on scraping_sessions
ALTER TABLE scraping_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scraping_sessions
CREATE POLICY "Users can read own scraping sessions"
  ON scraping_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scraping sessions"
  ON scraping_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scraping sessions"
  ON scraping_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scraping sessions"
  ON scraping_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Update scrapping_leads policies to include session-based access
DROP POLICY IF EXISTS "Users can read own scrapping leads" ON scrapping_leads;
DROP POLICY IF EXISTS "Users can insert own scrapping leads" ON scrapping_leads;

CREATE POLICY "Users can read own scrapping leads"
  ON scrapping_leads
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM scraping_sessions 
      WHERE scraping_sessions.id = scrapping_leads.session_id 
      AND scraping_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own scrapping leads"
  ON scrapping_leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    (
      session_id IS NULL OR
      EXISTS (
        SELECT 1 FROM scraping_sessions 
        WHERE scraping_sessions.id = scrapping_leads.session_id 
        AND scraping_sessions.user_id = auth.uid()
      )
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scraping_sessions_user_id ON scraping_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_scraping_sessions_created_at ON scraping_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scrapping_leads_session_id ON scrapping_leads(session_id); 