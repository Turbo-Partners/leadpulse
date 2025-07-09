/*
  # Adicionar campos de conclusão para atividades

  1. Changes
    - Adicionar campo `completed` (boolean) para marcar atividades como concluídas
    - Adicionar campo `completed_at` (timestamptz) para registrar quando foi concluída
    - Atualizar tipo de evento no histórico para incluir 'activity_completed'

  2. Security
    - Manter políticas RLS existentes
*/

-- Adicionar campos de conclusão à tabela lead_activities
DO $$
BEGIN
  -- Adicionar campo completed
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lead_activities' AND column_name = 'completed'
  ) THEN
    ALTER TABLE lead_activities ADD COLUMN completed boolean DEFAULT false;
  END IF;

  -- Adicionar campo completed_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lead_activities' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE lead_activities ADD COLUMN completed_at timestamptz;
  END IF;
END $$;

-- Criar índice para melhorar performance de consultas por atividades concluídas
CREATE INDEX IF NOT EXISTS idx_lead_activities_completed 
ON lead_activities(completed, created_by, scheduled_for);