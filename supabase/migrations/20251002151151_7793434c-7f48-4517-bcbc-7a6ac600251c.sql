-- Remove unique constraint on user_id to allow multiple goals per user
ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goals_user_id_key;