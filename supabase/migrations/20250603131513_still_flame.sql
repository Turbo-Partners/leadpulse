/*
  # Add scraping limits tracking

  1. New Tables
    - `scraping_usage`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `month` (date, not null)
      - `count` (integer, not null)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on scraping_usage table
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS scraping_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  month date NOT NULL,
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scraping_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own usage"
  ON scraping_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
  ON scraping_usage
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);