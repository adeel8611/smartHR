-- Add work location tracking to attendance table
ALTER TABLE public.attendance 
ADD COLUMN work_location TEXT DEFAULT 'office' CHECK (work_location IN ('office', 'home', 'remote'));

-- Add approved_by column to track who approved remote work
ALTER TABLE public.attendance 
ADD COLUMN approved_by UUID;

-- Create work_location_settings table for managing employee work arrangements
CREATE TABLE public.work_location_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL UNIQUE,
  default_location TEXT NOT NULL DEFAULT 'office' CHECK (default_location IN ('office', 'home', 'remote')),
  can_work_remotely BOOLEAN NOT NULL DEFAULT false,
  remote_days_per_week INTEGER DEFAULT 0 CHECK (remote_days_per_week >= 0 AND remote_days_per_week <= 5),
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.work_location_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for work location settings
CREATE POLICY "Employees can view their own location settings" 
ON public.work_location_settings 
FOR SELECT 
USING (auth.uid() = employee_id);

CREATE POLICY "Admins can manage all location settings" 
ON public.work_location_settings 
FOR ALL
USING (get_user_role(auth.uid()) = 'admin');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_work_location_settings_updated_at
BEFORE UPDATE ON public.work_location_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate working hours between check-in and check-out
CREATE OR REPLACE FUNCTION public.calculate_working_hours(
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE
) RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF check_in_time IS NULL OR check_out_time IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calculate hours difference, cap at 12 hours max per day
  RETURN LEAST(
    EXTRACT(EPOCH FROM (check_out_time - check_in_time)) / 3600,
    12
  );
END;
$$;

-- Update existing attendance records to set default work location
UPDATE public.attendance 
SET work_location = 'office' 
WHERE work_location IS NULL;