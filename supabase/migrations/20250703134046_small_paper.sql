/*
  # Criar novos planos de assinatura

  1. New Plans
    - Plano Gratuito: 10 leads + 10 extrações (gratuito para sempre)
    - Plano Mensal: Leads ilimitados + 100 extrações (R$ 97/mês)

  2. Changes
    - Atualizar constraint de tipo para incluir 'free'
    - Criar planos com limites corretos
    - Atualizar função de criação de usuário

  3. Security
    - Manter políticas RLS existentes
*/

-- Primeiro, garantir que a constraint permite o tipo 'free'
DO $$
BEGIN
  -- Remover constraint existente se houver
  ALTER TABLE subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_type_check;
  
  -- Adicionar nova constraint que inclui 'free'
  ALTER TABLE subscription_plans ADD CONSTRAINT subscription_plans_type_check 
    CHECK (type = ANY (ARRAY['trial'::text, 'monthly'::text, 'free'::text]));
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Could not update type constraint: %', SQLERRM;
END $$;

-- Verificar se os planos já existem e criar/atualizar conforme necessário
DO $$
DECLARE
  free_plan_exists boolean := false;
  monthly_plan_exists boolean := false;
BEGIN
  -- Verificar se o plano gratuito já existe
  SELECT EXISTS(
    SELECT 1 FROM subscription_plans 
    WHERE type = 'free' AND name = 'Plano Gratuito'
  ) INTO free_plan_exists;

  -- Verificar se o plano mensal já existe
  SELECT EXISTS(
    SELECT 1 FROM subscription_plans 
    WHERE type = 'monthly' AND name = 'Plano Mensal'
  ) INTO monthly_plan_exists;

  -- Criar ou atualizar plano gratuito
  IF free_plan_exists THEN
    UPDATE subscription_plans 
    SET 
      price = 0,
      extraction_limit = 10,
      duration_days = NULL,
      features = '["Até 10 leads no pipeline", "10 extrações no Scrapping Map", "Funcionalidades básicas", "Suporte por email"]'::jsonb,
      active = true
    WHERE type = 'free' AND name = 'Plano Gratuito';
    
    RAISE NOTICE 'Updated existing Plano Gratuito';
  ELSE
    INSERT INTO subscription_plans (name, type, price, extraction_limit, duration_days, features, active) 
    VALUES (
      'Plano Gratuito', 
      'free', 
      0, 
      10, 
      NULL, 
      '["Até 10 leads no pipeline", "10 extrações no Scrapping Map", "Funcionalidades básicas", "Suporte por email"]'::jsonb, 
      true
    );
    
    RAISE NOTICE 'Created new Plano Gratuito';
  END IF;

  -- Criar ou atualizar plano mensal
  IF monthly_plan_exists THEN
    UPDATE subscription_plans 
    SET 
      price = 97,
      extraction_limit = 100,
      duration_days = 30,
      features = '["Leads ilimitados no pipeline", "100 extrações por mês", "Acesso completo", "Suporte prioritário", "Relatórios avançados"]'::jsonb,
      active = true
    WHERE type = 'monthly' AND name = 'Plano Mensal';
    
    RAISE NOTICE 'Updated existing Plano Mensal';
  ELSE
    INSERT INTO subscription_plans (name, type, price, extraction_limit, duration_days, features, active) 
    VALUES (
      'Plano Mensal', 
      'monthly', 
      97, 
      100, 
      30, 
      '["Leads ilimitados no pipeline", "100 extrações por mês", "Acesso completo", "Suporte prioritário", "Relatórios avançados"]'::jsonb, 
      true
    );
    
    RAISE NOTICE 'Created new Plano Mensal';
  END IF;
END $$;

-- Atualizar função para criar assinatura gratuita por padrão
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  free_plan_id uuid;
  group_created boolean := false;
  subscription_created boolean := false;
BEGIN
  -- Insert user into public.users table
  BEGIN
    INSERT INTO public.users (id, email, name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
    );
  EXCEPTION
    WHEN unique_violation THEN
      -- User already exists, update instead
      UPDATE public.users 
      SET 
        email = NEW.email,
        name = COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        updated_at = now()
      WHERE id = NEW.id;
    WHEN OTHERS THEN
      RAISE WARNING 'Error creating user profile: %', SQLERRM;
  END;

  -- Create default group for the user
  BEGIN
    INSERT INTO public.user_groups (name, description, admin_user_id)
    VALUES (
      'Meu Grupo',
      'Grupo padrão criado automaticamente',
      NEW.id
    );
    group_created := true;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Error creating default group: %', SQLERRM;
      group_created := false;
  END;

  -- Get the free plan ID and create subscription
  BEGIN
    SELECT id INTO free_plan_id
    FROM public.subscription_plans
    WHERE type = 'free' AND name = 'Plano Gratuito' AND active = true
    LIMIT 1;

    -- Create free subscription if free plan exists
    IF free_plan_id IS NOT NULL THEN
      INSERT INTO public.user_subscriptions (user_id, plan_id, status)
      VALUES (
        NEW.id,
        free_plan_id,
        'active'
      );
      subscription_created := true;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Error creating subscription: %', SQLERRM;
      subscription_created := false;
  END;

  -- Log success/failure for debugging
  RAISE NOTICE 'User % created. Group: %, Subscription: %', NEW.email, group_created, subscription_created;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Critical error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Log da criação dos planos
DO $$
BEGIN
  RAISE NOTICE 'New subscription plans configured successfully:';
  RAISE NOTICE '- Plano Gratuito: 10 leads + 10 extrações (gratuito para sempre)';
  RAISE NOTICE '- Plano Mensal: Leads ilimitados + 100 extrações (R$ 97/mês)';
END $$;