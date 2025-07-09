/*
  # Corrigir sistema de administradores e colaboradores

  1. Changes
    - Verificar e corrigir foreign keys nas tabelas
    - Simplificar políticas RLS para melhor identificação de roles
    - Atualizar dados existentes para garantir consistência
    - Criar view de debug para verificar roles

  2. Security
    - Administradores podem ver todos os leads do grupo
    - Colaboradores podem ver leads do grupo onde são ativos
    - Manter isolamento entre grupos diferentes
*/

-- Primeiro, vamos verificar e corrigir a estrutura das tabelas
-- Garantir que todas as foreign keys estão corretas

DO $$
BEGIN
  -- Adicionar foreign key para leads.group_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'leads_group_id_fkey'
  ) THEN
    ALTER TABLE leads ADD CONSTRAINT leads_group_id_fkey 
    FOREIGN KEY (group_id) REFERENCES user_groups(id);
  END IF;

  -- Adicionar foreign key para leads.assigned_to se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'leads_assigned_to_fkey'
  ) THEN
    ALTER TABLE leads ADD CONSTRAINT leads_assigned_to_fkey 
    FOREIGN KEY (assigned_to) REFERENCES auth.users(id);
  END IF;

  -- Adicionar foreign key para leads.owner_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'leads_owner_id_fkey'
  ) THEN
    ALTER TABLE leads ADD CONSTRAINT leads_owner_id_fkey 
    FOREIGN KEY (owner_id) REFERENCES auth.users(id);
  END IF;

  -- Adicionar foreign key para leads.user_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'leads_user_id_fkey'
  ) THEN
    ALTER TABLE leads ADD CONSTRAINT leads_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id);
  END IF;
END $$;

-- Remover todas as políticas RLS existentes para leads
DROP POLICY IF EXISTS "Users can read leads they have access to" ON leads;
DROP POLICY IF EXISTS "Users can insert leads in their groups" ON leads;
DROP POLICY IF EXISTS "Users can update leads they have access to" ON leads;
DROP POLICY IF EXISTS "Users can delete leads they have access to" ON leads;

-- Criar políticas RLS mais simples e claras para debug

-- Política de SELECT: Administradores veem todos os leads do grupo
CREATE POLICY "Users can read leads they have access to"
  ON leads
  FOR SELECT
  TO authenticated
  USING (
    -- Leads próprios (compatibilidade com usuários individuais)
    user_id = auth.uid() OR
    -- Leads onde o usuário é proprietário
    owner_id = auth.uid() OR
    -- Leads atribuídos ao usuário
    assigned_to = auth.uid() OR
    -- ADMINISTRADOR: pode ver TODOS os leads do grupo que administra
    EXISTS (
      SELECT 1 FROM user_groups 
      WHERE user_groups.id = leads.group_id 
      AND user_groups.admin_user_id = auth.uid()
    ) OR
    -- COLABORADOR: pode ver leads do grupo onde é colaborador ativo
    EXISTS (
      SELECT 1 FROM group_collaborators 
      WHERE group_collaborators.group_id = leads.group_id 
      AND group_collaborators.user_id = auth.uid()
      AND group_collaborators.status = 'active'
    )
  );

-- Política de INSERT: Permitir criação de leads
CREATE POLICY "Users can insert leads in their groups"
  ON leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Usuários individuais podem criar leads próprios
    (user_id = auth.uid() AND group_id IS NULL) OR
    -- Administradores podem criar leads no grupo
    EXISTS (
      SELECT 1 FROM user_groups 
      WHERE user_groups.id = leads.group_id 
      AND user_groups.admin_user_id = auth.uid()
    ) OR
    -- Colaboradores podem criar leads no grupo
    EXISTS (
      SELECT 1 FROM group_collaborators 
      WHERE group_collaborators.group_id = leads.group_id 
      AND group_collaborators.user_id = auth.uid()
      AND group_collaborators.status = 'active'
    )
  );

-- Política de UPDATE: Permitir edição de leads
CREATE POLICY "Users can update leads they have access to"
  ON leads
  FOR UPDATE
  TO authenticated
  USING (
    -- Leads próprios
    user_id = auth.uid() OR
    -- Leads onde é proprietário
    owner_id = auth.uid() OR
    -- Leads atribuídos
    assigned_to = auth.uid() OR
    -- Administradores podem editar todos os leads do grupo
    EXISTS (
      SELECT 1 FROM user_groups 
      WHERE user_groups.id = leads.group_id 
      AND user_groups.admin_user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Mesmas condições do USING
    user_id = auth.uid() OR
    owner_id = auth.uid() OR
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_groups 
      WHERE user_groups.id = leads.group_id 
      AND user_groups.admin_user_id = auth.uid()
    )
  );

-- Política de DELETE: Permitir exclusão de leads
CREATE POLICY "Users can delete leads they have access to"
  ON leads
  FOR DELETE
  TO authenticated
  USING (
    -- Leads próprios
    user_id = auth.uid() OR
    -- Leads onde é proprietário
    owner_id = auth.uid() OR
    -- Administradores podem deletar todos os leads do grupo
    EXISTS (
      SELECT 1 FROM user_groups 
      WHERE user_groups.id = leads.group_id 
      AND user_groups.admin_user_id = auth.uid()
    )
  );

-- Garantir que leads criados por colaboradores tenham o group_id correto
-- Atualizar leads existentes que foram criados por colaboradores mas não têm group_id

-- Para colaboradores ativos
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

-- Para administradores
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

-- Definir owner_id para leads que não têm
UPDATE leads 
SET owner_id = user_id 
WHERE owner_id IS NULL AND user_id IS NOT NULL;

-- Criar uma view para debug (usando apenas dados das tabelas públicas)
CREATE OR REPLACE VIEW debug_user_roles AS
SELECT 
  au.id as user_id,
  au.email,
  pu.name,
  'admin' as role,
  ug.id as group_id,
  ug.name as group_name
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
JOIN user_groups ug ON ug.admin_user_id = au.id

UNION ALL

SELECT 
  au.id as user_id,
  au.email,
  pu.name,
  gc.role,
  gc.group_id,
  ug.name as group_name
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
JOIN group_collaborators gc ON gc.user_id = au.id
JOIN user_groups ug ON ug.id = gc.group_id
WHERE gc.status = 'active';

-- Comentário para debug: 
-- Para verificar se os dados estão corretos, execute:
-- SELECT * FROM debug_user_roles;
-- SELECT id, companyname, user_id, group_id, owner_id FROM leads;