/*
  # Criar tabela de relacionamento lead_tags_relation

  1. New Tables
    - `lead_tags_relation`
      - `id` (uuid, primary key)
      - `lead_id` (uuid, references leads)
      - `tag_id` (uuid, references lead_tags)
      - `created_at` (timestamptz)
      - Constraint único para evitar duplicatas
      - Foreign keys com cascade delete

  2. Security
    - Enable RLS on lead_tags_relation table
    - Add policies for authenticated users to manage their own lead-tag relationships
*/

-- Create lead_tags_relation table for many-to-many relationship
CREATE TABLE IF NOT EXISTS lead_tags_relation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  tag_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (lead_id, tag_id),
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES lead_tags(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE lead_tags_relation ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lead_tags_relation
CREATE POLICY "Users can read own lead-tag relations"
  ON lead_tags_relation
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leads 
      WHERE leads.id = lead_tags_relation.lead_id 
      AND leads.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own lead-tag relations"
  ON lead_tags_relation
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leads 
      WHERE leads.id = lead_tags_relation.lead_id 
      AND leads.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own lead-tag relations"
  ON lead_tags_relation
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leads 
      WHERE leads.id = lead_tags_relation.lead_id 
      AND leads.user_id = auth.uid()
    )
  );