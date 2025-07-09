/*
  # Atualizar políticas RLS para isolamento por usuário

  1. Mudanças nas Políticas RLS
    - Atualizar todas as tabelas para usar user_id como filtro
    - Adicionar user_id às tabelas que não possuem
    - Garantir que cada usuário veja apenas seus próprios dados

  2. Tabelas Afetadas
    - leads: adicionar user_id e atualizar políticas
    - lead_activities: atualizar políticas para usar created_by
    - lead_documents: atualizar políticas para usar uploaded_by
    - lead_history: atualizar políticas para usar created_by
    - lead_tags: manter compartilhado entre usuários
    - scrapping_leads: atualizar políticas para usar created_by
    - scraping_usage: já isolado por user_id

  3. Segurança
    - Cada usuário vê apenas seus próprios dados
    - Políticas RLS rigorosas baseadas em auth.uid()
*/

-- Adicionar user_id à tabela leads se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE leads ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Atualizar leads existentes para ter user_id (temporariamente permitir NULL)
-- Em produção, você precisaria de uma migração de dados adequada

-- Atualizar políticas RLS para leads
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON leads;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON leads;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON leads;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON leads;

CREATE POLICY "Users can read own leads"
  ON leads
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leads"
  ON leads
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leads"
  ON leads
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own leads"
  ON leads
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Atualizar políticas RLS para lead_activities
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON lead_activities;

CREATE POLICY "Users can read own activities"
  ON lead_activities
  FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert own activities"
  ON lead_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own activities"
  ON lead_activities
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own activities"
  ON lead_activities
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Atualizar políticas RLS para lead_documents
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON lead_documents;

CREATE POLICY "Users can read own documents"
  ON lead_documents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can insert own documents"
  ON lead_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update own documents"
  ON lead_documents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = uploaded_by)
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete own documents"
  ON lead_documents
  FOR DELETE
  TO authenticated
  USING (auth.uid() = uploaded_by);

-- Atualizar políticas RLS para lead_history
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON lead_history;

CREATE POLICY "Users can read own history"
  ON lead_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert own history"
  ON lead_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own history"
  ON lead_history
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own history"
  ON lead_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Atualizar políticas RLS para scrapping_leads
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON scrapping_leads;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON scrapping_leads;

CREATE POLICY "Users can read own scrapping leads"
  ON scrapping_leads
  FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert own scrapping leads"
  ON scrapping_leads
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- lead_tags permanecem compartilhados entre usuários (tags são globais)
-- scraping_usage já está isolado por user_id