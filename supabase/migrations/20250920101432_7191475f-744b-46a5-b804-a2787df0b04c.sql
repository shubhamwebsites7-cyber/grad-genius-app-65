-- Create tips table
CREATE TABLE public.tips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for tips
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;

-- Create policies for tips
CREATE POLICY "Users can view their own tips" 
ON public.tips 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tips" 
ON public.tips 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tips" 
ON public.tips 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tips" 
ON public.tips 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create streaks table
CREATE TABLE public.streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  current_count INTEGER NOT NULL DEFAULT 0,
  max_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_updated DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for streaks
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

-- Create policies for streaks
CREATE POLICY "Users can view their own streaks" 
ON public.streaks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own streaks" 
ON public.streaks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks" 
ON public.streaks 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own streaks" 
ON public.streaks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add missing columns to existing goals table if needed
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_tips_updated_at
BEFORE UPDATE ON public.tips
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_streaks_updated_at
BEFORE UPDATE ON public.streaks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();