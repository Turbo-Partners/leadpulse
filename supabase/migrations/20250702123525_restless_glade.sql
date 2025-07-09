/*
  # Corrigir visibilidade de leads para administradores

  1. Problema
    - Administradores não conseguem ver leads criados pelos colaboradores
    - Políticas RLS muito restritivas para administradores de grupo

  2. Solução
    - Atualizar política de SELECT para leads
    - Garantir que administradores vejam todos os leads do grupo
    - Manter isolamento entre grupos diferentes

  3. Segurança
    - Administradores veem todos os leads do seu grupo
    - Colaboradores veem apenas leads atribuídos a eles
    - Manter isolamento por user_id para compatibilidade
*/

-- Atualizar política de leitura para leads
DROP POLICY IF EXISTS "Users can read leads they have access to" ON leads;

CREATE POLICY "Users can read leads they have access to"
  ON leads
  FOR SELECT
  TO authenticated
  USING (
    -- Own leads (backward compatibility for individual users)
    user_id = auth.uid() OR
    -- Leads owned by the user
    owner_id = auth.uid() OR
    -- Assigned leads
    assigned_to = auth.uid() OR
    -- Group admin can see ALL group leads (including those created by collaborators)
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
        assigned_to = auth.uid() OR 
        assigned_to IS NULL OR 
        owner_id = auth.uid() OR
        user_id = auth.uid()
      )
    )
  );

-- Garantir que leads criados por colaboradores tenham group_id definido
-- Atualizar leads existentes que não têm group_id mas têm user_id de colaboradores
UPDATE leads 
SET group_id = (
  SELECT gc.group_id 
  FROM group_collaborators gc 
  WHERE gc.user_id = leads.user_id 
  AND gc.status = 'active'
  LIMIT 1
)
WHERE group_id IS NULL 
AND user_id IS NOT NULL 
AND EXISTS (
  SELECT 1 FROM group_collaborators gc 
  WHERE gc.user_id = leads.user_id 
  AND gc.status = 'active'
);

-- Atualizar leads existentes que não têm group_id mas têm user_id de administradores
UPDATE leads 
SET group_id = (
  SELECT ug.id 
  FROM user_groups ug 
  WHERE ug.admin_user_id = leads.user_id 
  LIMIT 1
)
WHERE group_id IS NULL 
AND user_id IS NOT NULL 
AND EXISTS (
  SELECT 1 FROM user_groups ug 
  WHERE ug.admin_user_id = leads.user_id
);