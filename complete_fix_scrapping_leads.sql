-- Correção completa da tabela scrapping_leads
-- Execute este SQL no SQL Editor do Supabase Dashboard

-- Verificar estrutura atual
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'scrapping_leads' 
ORDER BY ordinal_position;

-- Criar tabela se não existir com todas as colunas necessárias
CREATE TABLE IF NOT EXISTS scrapping_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type text NOT NULL,
  state text NOT NULL,
  city text NOT NULL,
  neighborhood text,
  company_name text,
  phone text,
  email text,
  address text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  session_id uuid REFERENCES scraping_sessions(id) ON DELETE CASCADE
);

-- Adicionar todas as colunas que podem estar faltando
DO $$
BEGIN
  -- business_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scrapping_leads' AND column_name = 'business_type'
  ) THEN
    ALTER TABLE scrapping_leads ADD COLUMN business_type text NOT NULL DEFAULT '';
  END IF;

  -- state
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scrapping_leads' AND column_name = 'state'
  ) THEN
    ALTER TABLE scrapping_leads ADD COLUMN state text NOT NULL DEFAULT '';
  END IF;

  -- city
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scrapping_leads' AND column_name = 'city'
  ) THEN
    ALTER TABLE scrapping_leads ADD COLUMN city text NOT NULL DEFAULT '';
  END IF;

  -- neighborhood
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scrapping_leads' AND column_name = 'neighborhood'
  ) THEN
    ALTER TABLE scrapping_leads ADD COLUMN neighborhood text;
  END IF;

  -- company_name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scrapping_leads' AND column_name = 'company_name'
  ) THEN
    ALTER TABLE scrapping_leads ADD COLUMN company_name text;
  END IF;

  -- phone
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scrapping_leads' AND column_name = 'phone'
  ) THEN
    ALTER TABLE scrapping_leads ADD COLUMN phone text;
  END IF;

  -- email
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scrapping_leads' AND column_name = 'email'
  ) THEN
    ALTER TABLE scrapping_leads ADD COLUMN email text;
  END IF;

  -- address
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scrapping_leads' AND column_name = 'address'
  ) THEN
    ALTER TABLE scrapping_leads ADD COLUMN address text;
  END IF;

  -- created_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scrapping_leads' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE scrapping_leads ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;

  -- created_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scrapping_leads' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE scrapping_leads ADD COLUMN created_by uuid REFERENCES auth.users(id);
  END IF;

  -- session_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scrapping_leads' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE scrapping_leads ADD COLUMN session_id uuid REFERENCES scraping_sessions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE scrapping_leads ENABLE ROW LEVEL SECURITY;

-- Recriar políticas RLS
DROP POLICY IF EXISTS "Users can read own scrapping leads" ON scrapping_leads;
DROP POLICY IF EXISTS "Users can insert own scrapping leads" ON scrapping_leads;

CREATE POLICY "Users can read own scrapping leads"
  ON scrapping_leads
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM scraping_sessions 
      WHERE scraping_sessions.id = scrapping_leads.session_id 
      AND scraping_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own scrapping leads"
  ON scrapping_leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    (
      session_id IS NULL OR
      EXISTS (
        SELECT 1 FROM scraping_sessions 
        WHERE scraping_sessions.id = scrapping_leads.session_id 
        AND scraping_sessions.user_id = auth.uid()
      )
    )
  );

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_scrapping_leads_session_id ON scrapping_leads(session_id);
CREATE INDEX IF NOT EXISTS idx_scrapping_leads_created_by ON scrapping_leads(created_by);
CREATE INDEX IF NOT EXISTS idx_scrapping_leads_created_at ON scrapping_leads(created_at DESC);

-- Verificar estrutura final
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'scrapping_leads' 
ORDER BY ordinal_position;

-- Testar inserção (opcional - remova se não quiser dados de teste)
-- INSERT INTO scrapping_leads (business_type, state, city, company_name, phone, email, created_by)
-- VALUES ('Teste', 'SP', 'São Paulo', 'Empresa Teste', '11999999999', 'teste@teste.com', auth.uid())
-- ON CONFLICT DO NOTHING; 