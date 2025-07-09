/*
  # Update subscription plan pricing

  1. Changes
    - Update monthly plan price to R$ 190
    - Update monthly plan extraction limit to 1000 leads
    - Update plan features to reflect new limits

  2. Security
    - Maintain existing RLS policies
*/

-- Update the monthly plan pricing and limits
UPDATE subscription_plans 
SET 
  price = 190,
  extraction_limit = 1000,
  features = '["1.000 extrações por mês", "Acesso completo", "Suporte prioritário", "Relatórios avançados", "Pipeline ilimitado"]'::jsonb
WHERE type = 'monthly';