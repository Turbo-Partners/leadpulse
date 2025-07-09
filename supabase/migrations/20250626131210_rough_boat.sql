/*
  # Fix infinite recursion in user_groups RLS policy

  1. Problem
    - The current SELECT policy for user_groups creates infinite recursion
    - Policy tries to check group_collaborators which references back to user_groups
    
  2. Solution
    - Simplify the SELECT policy to avoid circular dependencies
    - Use a more direct approach that doesn't create recursive queries
    
  3. Changes
    - Drop existing problematic SELECT policy
    - Create new simplified SELECT policy
    - Ensure users can read groups they admin or are active collaborators in
*/

-- First, enable RLS on user_groups if not already enabled
ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;

-- Drop the existing problematic SELECT policy
DROP POLICY IF EXISTS "Users can read their groups" ON user_groups;

-- Create a new simplified SELECT policy that avoids recursion
CREATE POLICY "Users can read their groups" ON user_groups
  FOR SELECT
  TO authenticated
  USING (
    admin_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM group_collaborators 
      WHERE group_collaborators.group_id = user_groups.id 
      AND group_collaborators.user_id = auth.uid() 
      AND group_collaborators.status = 'active'
    )
  );