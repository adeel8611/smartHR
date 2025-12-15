import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, Users, Video, Plus, Edit, Trash2, ExternalLink } from "lucide-react";

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  platform: string | null;
  meeting_url: string | null;
  status: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
}

const MeetingManagement = () => {
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduled_at: '',
    duration_minutes: 60,
    platform: 'google-meet',
    meeting_url: ''
  });

  useEffect(() => {
    fetchMeetings();
    fetchProfiles();
  }, []);

  const fetchMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      setMeetings(data || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      toast({
        title: "Error",
        description: "Failed to load meetings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, email')
        .order('full_name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const generateGoogleMeetLink = () => {
    // Generate a random Google Meet-style URL
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const randomString = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `https://meet.google.com/${randomString.slice(0, 3)}-${randomString.slice(3, 7)}-${randomString.slice(7)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('Starting meeting creation...');
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user);
      
      if (!user) throw new Error('Not authenticated');

      let meeting_url = formData.meeting_url;
      if (!meeting_url && formData.platform === 'google-meet') {
        meeting_url = generateGoogleMeetLink();
      }

      const meetingData = {
        ...formData,
        meeting_url,
        created_by: user.id,
        status: 'scheduled'
      };

      console.log('Meeting data to insert:', meetingData);

      if (editingMeeting) {
        console.log('Updating existing meeting...');
        const { error } = await supabase
          .from('meetings')
          .update(meetingData)
          .eq('id', editingMeeting.id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        
        toast({
          title: "Success",
          description: "Meeting updated successfully",
        });
      } else {
        console.log('Creating new meeting...');
        const { data: newMeeting, error } = await supabase
          .from('meetings')
          .insert([meetingData])
          .select()
          .single();

        console.log('Insert result:', { newMeeting, error });

        if (error) {
          console.error('Insert error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }

        // Add participants
        if (selectedParticipants.length > 0 && newMeeting) {
          console.log('Adding participants:', selectedParticipants);
          const participantData = selectedParticipants.map(userId => ({
            meeting_id: newMeeting.id,
            user_id: userId,
            role: 'participant'
          }));

          const { error: participantError } = await supabase
            .from('meeting_participants')
            .insert(participantData);

          if (participantError) {
            console.error('Participant insert error:', participantError);
          }
        }

        toast({
          title: "Success",
          description: "Meeting created successfully",
        });
      }

      fetchMeetings();
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving meeting:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Error",
        description: `Failed to save meeting: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setFormData({
      title: meeting.title,
      description: meeting.description || '',
      scheduled_at: new Date(meeting.scheduled_at).toISOString().slice(0, 16),
      duration_minutes: meeting.duration_minutes,
      platform: meeting.platform || 'google-meet',
      meeting_url: meeting.meeting_url || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (meetingId: string) => {
    if (!confirm('Are you sure you want to delete this meeting?')) return;

    try {
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meetingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Meeting deleted successfully",
      });
      
      fetchMeetings();
    } catch (error) {
      console.error('Error deleting meeting:', error);
      toast({
        title: "Error",
        description: "Failed to delete meeting",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      scheduled_at: '',
      duration_minutes: 60,
      platform: 'google-meet',
      meeting_url: ''
    });
    setEditingMeeting(null);
    setSelectedParticipants([]);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'ongoing': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  if (loading) {
    return <div>Loading meetings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Meeting Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingMeeting ? 'Edit Meeting' : 'Create New Meeting'}
              </DialogTitle>
              <DialogDescription>
                {editingMeeting ? 'Update meeting details' : 'Schedule a new meeting with participants'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Meeting Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Team standup, Project review..."
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="scheduled_at">Date & Time</Label>
                  <Input
                    id="scheduled_at"
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduled_at: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Meeting agenda and details..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
                    min="15"
                    max="480"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Select
                    value={formData.platform}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google-meet">Google Meet</SelectItem>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="teams">Microsoft Teams</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meeting_url">Meeting URL (optional)</Label>
                <Input
                  id="meeting_url"
                  value={formData.meeting_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, meeting_url: e.target.value }))}
                  placeholder="Auto-generated for Google Meet if empty"
                />
              </div>

              {!editingMeeting && (
                <div className="space-y-2">
                  <Label>Participants</Label>
                  <div className="max-h-32 overflow-y-auto border rounded-md p-2">
                    {profiles.map((profile) => (
                      <div key={profile.user_id} className="flex items-center space-x-2 p-1">
                        <input
                          type="checkbox"
                          id={profile.user_id}
                          checked={selectedParticipants.includes(profile.user_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedParticipants(prev => [...prev, profile.user_id]);
                            } else {
                              setSelectedParticipants(prev => prev.filter(id => id !== profile.user_id));
                            }
                          }}
                        />
                        <label htmlFor={profile.user_id} className="text-sm">
                          {profile.full_name} ({profile.email})
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingMeeting ? 'Update Meeting' : 'Create Meeting'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {meetings.map((meeting) => (
          <Card key={meeting.id} className="shadow-sm">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{meeting.title}</h3>
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(meeting.status)}`} />
                    <Badge variant="secondary">
                      {meeting.status || 'scheduled'}
                    </Badge>
                  </div>
                  
                  {meeting.description && (
                    <p className="text-muted-foreground text-sm">{meeting.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDateTime(meeting.scheduled_at)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {meeting.duration_minutes} min
                    </div>
                    <div className="flex items-center gap-1">
                      <Video className="h-4 w-4" />
                      {meeting.platform || 'Google Meet'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {meeting.meeting_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(meeting.meeting_url!, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Join
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(meeting)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(meeting.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {meetings.length === 0 && (
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No meetings scheduled</h3>
                <p className="text-sm text-muted-foreground">Create your first meeting to get started</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MeetingManagement;