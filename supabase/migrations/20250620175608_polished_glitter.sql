/*
  # Atualizar conta gratuita para 50 extrações

  1. Changes
    - Atualizar extraction_limit da conta gratuita de 0 para 50
    - Atualizar features para refletir as 50 extrações

  2. Security
    - Manter políticas RLS existentes
*/

-- Atualizar o plano gratuito para incluir 50 extrações
UPDATE subscription_plans 
SET 
  extraction_limit = 50,
  features = '["Até 100 leads no CRM", "50 extrações de leads", "Funcionalidades básicas", "Suporte por email"]'::jsonb
WHERE type = 'free';