-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false);

-- Create storage policies for resumes
CREATE POLICY "Candidates can upload their own resumes" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Candidates can view their own resumes" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all resumes" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'resumes' AND get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Candidates can update their own resumes" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Candidates can delete their own resumes" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create resumes table
CREATE TABLE public.resumes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL,
  position_id UUID,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  content_type TEXT,
  extracted_text TEXT,
  ai_score INTEGER,
  ai_analysis JSONB,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on resumes
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for resumes
CREATE POLICY "Candidates can manage their own resumes" 
ON public.resumes 
FOR ALL 
USING (auth.uid() = candidate_id);

CREATE POLICY "Admins can view all resumes" 
ON public.resumes 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin');

-- Add resume_id and ai_score to interviews table
ALTER TABLE public.interviews 
ADD COLUMN resume_id UUID REFERENCES public.resumes(id),
ADD COLUMN ai_resume_score INTEGER;

-- Add job_requirements to positions table for AI comparison
ALTER TABLE public.positions 
ADD COLUMN job_requirements JSONB;

-- Create trigger for updated_at
CREATE TRIGGER update_resumes_updated_at
BEFORE UPDATE ON public.resumes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();