-- Create positions table for job openings
CREATE TABLE public.positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  department TEXT,
  experience_level TEXT CHECK (experience_level IN ('intern', 'junior', 'mid', 'senior', 'lead')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on positions
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

-- Create policies for positions
CREATE POLICY "Admins can manage positions" 
ON public.positions 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Everyone can view active positions" 
ON public.positions 
FOR SELECT 
USING (status = 'active');

-- Create question templates table for position-specific questions
CREATE TABLE public.question_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  position_id UUID NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_type TEXT DEFAULT 'text' CHECK (question_type IN ('text', 'video', 'code')),
  time_limit_seconds INTEGER DEFAULT 300,
  question_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on question templates
ALTER TABLE public.question_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for question templates
CREATE POLICY "Admins can manage question templates" 
ON public.question_templates 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can view question templates" 
ON public.question_templates 
FOR SELECT 
USING (true);

-- Create messages table for internal messaging
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  recipient_id UUID NOT NULL REFERENCES auth.users(id),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'delivered', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Users can view their messages" 
ON public.messages 
FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Admins can manage all messages" 
ON public.messages 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin');

-- Update interviews table to link to positions
ALTER TABLE public.interviews 
ADD COLUMN position_id UUID REFERENCES public.positions(id);

-- Update existing interviews to reference a default position if needed
-- (This will need to be handled after positions are created)

-- Create trigger for updated_at on positions
CREATE TRIGGER update_positions_updated_at
BEFORE UPDATE ON public.positions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on question_templates
CREATE TRIGGER update_question_templates_updated_at
BEFORE UPDATE ON public.question_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();