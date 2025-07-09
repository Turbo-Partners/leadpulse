/*
  # Update leads table RLS policies

  1. Security Changes
    - Drop existing RLS policies for leads table
    - Create new policies that properly handle user authentication
    - Ensure authenticated users can perform CRUD operations
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON leads;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON leads;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON leads;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON leads;

-- Create new policies with proper authentication checks
CREATE POLICY "Enable read access for authenticated users"
ON leads
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert access for authenticated users"
ON leads
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update access for authenticated users"
ON leads
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete access for authenticated users"
ON leads
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);