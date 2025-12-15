-- Create triggers to ensure at least one admin always exists
-- The function already exists, we just need to create the triggers

-- Trigger for UPDATE operations (when changing roles)
CREATE TRIGGER ensure_admin_exists_on_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_admin_exists();

-- Trigger for DELETE operations (when deleting admin users)
CREATE TRIGGER ensure_admin_exists_on_delete
  BEFORE DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_admin_exists();

-- Also ensure there's at least one admin when the system starts
-- Insert a default admin if no admins exist
DO $$
DECLARE
  admin_count integer;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';
  
  -- If no admin exists, we'll rely on the first user signup to be an admin
  -- The system will guide users to create an admin account first
  IF admin_count = 0 THEN
    -- Log that no admin exists yet
    RAISE NOTICE 'No admin users found. The first user to sign up should be assigned admin role.';
  END IF;
END $$;