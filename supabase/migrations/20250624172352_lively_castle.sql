/*
  # Atualizar limites da conta gratuita

  1. Changes
    - Atualizar plano gratuito para 50 extrações (de 40)
    - Manter limite de 100 leads no CRM (será controlado por código para 50)
    - Atualizar features do plano

  2. Security
    - Manter políticas RLS existentes
*/

-- Atualizar o plano gratuito para 50 extrações
UPDATE subscription_plans 
SET 
  extraction_limit = 50,
  features = '["Até 50 leads no CRM", "50 extrações de leads", "Funcionalidades básicas", "Suporte por email"]'::jsonb
WHERE type = 'free';