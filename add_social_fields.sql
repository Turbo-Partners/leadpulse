-- Script para adicionar campos de redes sociais à tabela leads
-- Execute este script no seu banco de dados Supabase

-- Adicionar campo instagram
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'instagram'
  ) THEN
    ALTER TABLE leads ADD COLUMN instagram text;
    RAISE NOTICE 'Campo instagram adicionado à tabela leads';
  ELSE
    RAISE NOTICE 'Campo instagram já existe na tabela leads';
  END IF;
END $$;

-- Adicionar campo facebook
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'facebook'
  ) THEN
    ALTER TABLE leads ADD COLUMN facebook text;
    RAISE NOTICE 'Campo facebook adicionado à tabela leads';
  ELSE
    RAISE NOTICE 'Campo facebook já existe na tabela leads';
  END IF;
END $$;

-- Adicionar campo website
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'website'
  ) THEN
    ALTER TABLE leads ADD COLUMN website text;
    RAISE NOTICE 'Campo website adicionado à tabela leads';
  ELSE
    RAISE NOTICE 'Campo website já existe na tabela leads';
  END IF;
END $$;

-- Verificar a estrutura atual da tabela leads
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'leads' 
ORDER BY ordinal_position; 