-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create calories table for daily meal tracking
CREATE TABLE public.calories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  morning INTEGER DEFAULT 0,
  afternoon INTEGER DEFAULT 0,
  evening INTEGER DEFAULT 0,
  dinner INTEGER DEFAULT 0,
  daily_goal INTEGER DEFAULT 2400,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create weights table for weight tracking
CREATE TABLE public.weights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create goals table for weight goals
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  weight_goal DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for calories
CREATE POLICY "Users can view their own calories" ON public.calories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calories" ON public.calories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calories" ON public.calories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calories" ON public.calories
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for weights
CREATE POLICY "Users can view their own weights" ON public.weights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weights" ON public.weights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weights" ON public.weights
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weights" ON public.weights
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for goals
CREATE POLICY "Users can view their own goals" ON public.goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" ON public.goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" ON public.goals
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calories_updated_at
  BEFORE UPDATE ON public.calories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_weights_updated_at
  BEFORE UPDATE ON public.weights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert demo data for the specified user
INSERT INTO public.profiles (user_id, email, name) VALUES 
('da06c3b2-68a6-4311-b33f-59ea7683a7a1', 'shubhamchoudhary7225@gmail.com', 'Shubham Choudhary')
ON CONFLICT (user_id) DO UPDATE SET 
  email = EXCLUDED.email,
  name = EXCLUDED.name;

INSERT INTO public.calories (user_id, date, morning, afternoon, evening, dinner, daily_goal) VALUES 
('da06c3b2-68a6-4311-b33f-59ea7683a7a1', CURRENT_DATE, 420, 760, 430, 740, 2400)
ON CONFLICT (user_id, date) DO UPDATE SET 
  morning = EXCLUDED.morning,
  afternoon = EXCLUDED.afternoon,
  evening = EXCLUDED.evening,
  dinner = EXCLUDED.dinner,
  daily_goal = EXCLUDED.daily_goal;

INSERT INTO public.weights (user_id, date, weight) VALUES 
('da06c3b2-68a6-4311-b33f-59ea7683a7a1', CURRENT_DATE, 72.5)
ON CONFLICT (user_id, date) DO UPDATE SET 
  weight = EXCLUDED.weight;

INSERT INTO public.goals (user_id, weight_goal) VALUES 
('da06c3b2-68a6-4311-b33f-59ea7683a7a1', 70.0)
ON CONFLICT (user_id) DO UPDATE SET 
  weight_goal = EXCLUDED.weight_goal;