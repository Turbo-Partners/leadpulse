/*
  # Create scraping usage tracking table

  1. New Tables
    - `scraping_usage`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `month` (date)
      - `count` (integer)

  2. Security
    - Enable RLS on `scraping_usage` table
    - Add policies for authenticated users to read/write their own data
*/

CREATE TABLE IF NOT EXISTS scraping_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  month date NOT NULL,
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month)
);

ALTER TABLE scraping_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own usage"
  ON scraping_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage"
  ON scraping_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage"
  ON scraping_usage
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);