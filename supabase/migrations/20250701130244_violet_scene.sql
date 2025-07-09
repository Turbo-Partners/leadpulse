/*
  # Fix infinite recursion in group_collaborators RLS policy

  1. Problem
    - The SELECT policy for group_collaborators has a circular reference
    - It queries group_collaborators from within its own policy, causing infinite recursion

  2. Solution
    - Simplify the SELECT policy to remove the circular reference
    - Users can read collaborators if they are:
      - The collaborator themselves (user_id = uid())
      - Admin of the group (via user_groups.admin_user_id)
    - Remove the self-referencing subquery that causes recursion

  3. Security
    - Maintains proper access control
    - Prevents infinite recursion
    - Users can only see collaborators from groups they have access to
*/

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Users can read collaborators from their groups" ON group_collaborators;

-- Create a new simplified policy without circular reference
CREATE POLICY "Users can read collaborators from their groups"
  ON group_collaborators
  FOR SELECT
  TO authenticated
  USING (
    (user_id = auth.uid()) OR 
    (EXISTS (
      SELECT 1 
      FROM user_groups 
      WHERE user_groups.id = group_collaborators.group_id 
      AND user_groups.admin_user_id = auth.uid()
    ))
  );