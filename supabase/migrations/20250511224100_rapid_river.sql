/*
  # Fix leads table RLS policy

  1. Changes
    - Drop existing RLS policy that's causing issues
    - Create new RLS policies with proper permissions for authenticated users
    
  2. Security
    - Enable RLS on leads table (already enabled)
    - Add separate policies for SELECT, INSERT, UPDATE, and DELETE operations
    - Ensure authenticated users can insert new leads
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Users can read and write leads" ON leads;

-- Create new policies with proper permissions
CREATE POLICY "Users can read leads"
  ON leads
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert leads"
  ON leads
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update leads"
  ON leads
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete leads"
  ON leads
  FOR DELETE
  TO authenticated
  USING (true);