-- Create onboarding stages table
CREATE TABLE public.onboarding_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create onboarding tasks table
CREATE TABLE public.onboarding_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stage_id UUID NOT NULL REFERENCES public.onboarding_stages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_days_offset INTEGER NOT NULL DEFAULT 0,
  file_url TEXT,
  notify_employee BOOLEAN NOT NULL DEFAULT true,
  task_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employee onboarding records table
CREATE TABLE public.employee_onboarding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  expected_joining_date DATE NOT NULL,
  actual_joining_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_employee_onboarding UNIQUE(employee_id)
);

-- Create employee onboarding task assignments table
CREATE TABLE public.employee_onboarding_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_onboarding_id UUID NOT NULL REFERENCES public.employee_onboarding(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.onboarding_tasks(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.profiles(user_id),
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.onboarding_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_onboarding_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for onboarding_stages
CREATE POLICY "Admins can manage onboarding stages"
  ON public.onboarding_stages
  FOR ALL
  USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Staff can view onboarding stages"
  ON public.onboarding_stages
  FOR SELECT
  USING (get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role, 'staff'::user_role]));

-- RLS Policies for onboarding_tasks
CREATE POLICY "Admins can manage onboarding tasks"
  ON public.onboarding_tasks
  FOR ALL
  USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Staff can view onboarding tasks"
  ON public.onboarding_tasks
  FOR SELECT
  USING (get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role, 'staff'::user_role]));

-- RLS Policies for employee_onboarding
CREATE POLICY "Admins can manage employee onboarding"
  ON public.employee_onboarding
  FOR ALL
  USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Employees can view their own onboarding"
  ON public.employee_onboarding
  FOR SELECT
  USING (auth.uid() = employee_id);

-- RLS Policies for employee_onboarding_tasks
CREATE POLICY "Admins can manage employee onboarding tasks"
  ON public.employee_onboarding_tasks
  FOR ALL
  USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Employees can view their assigned tasks"
  ON public.employee_onboarding_tasks
  FOR SELECT
  USING (
    auth.uid() = assigned_to 
    OR auth.uid() IN (
      SELECT employee_id FROM public.employee_onboarding 
      WHERE id = employee_onboarding_id
    )
  );

CREATE POLICY "Employees can update their assigned tasks"
  ON public.employee_onboarding_tasks
  FOR UPDATE
  USING (
    auth.uid() = assigned_to 
    OR auth.uid() IN (
      SELECT employee_id FROM public.employee_onboarding 
      WHERE id = employee_onboarding_id
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_onboarding_tasks_stage ON public.onboarding_tasks(stage_id);
CREATE INDEX idx_employee_onboarding_employee ON public.employee_onboarding(employee_id);
CREATE INDEX idx_employee_onboarding_tasks_onboarding ON public.employee_onboarding_tasks(employee_onboarding_id);
CREATE INDEX idx_employee_onboarding_tasks_assigned ON public.employee_onboarding_tasks(assigned_to);

-- Create triggers for updated_at
CREATE TRIGGER update_onboarding_stages_updated_at
  BEFORE UPDATE ON public.onboarding_stages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_onboarding_tasks_updated_at
  BEFORE UPDATE ON public.onboarding_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_onboarding_updated_at
  BEFORE UPDATE ON public.employee_onboarding
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_onboarding_tasks_updated_at
  BEFORE UPDATE ON public.employee_onboarding_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default GSG stages
INSERT INTO public.onboarding_stages (name, stage_order, description) VALUES
  ('Start-up Sprint', 1, 'Initial onboarding phase for new employees'),
  ('Acceleration', 2, 'Building momentum and learning core responsibilities'),
  ('Surge to Perform', 3, 'Reaching full productivity and performance'),
  ('Victory Stretch', 4, 'Achieving mastery and taking on advanced tasks'),
  ('Engagement', 5, 'Long-term engagement and continuous development');