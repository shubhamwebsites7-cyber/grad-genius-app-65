-- Create quiz_questions table for daily quiz management
-- This allows admins to update questions daily from the database

-- Create the quiz questions table
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question_number integer NOT NULL,
  question_text text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_option integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  
  CONSTRAINT quiz_questions_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_questions_number_unique UNIQUE (question_number),
  CONSTRAINT quiz_questions_number_check CHECK (question_number >= 1 AND question_number <= 25),
  CONSTRAINT quiz_questions_correct_option_check CHECK (correct_option >= 0 AND correct_option <= 3)
) TABLESPACE pg_default;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_quiz_questions_number 
ON public.quiz_questions USING btree (question_number) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_quiz_questions_active 
ON public.quiz_questions USING btree (is_active) TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active questions
CREATE POLICY "Anyone can read active quiz questions"
ON public.quiz_questions
FOR SELECT
TO authenticated
USING (is_active = true);

-- Policy: Only admins can insert/update/delete questions
CREATE POLICY "Admins can manage quiz questions"
ON public.quiz_questions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert the 25 questions
INSERT INTO public.quiz_questions (question_number, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES
(1, 'भारत की राजधानी क्या है?', 'मुंबई', 'कोलकाता', 'नई दिल्ली', 'चेन्नई', 2),
(2, 'भारत के पहले प्रधानमंत्री कौन थे?', 'महात्मा गांधी', 'जवाहरलाल नेहरू', 'सरदार पटेल', 'डॉ. अंबेडकर', 1),
(3, 'ताजमहल कहाँ स्थित है?', 'दिल्ली', 'जयपुर', 'आगरा', 'लखनऊ', 2),
(4, 'भारत का राष्ट्रीय पशु कौन सा है?', 'शेर', 'हाथी', 'बाघ', 'घोड़ा', 2),
(5, 'भारत का राष्ट्रीय पक्षी कौन सा है?', 'तोता', 'मोर', 'कौआ', 'कबूतर', 1),
(6, 'सूर्य किस दिशा से निकलता है?', 'पश्चिम', 'उत्तर', 'दक्षिण', 'पूर्व', 3),
(7, 'सप्ताह में कितने दिन होते हैं?', '5', '6', '7', '8', 2),
(8, 'भारत का राष्ट्रीय खेल क्या माना जाता है?', 'क्रिकेट', 'हॉकी', 'फुटबॉल', 'कबड्डी', 1),
(9, 'पानी का रासायनिक सूत्र क्या है?', 'CO₂', 'H₂O', 'O₂', 'NaCl', 1),
(10, 'भारत का राष्ट्रीय फूल कौन सा है?', 'गुलाब', 'कमल', 'सूरजमुखी', 'गेंदा', 1),
(11, 'भारत में कितने राज्य हैं?', '26', '27', '28', '29', 2),
(12, 'सबसे बड़ा महासागर कौन सा है?', 'हिंद महासागर', 'अटलांटिक महासागर', 'आर्कटिक महासागर', 'प्रशांत महासागर', 3),
(13, 'भारत का राष्ट्रीय ध्वज कितने रंगों का होता है?', '2', '3', '4', '5', 1),
(14, 'कंप्यूटर का दिमाग किसे कहा जाता है?', 'RAM', 'हार्ड डिस्क', 'CPU', 'मॉनिटर', 2),
(15, 'भारत का स्वतंत्रता दिवस कब मनाया जाता है?', '26 जनवरी', '2 अक्टूबर', '15 अगस्त', '14 नवंबर', 2),
(16, 'भारत का राष्ट्रीय गीत कौन सा है?', 'जन गण मन', 'वंदे मातरम्', 'सारे जहाँ से अच्छा', 'ऐ मेरे वतन के लोगों', 1),
(17, 'महात्मा गांधी का जन्म कब हुआ था?', '15 अगस्त', '26 जनवरी', '2 अक्टूबर', '14 अप्रैल', 2),
(18, 'भारत का राष्ट्रीय फल कौन सा है?', 'सेब', 'आम', 'केला', 'अंगूर', 1),
(19, 'भारत की सबसे लंबी नदी कौन सी है?', 'यमुना', 'गंगा', 'ब्रह्मपुत्र', 'गोदावरी', 1),
(20, 'सबसे छोटा महाद्वीप कौन सा है?', 'एशिया', 'अफ्रीका', 'ऑस्ट्रेलिया', 'यूरोप', 2),
(21, 'भारत का राष्ट्रीय वृक्ष कौन सा है?', 'पीपल', 'बरगद', 'नीम', 'आम', 1),
(22, 'मोबाइल फोन किस नेटवर्क पर काम करता है?', 'रेडियो', 'सैटेलाइट', 'सेलुलर नेटवर्क', 'केबल', 2),
(23, 'कंप्यूटर की भाषा क्या होती है?', 'हिंदी', 'अंग्रेजी', 'बाइनरी', 'संस्कृत', 2),
(24, 'मानव शरीर में कितने हृदय होते हैं?', '2', '3', '1', '4', 2),
(25, 'भारत का राष्ट्रीय प्रतीक क्या है?', 'अशोक स्तंभ', 'तिरंगा', 'कमल', 'चक्र', 0);

-- Comments for documentation
COMMENT ON TABLE public.quiz_questions IS 'Daily quiz questions for the 14-day testing period';
COMMENT ON COLUMN public.quiz_questions.correct_option IS '0=A, 1=B, 2=C, 3=D';
COMMENT ON COLUMN public.quiz_questions.is_active IS 'Set to false to disable a question without deleting';
