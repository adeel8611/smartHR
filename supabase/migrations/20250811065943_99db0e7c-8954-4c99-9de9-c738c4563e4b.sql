-- Fix the security warning by setting search_path for the function
CREATE OR REPLACE FUNCTION public.create_initial_leave_balance()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.leave_balances (employee_id, year)
  VALUES (NEW.user_id, EXTRACT(YEAR FROM CURRENT_DATE))
  ON CONFLICT (employee_id) DO NOTHING;
  RETURN NEW;
END;
$$;