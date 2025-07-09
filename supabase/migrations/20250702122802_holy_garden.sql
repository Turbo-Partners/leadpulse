/*
  # Adicionar sistema de proprietário de leads

  1. Changes
    - Adicionar campo owner_id para identificar o proprietário do lead
    - Atualizar políticas RLS para administradores verem todos os leads do grupo
    - Permitir que administradores editem o proprietário

  2. Security
    - Administradores podem ver e editar todos os leads do grupo
    - Colaboradores podem ver leads atribuídos a eles ou sem atribuição
    - Manter isolamento entre grupos diferentes
*/

-- Adicionar campo owner_id à tabela leads
DO $$
BEGIN
  -- Adicionar campo owner_id (proprietário do lead)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE leads ADD COLUMN owner_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Atualizar políticas RLS para leads com melhor controle de acesso
DROP POLICY IF EXISTS "Users can read leads they have access to" ON leads;
DROP POLICY IF EXISTS "Users can insert leads in their groups" ON leads;
DROP POLICY IF EXISTS "Users can update leads they have access to" ON leads;
DROP POLICY IF EXISTS "Users can delete leads they have access to" ON leads;

-- Nova política de leitura: administradores veem todos os leads do grupo
CREATE POLICY "Users can read leads they have access to"
  ON leads
  FOR SELECT
  TO authenticated
  USING (
    -- Own leads (backward compatibility)
    user_id = auth.uid() OR
    -- Leads owned by the user
    owner_id = auth.uid() OR
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
        assigned_to = auth.uid() OR assigned_to IS NULL OR owner_id = auth.uid()
      )
    )
  );

-- Nova política de inserção
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

-- Nova política de atualização: administradores podem editar todos os leads do grupo
CREATE POLICY "Users can update leads they have access to"
  ON leads
  FOR UPDATE
  TO authenticated
  USING (
    -- Own leads (backward compatibility)
    user_id = auth.uid() OR
    -- Leads owned by the user
    owner_id = auth.uid() OR
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
    owner_id = auth.uid() OR
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_groups 
      WHERE user_groups.id = leads.group_id 
      AND user_groups.admin_user_id = auth.uid()
    )
  );

-- Nova política de exclusão
CREATE POLICY "Users can delete leads they have access to"
  ON leads
  FOR DELETE
  TO authenticated
  USING (
    -- Own leads (backward compatibility)
    user_id = auth.uid() OR
    -- Leads owned by the user
    owner_id = auth.uid() OR
    -- Group admin can delete all group leads
    EXISTS (
      SELECT 1 FROM user_groups 
      WHERE user_groups.id = leads.group_id 
      AND user_groups.admin_user_id = auth.uid()
    )
  );

-- Atualizar leads existentes para definir owner_id baseado no user_id
UPDATE leads 
SET owner_id = user_id 
WHERE owner_id IS NULL AND user_id IS NOT NULL;