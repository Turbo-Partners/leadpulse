/*
  # Fix scraping usage duplicates and add unique constraint

  1. Changes
    - Remove duplicate records by keeping only the latest one for each user/month combination
    - Add unique constraint to prevent future duplicates

  2. Security
    - Maintain existing RLS policies
*/

-- First, remove duplicate records by keeping only the one with the latest created_at for each user/month combination
DELETE FROM scraping_usage 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, month) id
  FROM scraping_usage
  ORDER BY user_id, month, created_at DESC
);

-- Now add the unique constraint
ALTER TABLE scraping_usage 
ADD CONSTRAINT scraping_usage_user_month_unique 
UNIQUE (user_id, month);