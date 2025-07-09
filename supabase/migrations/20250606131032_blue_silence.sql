/*
  # Fix leads table column names and add missing columns

  1. Changes
    - Rename contactName to contactname
    - Rename jobTitle to jobtitle  
    - Rename createdDate to createddate
    - Add value column for lead value
    - Add whatsapp column for WhatsApp contact
    - Add notes column for additional notes
    - Add nextactivity column for next activity

  2. Security
    - Maintain existing RLS policies
*/

-- Add missing columns if they don't exist
DO $$
BEGIN
  -- Add value column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'value'
  ) THEN
    ALTER TABLE leads ADD COLUMN value numeric;
  END IF;

  -- Add whatsapp column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'whatsapp'
  ) THEN
    ALTER TABLE leads ADD COLUMN whatsapp text;
  END IF;

  -- Add notes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'notes'
  ) THEN
    ALTER TABLE leads ADD COLUMN notes text;
  END IF;

  -- Add nextactivity column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'nextactivity'
  ) THEN
    ALTER TABLE leads ADD COLUMN nextactivity text;
  END IF;
END $$;

-- Fix column names if they exist with wrong case
DO $$
BEGIN
  -- Fix contactName to contactname
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'contactName'
  ) THEN
    ALTER TABLE leads RENAME COLUMN "contactName" TO contactname;
  END IF;

  -- Fix jobTitle to jobtitle
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'jobTitle'
  ) THEN
    ALTER TABLE leads RENAME COLUMN "jobTitle" TO jobtitle;
  END IF;

  -- Fix createdDate to createddate
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'createdDate'
  ) THEN
    ALTER TABLE leads RENAME COLUMN "createdDate" TO createddate;
  END IF;
END $$;