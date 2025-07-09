/*
  # Fix RLS policies for leads table

  1. Changes
    - Drop existing RLS policies for leads table
    - Create new, more specific RLS policies that properly handle authentication

  2. Security
    - Enable RLS on leads table
    - Add policies for CRUD operations with proper authentication checks
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can delete leads" ON leads;
DROP POLICY IF EXISTS "Users can insert leads" ON leads;
DROP POLICY IF EXISTS "Users can read leads" ON leads;
DROP POLICY IF EXISTS "Users can update leads" ON leads;

-- Create new policies with proper authentication checks
CREATE POLICY "Enable read access for authenticated users"
ON leads FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert access for authenticated users"
ON leads FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update access for authenticated users"
ON leads FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete access for authenticated users"
ON leads FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);