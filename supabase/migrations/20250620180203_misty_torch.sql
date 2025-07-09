/*
  # Atualizar conta gratuita para 40 extrações

  1. Changes
    - Atualizar extraction_limit de 50 para 40 no plano gratuito
    - Atualizar features para mostrar "40 extrações de leads"

  2. Security
    - Manter políticas RLS existentes
*/

-- Atualizar o plano gratuito para 40 extrações
UPDATE subscription_plans 
SET 
  extraction_limit = 40,
  features = '["Até 100 leads no CRM", "40 extrações de leads", "Funcionalidades básicas", "Suporte por email"]'::jsonb
WHERE type = 'free';