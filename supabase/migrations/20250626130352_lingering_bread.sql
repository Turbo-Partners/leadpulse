/*
  # Sistema de Colaboradores com Grupos e Permissões

  1. New Tables
    - `user_groups`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text)
      - `admin_user_id` (uuid, references auth.users) - usuário administrador do grupo
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `group_collaborators`
      - `id` (uuid, primary key)
      - `group_id` (uuid, references user_groups)
      - `user_id` (uuid, references auth.users)
      - `email` (text, not null)
      - `role` (text, not null) - 'admin' ou 'collaborator'
      - `status` (text, not null) - 'pending', 'active', 'inactive'
      - `invited_by` (uuid, references auth.users)
      - `invited_at` (timestamptz)
      - `joined_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Changes to existing tables
    - Add `group_id` to leads table
    - Add `assigned_to` to leads table (responsável pelo card)
    - Update RLS policies for multi-tenant access

  3. Security
    - Enable RLS on all new tables
    - Add policies for group-based access control
    - Update leads policies for collaborative access
*/

-- Create user_groups table
CREATE TABLE IF NOT EXISTS user_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  admin_user_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create group_collaborators table
CREATE TABLE IF NOT EXISTS group_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES user_groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'collaborator')),
  status text NOT NULL CHECK (status IN ('pending', 'active', 'inactive')) DEFAULT 'pending',
  invited_by uuid REFERENCES auth.users(id) NOT NULL,
  invited_at timestamptz DEFAULT now(),
  joined_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(group_id, email)
);

-- Add group_id and assigned_to to leads table
DO $$
BEGIN
  -- Add group_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'group_id'
  ) THEN
    ALTER TABLE leads ADD COLUMN group_id uuid REFERENCES user_groups(id);
  END IF;

  -- Add assigned_to column (responsável pelo card)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE leads ADD COLUMN assigned_to uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_collaborators ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_groups
CREATE POLICY "Users can read groups they belong to"
  ON user_groups
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

CREATE POLICY "Admins can create groups"
  ON user_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (admin_user_id = auth.uid());

CREATE POLICY "Admins can update their groups"
  ON user_groups
  FOR UPDATE
  TO authenticated
  USING (admin_user_id = auth.uid())
  WITH CHECK (admin_user_id = auth.uid());

CREATE POLICY "Admins can delete their groups"
  ON user_groups
  FOR DELETE
  TO authenticated
  USING (admin_user_id = auth.uid());

-- RLS Policies for group_collaborators
CREATE POLICY "Users can read collaborators from their groups"
  ON group_collaborators
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_groups 
      WHERE user_groups.id = group_collaborators.group_id 
      AND user_groups.admin_user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM group_collaborators gc2
      WHERE gc2.group_id = group_collaborators.group_id 
      AND gc2.user_id = auth.uid()
      AND gc2.status = 'active'
    )
  );

CREATE POLICY "Group admins can invite collaborators"
  ON group_collaborators
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_groups 
      WHERE user_groups.id = group_collaborators.group_id 
      AND user_groups.admin_user_id = auth.uid()
    )
  );

CREATE POLICY "Group admins can update collaborators"
  ON group_collaborators
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_groups 
      WHERE user_groups.id = group_collaborators.group_id 
      AND user_groups.admin_user_id = auth.uid()
    ) OR
    (user_id = auth.uid() AND status = 'pending') -- Users can accept their own invitations
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_groups 
      WHERE user_groups.id = group_collaborators.group_id 
      AND user_groups.admin_user_id = auth.uid()
    ) OR
    (user_id = auth.uid() AND status = 'pending')
  );

CREATE POLICY "Group admins can delete collaborators"
  ON group_collaborators
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_groups 
      WHERE user_groups.id = group_collaborators.group_id 
      AND user_groups.admin_user_id = auth.uid()
    )
  );

-- Update leads RLS policies for collaborative access
DROP POLICY IF EXISTS "Users can read own leads" ON leads;
DROP POLICY IF EXISTS "Users can insert own leads" ON leads;
DROP POLICY IF EXISTS "Users can update own leads" ON leads;
DROP POLICY IF EXISTS "Users can delete own leads" ON leads;

-- New collaborative policies for leads
CREATE POLICY "Users can read leads they have access to"
  ON leads
  FOR SELECT
  TO authenticated
  USING (
    -- Own leads (backward compatibility)
    user_id = auth.uid() OR
    -- Assigned leads
    assigned_to = auth.uid() OR
    -- Group admin can see all group leads
    EXISTS (
      SELECT 1 FROM user_groups 
      WHERE user_groups.id = leads.group_id 
      AND user_groups.admin_user_id = auth.uid()
    ) OR
    -- Group collaborators can see leads assigned to them or unassigned in their group
    (
      EXISTS (
        SELECT 1 FROM group_collaborators 
        WHERE group_collaborators.group_id = leads.group_id 
        AND group_collaborators.user_id = auth.uid()
        AND group_collaborators.status = 'active'
      ) AND (
        assigned_to = auth.uid() OR assigned_to IS NULL
      )
    )
  );

CREATE POLICY "Users can insert leads in their groups"
  ON leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Own leads (backward compatibility)
    (user_id = auth.uid() AND group_id IS NULL) OR
    -- Group admin can create leads in their group
    EXISTS (
      SELECT 1 FROM user_groups 
      WHERE user_groups.id = leads.group_id 
      AND user_groups.admin_user_id = auth.uid()
    ) OR
    -- Group collaborators can create leads in their group
    EXISTS (
      SELECT 1 FROM group_collaborators 
      WHERE group_collaborators.group_id = leads.group_id 
      AND group_collaborators.user_id = auth.uid()
      AND group_collaborators.status = 'active'
    )
  );

CREATE POLICY "Users can update leads they have access to"
  ON leads
  FOR UPDATE
  TO authenticated
  USING (
    -- Own leads (backward compatibility)
    user_id = auth.uid() OR
    -- Assigned leads
    assigned_to = auth.uid() OR
    -- Group admin can update all group leads
    EXISTS (
      SELECT 1 FROM user_groups 
      WHERE user_groups.id = leads.group_id 
      AND user_groups.admin_user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Same conditions as USING
    user_id = auth.uid() OR
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_groups 
      WHERE user_groups.id = leads.group_id 
      AND user_groups.admin_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete leads they have access to"
  ON leads
  FOR DELETE
  TO authenticated
  USING (
    -- Own leads (backward compatibility)
    user_id = auth.uid() OR
    -- Group admin can delete all group leads
    EXISTS (
      SELECT 1 FROM user_groups 
      WHERE user_groups.id = leads.group_id 
      AND user_groups.admin_user_id = auth.uid()
    )
  );

-- Create function to automatically create a default group for new users
CREATE OR REPLACE FUNCTION create_default_group_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a default group for the new user
  INSERT INTO user_groups (name, description, admin_user_id)
  VALUES (
    'Minha Equipe',
    'Grupo padrão criado automaticamente',
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to execute the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created_group ON auth.users;
CREATE TRIGGER on_auth_user_created_group
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_group_for_new_user();

-- Create default groups for existing users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT u.id, u.email
    FROM auth.users u
    LEFT JOIN user_groups ug ON u.id = ug.admin_user_id
    WHERE ug.id IS NULL
  LOOP
    INSERT INTO user_groups (name, description, admin_user_id)
    VALUES (
      'Minha Equipe',
      'Grupo padrão criado automaticamente',
      user_record.id
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;