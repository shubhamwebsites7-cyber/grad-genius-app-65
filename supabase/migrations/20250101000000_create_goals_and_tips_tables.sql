-- Create goal table for tracking user goals
CREATE TABLE IF NOT EXISTS public.goal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tips table for health and lifestyle tips
CREATE TABLE IF NOT EXISTS public.tips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security for goal
ALTER TABLE public.goal ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security for tips
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;

-- Create policies for goal table
CREATE POLICY "Users can view their own goals" 
ON public.goal 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals" 
ON public.goal 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" 
ON public.goal 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" 
ON public.goal 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for tips table
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

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_goal_updated_at
BEFORE UPDATE ON public.goal
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tips_updated_at
BEFORE UPDATE ON public.tips
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
