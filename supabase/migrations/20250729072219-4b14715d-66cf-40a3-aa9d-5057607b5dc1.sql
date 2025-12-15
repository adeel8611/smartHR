-- Create function to ensure at least one admin exists
CREATE OR REPLACE FUNCTION public.ensure_admin_exists()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  admin_count integer;
BEGIN
  -- If this is an UPDATE and the role is being changed FROM admin
  IF TG_OP = 'UPDATE' AND OLD.role = 'admin' AND NEW.role != 'admin' THEN
    -- Count remaining admins (excluding the current record being updated)
    SELECT COUNT(*) INTO admin_count 
    FROM public.profiles 
    WHERE role = 'admin' AND id != NEW.id;
    
    -- If this would be the last admin, prevent the change
    IF admin_count = 0 THEN
      RAISE EXCEPTION 'Cannot change role: At least one admin must exist in the system';
    END IF;
  END IF;
  
  -- If this is a DELETE and the record being deleted is an admin
  IF TG_OP = 'DELETE' AND OLD.role = 'admin' THEN
    -- Count remaining admins (excluding the current record being deleted)
    SELECT COUNT(*) INTO admin_count 
    FROM public.profiles 
    WHERE role = 'admin' AND id != OLD.id;
    
    -- If this would remove the last admin, prevent the deletion
    IF admin_count = 0 THEN
      RAISE EXCEPTION 'Cannot delete user: At least one admin must exist in the system';
    END IF;
  END IF;
  
  -- Return the appropriate record based on operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

-- Create trigger to enforce admin constraint
CREATE OR REPLACE TRIGGER ensure_admin_exists_trigger
  BEFORE UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_admin_exists();