-- Fix infinite recursion in meeting_participants RLS policy
-- The issue is that the policy is likely referencing the same table it's applied to

-- Drop the problematic policy that's causing infinite recursion
DROP POLICY IF EXISTS "Users can view meeting participants" ON public.meeting_participants;

-- Create a new policy that uses the get_user_role function to avoid recursion
CREATE POLICY "Users can view meeting participants" 
ON public.meeting_participants 
FOR SELECT 
USING (
  -- Users can see participants if they are participants themselves OR if they are admin
  (user_id = auth.uid()) OR 
  (get_user_role(auth.uid()) = 'admin'::user_role) OR
  -- Users can see other participants in meetings they're also part of
  (meeting_id IN (
    SELECT mp.meeting_id 
    FROM public.meeting_participants mp 
    WHERE mp.user_id = auth.uid()
  ))
);