/*
  # Fix infinite recursion in user_groups RLS policy

  1. Problem
    - The current SELECT policy on user_groups table creates infinite recursion
    - Policy references user_groups.id within its own condition when checking group_collaborators
    - This causes circular dependency when Supabase evaluates the policy

  2. Solution
    - Drop the problematic policy
    - Create a simpler policy that avoids self-reference
    - Use a more direct approach for checking user access to groups

  3. Changes
    - Remove existing SELECT policy that causes recursion
    - Add new SELECT policy with simplified logic
    - Ensure users can read groups they admin or are active collaborators in
*/

-- Drop the existing problematic SELECT policy
DROP POLICY IF EXISTS "Users can read groups they belong to" ON user_groups;

-- Create a new SELECT policy that avoids recursion
-- This policy allows users to read groups where they are either:
-- 1. The admin (admin_user_id = uid())
-- 2. An active collaborator (checked through a separate query that doesn't reference user_groups)
CREATE POLICY "Users can read their groups"
  ON user_groups
  FOR SELECT
  TO authenticated
  USING (
    admin_user_id = auth.uid() 
    OR 
    id IN (
      SELECT DISTINCT group_id 
      FROM group_collaborators 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  );