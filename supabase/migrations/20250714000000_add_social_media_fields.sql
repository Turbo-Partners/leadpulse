/*
  # Adicionar campos de redes sociais à tabela leads

  1. New Fields
    - `instagram` (text) - URL do Instagram
    - `facebook` (text) - URL do Facebook
    - `website` (text) - URL do website
    - `address` (text) - Endereço completo
    - `category` (text) - Categoria do negócio
    - `description` (text) - Descrição do negócio
    - `score` (numeric) - Pontuação/avaliação
    - `reviews_count` (integer) - Número de avaliações

  2. Purpose
    - Armazenar dados extras vindos do scraping
    - Melhorar a qualidade dos leads com informações de redes sociais
    - Permitir contato através de múltiplos canais
*/

-- Adicionar campos de redes sociais e informações extras
DO $$
BEGIN
  -- Adicionar campo instagram
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'instagram'
  ) THEN
    ALTER TABLE leads ADD COLUMN instagram text;
  END IF;

  -- Adicionar campo facebook
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'facebook'
  ) THEN
    ALTER TABLE leads ADD COLUMN facebook text;
  END IF;

  -- Adicionar campo website
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'website'
  ) THEN
    ALTER TABLE leads ADD COLUMN website text;
  END IF;

  -- Adicionar campo address
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'address'
  ) THEN
    ALTER TABLE leads ADD COLUMN address text;
  END IF;

  -- Adicionar campo category
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'category'
  ) THEN
    ALTER TABLE leads ADD COLUMN category text;
  END IF;

  -- Adicionar campo description
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'description'
  ) THEN
    ALTER TABLE leads ADD COLUMN description text;
  END IF;

  -- Adicionar campo score
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'score'
  ) THEN
    ALTER TABLE leads ADD COLUMN score numeric(3,1);
  END IF;

  -- Adicionar campo reviews_count
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'reviews_count'
  ) THEN
    ALTER TABLE leads ADD COLUMN reviews_count integer;
  END IF;

  RAISE NOTICE 'Social media fields added to leads table successfully';
END $$;

-- Comentários para documentar os novos campos
COMMENT ON COLUMN leads.instagram IS 'URL do perfil do Instagram da empresa';
COMMENT ON COLUMN leads.facebook IS 'URL do perfil do Facebook da empresa';
COMMENT ON COLUMN leads.website IS 'URL do website da empresa';
COMMENT ON COLUMN leads.address IS 'Endereço completo da empresa';
COMMENT ON COLUMN leads.category IS 'Categoria do negócio (ex: Restaurante, Academia, etc.)';
COMMENT ON COLUMN leads.description IS 'Descrição do negócio';
COMMENT ON COLUMN leads.score IS 'Pontuação/avaliação do negócio (0.0 a 5.0)';
COMMENT ON COLUMN leads.reviews_count IS 'Número de avaliações do negócio';

-- Log da migração
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Added social media fields to leads table';
  RAISE NOTICE '- instagram: URL do Instagram';
  RAISE NOTICE '- facebook: URL do Facebook';
  RAISE NOTICE '- website: URL do website';
  RAISE NOTICE '- address: Endereço completo';
  RAISE NOTICE '- category: Categoria do negócio';
  RAISE NOTICE '- description: Descrição do negócio';
  RAISE NOTICE '- score: Pontuação/avaliação';
  RAISE NOTICE '- reviews_count: Número de avaliações';
END $$; 