-- Add streak_number column to track sequential streaks
ALTER TABLE public.streaks ADD COLUMN streak_number integer DEFAULT 1;

-- Add final_count column to track completed streak lengths
ALTER TABLE public.streaks ADD COLUMN final_count integer DEFAULT 0;

-- Update existing records to have proper streak numbers
UPDATE public.streaks 
SET streak_number = 1, 
    final_count = CASE WHEN is_active = false THEN current_count ELSE 0 END;