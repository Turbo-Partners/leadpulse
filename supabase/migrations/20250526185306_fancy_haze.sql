/*
  # Add scrapping leads table

  1. New Tables
    - `scrapping_leads`
      - `id` (uuid, primary key)
      - `business_type` (text, not null)
      - `state` (text, not null)
      - `city` (text, not null)
      - `company_name` (text)
      - `phone` (text)
      - `email` (text)
      - `address` (text)
      - `created_at` (timestamptz)
      - `created_by` (uuid, references auth.users)

  2. Security
    - Enable RLS on scrapping_leads table
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS scrapping_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type text NOT NULL,
  state text NOT NULL,
  city text NOT NULL,
  company_name text,
  phone text,
  email text,
  address text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE scrapping_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users"
ON scrapping_leads FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert access for authenticated users"
ON scrapping_leads FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);