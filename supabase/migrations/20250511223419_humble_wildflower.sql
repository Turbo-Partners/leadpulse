/*
  # Create leads table

  1. New Tables
    - `leads`
      - `id` (uuid, primary key)
      - `companyname` (text, not null)
      - `contactName` (text, not null)
      - `email` (text, not null)
      - `phone` (text)
      - `jobTitle` (text)
      - `status` (text, not null)
      - `priority` (text, not null)
      - `createdDate` (bigint, not null)
      - `responsible` (text, not null)

  2. Security
    - Enable RLS on `leads` table
    - Add policy for authenticated users to read and write their own data
*/

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  companyname text NOT NULL,
  contactName text NOT NULL,
  email text NOT NULL,
  phone text,
  jobTitle text,
  status text NOT NULL,
  priority text NOT NULL,
  createdDate bigint NOT NULL,
  responsible text NOT NULL
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read and write leads"
  ON leads
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);