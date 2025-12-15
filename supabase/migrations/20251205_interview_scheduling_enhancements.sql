-- Enhanced Interview Scheduling Migration
-- Adds support for multiple interviewers, meeting links, and notifications

-- Add meeting link and platform to interviews table
ALTER TABLE public.interviews
  ADD COLUMN IF NOT EXISTS meeting_link TEXT,
  ADD COLUMN IF NOT EXISTS meeting_platform TEXT CHECK (meeting_platform IN ('google-meet', 'zoom', 'teams'));

-- Create interview interviewers join table for multiple interviewers per interview
CREATE TABLE IF NOT EXISTS public.interview_interviewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID REFERENCES public.interviews(id) ON DELETE CASCADE NOT NULL,
  interviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(interview_id, interviewer_id)
);

-- Create notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  interview_id UUID REFERENCES public.interviews(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('interview_scheduled', 'interview_reminder', 'interview_rescheduled', 'interview_cancelled')) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create notification schedule for managing reminders
CREATE TABLE IF NOT EXISTS public.notification_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID REFERENCES public.interviews(id) ON DELETE CASCADE NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  type TEXT NOT NULL DEFAULT 'reminder',
  status TEXT CHECK (status IN ('pending', 'sent', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security on new tables
ALTER TABLE public.interview_interviewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_schedule ENABLE ROW LEVEL SECURITY;

-- RLS Policies for interview_interviewers
DROP POLICY IF EXISTS "Users can view own interview assignments" ON public.interview_interviewers;
CREATE POLICY "Users can view own interview assignments" 
  ON public.interview_interviewers FOR SELECT 
  USING (auth.uid() = interviewer_id OR public.get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admins can manage interview interviewers" ON public.interview_interviewers;
CREATE POLICY "Admins can manage interview interviewers" 
  ON public.interview_interviewers FOR ALL 
  USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" 
  ON public.notifications FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can mark notifications as read" ON public.notifications;
CREATE POLICY "Users can mark notifications as read" 
  ON public.notifications FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "System can create notifications" 
  ON public.notifications FOR INSERT 
  WITH CHECK (true);

-- RLS Policies for notification_schedule
DROP POLICY IF EXISTS "Admins can view notification schedule" ON public.notification_schedule;
CREATE POLICY "Admins can view notification schedule" 
  ON public.notification_schedule FOR SELECT 
  USING (public.get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admins can manage notification schedule" ON public.notification_schedule;
CREATE POLICY "Admins can manage notification schedule" 
  ON public.notification_schedule FOR ALL 
  USING (public.get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "System can create scheduled notifications" ON public.notification_schedule;
CREATE POLICY "System can create scheduled notifications" 
  ON public.notification_schedule FOR INSERT 
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_interview_interviewers_interview_id ON public.interview_interviewers(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_interviewers_interviewer_id ON public.interview_interviewers(interviewer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_interview_id ON public.notifications(interview_id);
CREATE INDEX IF NOT EXISTS idx_notification_schedule_interview_id ON public.notification_schedule(interview_id);
CREATE INDEX IF NOT EXISTS idx_notification_schedule_status ON public.notification_schedule(status);
