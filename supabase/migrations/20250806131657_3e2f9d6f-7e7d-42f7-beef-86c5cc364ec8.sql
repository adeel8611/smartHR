-- Create leave_requests table for managing employee leave applications
CREATE TABLE public.leave_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'personal', 'maternity', 'paternity', 'emergency')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT positive_days CHECK (total_days > 0)
);

-- Enable Row Level Security
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for leave requests
CREATE POLICY "Employees can view their own leave requests" 
ON public.leave_requests 
FOR SELECT 
USING (auth.uid() = employee_id);

CREATE POLICY "Employees can create their own leave requests" 
ON public.leave_requests 
FOR INSERT 
WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Employees can update their pending leave requests" 
ON public.leave_requests 
FOR UPDATE 
USING (auth.uid() = employee_id AND status = 'pending');

CREATE POLICY "Admins can view all leave requests" 
ON public.leave_requests 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update leave request status" 
ON public.leave_requests 
FOR UPDATE 
USING (get_user_role(auth.uid()) = 'admin');

-- Create leave_balances table to track remaining leave days
CREATE TABLE public.leave_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL UNIQUE,
  annual_days_total INTEGER NOT NULL DEFAULT 30,
  annual_days_used INTEGER NOT NULL DEFAULT 0,
  sick_days_total INTEGER NOT NULL DEFAULT 15,
  sick_days_used INTEGER NOT NULL DEFAULT 0,
  personal_days_total INTEGER NOT NULL DEFAULT 5,
  personal_days_used INTEGER NOT NULL DEFAULT 0,
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT non_negative_totals CHECK (
    annual_days_total >= 0 AND sick_days_total >= 0 AND personal_days_total >= 0
  ),
  CONSTRAINT non_negative_used CHECK (
    annual_days_used >= 0 AND sick_days_used >= 0 AND personal_days_used >= 0
  ),
  CONSTRAINT valid_usage CHECK (
    annual_days_used <= annual_days_total AND 
    sick_days_used <= sick_days_total AND 
    personal_days_used <= personal_days_total
  )
);

-- Enable Row Level Security for leave balances
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;

-- Create policies for leave balances
CREATE POLICY "Employees can view their own leave balance" 
ON public.leave_balances 
FOR SELECT 
USING (auth.uid() = employee_id);

CREATE POLICY "Admins can view all leave balances" 
ON public.leave_balances 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can manage leave balances" 
ON public.leave_balances 
FOR ALL
USING (get_user_role(auth.uid()) = 'admin');

-- Create trigger for automatic timestamp updates on leave_requests
CREATE TRIGGER update_leave_requests_updated_at
BEFORE UPDATE ON public.leave_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for automatic timestamp updates on leave_balances
CREATE TRIGGER update_leave_balances_updated_at
BEFORE UPDATE ON public.leave_balances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically create leave balance when a new profile is created
CREATE OR REPLACE FUNCTION public.create_initial_leave_balance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.leave_balances (employee_id, year)
  VALUES (NEW.user_id, EXTRACT(YEAR FROM CURRENT_DATE))
  ON CONFLICT (employee_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create leave balance for new employees
CREATE TRIGGER create_leave_balance_for_new_employee
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_initial_leave_balance();