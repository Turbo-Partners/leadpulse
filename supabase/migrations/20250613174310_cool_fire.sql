/*
  # Sistema de Planos de Assinatura

  1. New Tables
    - `subscription_plans`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `type` (text, not null) - 'trial' or 'monthly'
      - `price` (numeric, not null)
      - `extraction_limit` (integer, not null)
      - `duration_days` (integer) - for trial plans
      - `features` (jsonb)
      - `active` (boolean, default true)
      - `created_at` (timestamptz)

    - `user_subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `plan_id` (uuid, references subscription_plans)
      - `status` (text, not null) - 'active', 'expired', 'cancelled'
      - `started_at` (timestamptz, not null)
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('trial', 'monthly')),
  price numeric NOT NULL DEFAULT 0,
  extraction_limit integer NOT NULL,
  duration_days integer,
  features jsonb DEFAULT '[]'::jsonb,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  plan_id uuid REFERENCES subscription_plans(id) NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'expired', 'cancelled')) DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans (public read for plan selection)
CREATE POLICY "Anyone can read active subscription plans"
  ON subscription_plans
  FOR SELECT
  USING (active = true);

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can read their own subscriptions"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
  ON user_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
  ON user_subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert default plans
INSERT INTO subscription_plans (name, type, price, extraction_limit, duration_days, features) VALUES
  ('Período de Teste', 'trial', 0, 5, 7, '["Acesso completo por 7 dias", "5 extrações de leads", "Suporte por email"]'::jsonb),
  ('Plano Mensal', 'monthly', 97, 100, 30, '["100 extrações por mês", "Acesso completo", "Suporte prioritário", "Relatórios avançados"]'::jsonb);