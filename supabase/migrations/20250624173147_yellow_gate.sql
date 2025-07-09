/*
  # Corrigir criação automática de assinatura

  1. Mudanças
    - Criar função para automaticamente criar assinatura gratuita para novos usuários
    - Adicionar trigger para executar a função quando um novo usuário se registra
    - Garantir que todos os usuários tenham acesso ao pipeline

  2. Segurança
    - Função executa com privilégios de segurança
    - Apenas cria assinatura se o usuário não tiver uma ativa
*/

-- Criar função para criar assinatura gratuita automaticamente
CREATE OR REPLACE FUNCTION create_free_subscription_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
  free_plan_id uuid;
BEGIN
  -- Buscar o ID do plano gratuito
  SELECT id INTO free_plan_id 
  FROM subscription_plans 
  WHERE type = 'free' AND active = true 
  LIMIT 1;

  -- Se encontrou o plano gratuito, criar a assinatura
  IF free_plan_id IS NOT NULL THEN
    INSERT INTO user_subscriptions (user_id, plan_id, status)
    VALUES (NEW.id, free_plan_id, 'active');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para executar a função quando um novo usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_free_subscription_for_new_user();

-- Criar assinatura gratuita para usuários existentes que não têm assinatura
DO $$
DECLARE
  free_plan_id uuid;
  user_record RECORD;
BEGIN
  -- Buscar o ID do plano gratuito
  SELECT id INTO free_plan_id 
  FROM subscription_plans 
  WHERE type = 'free' AND active = true 
  LIMIT 1;

  -- Se encontrou o plano gratuito
  IF free_plan_id IS NOT NULL THEN
    -- Para cada usuário que não tem assinatura ativa
    FOR user_record IN 
      SELECT u.id 
      FROM auth.users u
      LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
      WHERE us.id IS NULL
    LOOP
      -- Criar assinatura gratuita
      INSERT INTO user_subscriptions (user_id, plan_id, status)
      VALUES (user_record.id, free_plan_id, 'active')
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
END $$;