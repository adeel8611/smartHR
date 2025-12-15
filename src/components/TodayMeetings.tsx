import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, Users, Video, ExternalLink } from "lucide-react";

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  platform: string | null;
  meeting_url: string | null;
  status: string | null;
}

const TodayMeetings = () => {
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodayMeetings();
  }, []);

  const fetchTodayMeetings = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get meetings where user is a participant or created by user
      const { data: participantMeetings, error: participantError } = await supabase
        .from('meeting_participants')
        .select(`
          meeting_id,
          meetings!inner (
            id,
            title,
            description,
            scheduled_at,
            duration_minutes,
            platform,
            meeting_url,
            status
          )
        `)
        .eq('user_id', user.id);

      if (participantError) throw participantError;

      // Get meetings created by user
      const { data: createdMeetings, error: createdError } = await supabase
        .from('meetings')
        .select('*')
        .eq('created_by', user.id)
        .gte('scheduled_at', startOfDay)
        .lte('scheduled_at', endOfDay)
        .order('scheduled_at', { ascending: true });

      if (createdError) throw createdError;

      // Combine and deduplicate meetings
      const allMeetings = [
        ...(createdMeetings || []),
        ...(participantMeetings?.map(p => (p as any).meetings) || [])
      ];

      // Remove duplicates and filter for today
      const uniqueMeetings = allMeetings
        .filter((meeting, index, self) => 
          self.findIndex(m => m.id === meeting.id) === index
        )
        .filter(meeting => {
          const meetingDate = new Date(meeting.scheduled_at);
          return meetingDate >= new Date(startOfDay) && meetingDate <= new Date(endOfDay);
        })
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

      setMeetings(uniqueMeetings);
    } catch (error) {
      console.error('Error fetching today\'s meetings:', error);
      toast({
        title: "Error",
        description: "Failed to load today's meetings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string | null, scheduledAt: string) => {
    const now = new Date();
    const meetingTime = new Date(scheduledAt);
    const endTime = new Date(meetingTime.getTime() + 60 * 60 * 1000); // Assuming 1 hour duration

    if (status === 'completed') return 'secondary';
    if (now >= meetingTime && now <= endTime) return 'default';
    if (now > endTime) return 'secondary';
    return 'outline';
  };

  const getMeetingStatus = (scheduledAt: string, durationMinutes: number) => {
    const now = new Date();
    const meetingTime = new Date(scheduledAt);
    const endTime = new Date(meetingTime.getTime() + durationMinutes * 60 * 1000);

    if (now >= meetingTime && now <= endTime) return 'Ongoing';
    if (now > endTime) return 'Completed';
    if (meetingTime.getTime() - now.getTime() <= 15 * 60 * 1000) return 'Starting Soon';
    return 'Scheduled';
  };

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Today's Meetings
        </CardTitle>
        <CardDescription>
          Your meetings and appointments for today
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {meetings.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No meetings scheduled for today</p>
          </div>
        ) : (
          meetings.map((meeting) => (
            <div key={meeting.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{meeting.title}</p>
                  <Badge variant={getStatusColor(meeting.status, meeting.scheduled_at)}>
                    {getMeetingStatus(meeting.scheduled_at, meeting.duration_minutes)}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(meeting.scheduled_at)}</span>
                  </div>
                  <span>{meeting.duration_minutes} min</span>
                  <div className="flex items-center gap-1">
                    <Video className="h-3 w-3" />
                    <span>{meeting.platform || 'Google Meet'}</span>
                  </div>
                </div>
                {meeting.description && (
                  <p className="text-xs text-muted-foreground">{meeting.description}</p>
                )}
              </div>
              {meeting.meeting_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(meeting.meeting_url!, '_blank')}
                  className="ml-2"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Join
                </Button>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default TodayMeetings;