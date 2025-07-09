/*
  # Fix user registration database triggers

  1. Problem
    - User registration is failing with "Database error saving new user"
    - Existing triggers may be causing conflicts or failures
    - RLS policies may be blocking trigger operations

  2. Solution
    - Create a proper users table in public schema
    - Fix trigger functions with proper error handling
    - Add service role policies for triggers to work with RLS
    - Ensure triggers don't conflict with existing ones

  3. Security
    - Enable RLS on all tables
    - Add policies for service role to allow trigger operations
    - Maintain user data isolation
*/

-- First, ensure we have a users table in the public schema
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own data
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
CREATE POLICY "Users can read own data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Create policy for users to update their own data
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create policy to allow service role to insert users (for triggers)
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
CREATE POLICY "Service role can insert users"
  ON public.users
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Drop ALL existing triggers that might conflict
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_create_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_create_group ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_create_subscription ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_group ON auth.users;

-- Drop existing trigger functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.create_free_subscription_for_new_user();
DROP FUNCTION IF EXISTS public.create_default_group_for_new_user();

-- Create a comprehensive trigger function with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  trial_plan_id uuid;
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

  -- Get the trial plan ID and create subscription
  BEGIN
    SELECT id INTO trial_plan_id
    FROM public.subscription_plans
    WHERE type = 'trial' AND active = true
    LIMIT 1;

    -- Create trial subscription if trial plan exists
    IF trial_plan_id IS NOT NULL THEN
      INSERT INTO public.user_subscriptions (user_id, plan_id, status, expires_at)
      VALUES (
        NEW.id,
        trial_plan_id,
        'active',
        NOW() + INTERVAL '7 days'
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

-- Create the trigger with a unique name
CREATE TRIGGER on_auth_user_created_comprehensive
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS policies allow the trigger to work
-- Create policy to allow service role to insert groups (for triggers)
DROP POLICY IF EXISTS "Service role can insert groups" ON public.user_groups;
CREATE POLICY "Service role can insert groups"
  ON public.user_groups
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create policy to allow service role to insert subscriptions (for triggers)
DROP POLICY IF EXISTS "Service role can insert subscriptions" ON public.user_subscriptions;
CREATE POLICY "Service role can insert subscriptions"
  ON public.user_subscriptions
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Update the existing RLS policies to ensure they don't conflict
-- Update user_groups policies
DROP POLICY IF EXISTS "Admins can create groups" ON public.user_groups;
CREATE POLICY "Admins can create groups"
  ON public.user_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (admin_user_id = auth.uid());

-- Update user_subscriptions policies  
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can insert their own subscriptions"
  ON public.user_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create any missing subscription plans if they don't exist
INSERT INTO public.subscription_plans (name, type, price, extraction_limit, duration_days, features, active)
VALUES 
  ('Período de Teste', 'trial', 0, 50, 7, '["Acesso completo por 7 dias", "50 extrações de leads", "Suporte por email"]'::jsonb, true)
ON CONFLICT DO NOTHING;

INSERT INTO public.subscription_plans (name, type, price, extraction_limit, duration_days, features, active)
VALUES 
  ('Plano Mensal', 'monthly', 190, 1000, 30, '["1.000 extrações por mês", "Acesso completo", "Suporte prioritário", "Relatórios avançados", "Pipeline ilimitado"]'::jsonb, true)
ON CONFLICT DO NOTHING;