import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
    Calendar,
    Clock,
    Users,
    Video,
    CheckCircle,
    Loader2,
    Link as LinkIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { generateMeetingLink, type MeetingPlatform } from "@/lib/meetingLinks";
import { sendInterviewNotification, scheduleReminder, type Participant } from "@/lib/notifications";

interface Candidate {
    user_id: string;
    full_name: string;
    email: string;
}

interface Interviewer {
    user_id: string;
    full_name: string;
    email: string;
}

const InterviewSchedulingForm = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [interviewers, setInterviewers] = useState<Interviewer[]>([]);

    const [formData, setFormData] = useState({
        candidateId: '',
        interviewerIds: [] as string[],
        position: '',
        scheduledAt: '',
        duration: 60,
        meetingPlatform: 'google-meet' as MeetingPlatform
    });

    const [generatedLink, setGeneratedLink] = useState('');

    useEffect(() => {
        fetchCandidates();
        fetchInterviewers();
    }, []);

    const fetchCandidates = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('user_id, full_name, email')
            .eq('role', 'candidate')
            .order('full_name');

        if (!error && data) {
            setCandidates(data);
        }
    };

    const fetchInterviewers = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('user_id, full_name, email')
            .in('role', ['admin', 'staff'])
            .order('full_name');

        if (!error && data) {
            setInterviewers(data);
        }
    };

    const handleGenerateLink = async () => {
        if (!formData.scheduledAt || !formData.position) {
            toast({
                title: "Missing Information",
                description: "Please fill in position and schedule time first",
                variant: "destructive"
            });
            return;
        }

        const link = await generateMeetingLink(formData.meetingPlatform, {
            title: `Interview - ${formData.position}`,
            startTime: formData.scheduledAt,
            duration: formData.duration,
            participants: [] // Will be filled when submitting
        });

        setGeneratedLink(link);
        toast({
            title: "Meeting Link Generated",
            description: "Link has been created successfully"
        });
    };

    const handleInterviewerToggle = (interviewerId: string) => {
        setFormData(prev => ({
            ...prev,
            interviewerIds: prev.interviewerIds.includes(interviewerId)
                ? prev.interviewerIds.filter(id => id !== interviewerId)
                : [...prev.interviewerIds, interviewerId]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.candidateId || formData.interviewerIds.length === 0) {
            toast({
                title: "Invalid Form",
                description: "Please select a candidate and at least one interviewer",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);

        try {
            // Generate meeting link if not already generated
            const meetingLink = generatedLink || await generateMeetingLink(formData.meetingPlatform, {
                title: `Interview - ${formData.position}`,
                startTime: formData.scheduledAt,
                duration: formData.duration,
                participants: []
            });

            // Create interview
            const { data: interview, error: interviewError } = await supabase
                .from('interviews')
                .insert({
                    candidate_id: formData.candidateId,
                    position: formData.position,
                    scheduled_at: formData.scheduledAt,
                    duration_minutes: formData.duration,
                    meeting_link: meetingLink,
                    meeting_platform: formData.meetingPlatform,
                    status: 'scheduled'
                })
                .select()
                .single();

            if (interviewError) throw interviewError;

            // Add interviewers
            const interviewerRecords = formData.interviewerIds.map(interviewerId => ({
                interview_id: interview.id,
                interviewer_id: interviewerId
            }));

            const { error: interviewersError } = await supabase
                .from('interview_interviewers')
                .insert(interviewerRecords);

            if (interviewersError) throw interviewersError;

            // Get all participants for notifications
            const candidate = candidates.find(c => c.user_id === formData.candidateId);
            const selectedInterviewers = interviewers.filter(i =>
                formData.interviewerIds.includes(i.user_id)
            );

            const participants: Participant[] = [];

            if (candidate) {
                participants.push({
                    userId: candidate.user_id,
                    email: candidate.email,
                    name: candidate.full_name
                });
            }

            selectedInterviewers.forEach(interviewer => {
                participants.push({
                    userId: interviewer.user_id,
                    email: interviewer.email,
                    name: interviewer.full_name
                });
            });

            // Send notifications to all participants
            await sendInterviewNotification(interview, 'interview_scheduled', participants);

            // Schedule reminder for 5 minutes before
            await scheduleReminder(interview.id, interview.scheduled_at);

            toast({
                title: "Interview Scheduled Successfully! ✅",
                description: `All participants have been notified. Interview scheduled for ${new Date(formData.scheduledAt).toLocaleString()}`
            });

            // Reset form
            setFormData({
                candidateId: '',
                interviewerIds: [],
                position: '',
                scheduledAt: '',
                duration: 60,
                meetingPlatform: 'google-meet'
            });
            setGeneratedLink('');

        } catch (error) {
            console.error('Error scheduling interview:', error);
            toast({
                title: "Error",
                description: "Failed to schedule interview. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Schedule New Interview
                </CardTitle>
                <CardDescription>
                    Select candidate, interviewers, and schedule details
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Candidate Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="candidate">Candidate *</Label>
                        <select
                            id="candidate"
                            className="w-full p-2 border rounded-md bg-background"
                            value={formData.candidateId}
                            onChange={(e) => setFormData({ ...formData, candidateId: e.target.value })}
                            required
                        >
                            <option value="">Select a candidate...</option>
                            {candidates.map(candidate => (
                                <option key={candidate.user_id} value={candidate.user_id}>
                                    {candidate.full_name} ({candidate.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Position */}
                    <div className="space-y-2">
                        <Label htmlFor="position">Position/Role *</Label>
                        <Input
                            id="position"
                            type="text"
                            placeholder="e.g., Senior Frontend Developer"
                            value={formData.position}
                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                            required
                        />
                    </div>

                    {/* Interviewers Selection */}
                    <div className="space-y-2">
                        <Label>Interviewers * (Select one or more)</Label>
                        <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                            {interviewers.map(interviewer => (
                                <div key={interviewer.user_id} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id={`interviewer-${interviewer.user_id}`}
                                        checked={formData.interviewerIds.includes(interviewer.user_id)}
                                        onChange={() => handleInterviewerToggle(interviewer.user_id)}
                                        className="rounded"
                                    />
                                    <label
                                        htmlFor={`interviewer-${interviewer.user_id}`}
                                        className="flex-1 cursor-pointer"
                                    >
                                        {interviewer.full_name} ({interviewer.email})
                                    </label>
                                </div>
                            ))}
                        </div>
                        {formData.interviewerIds.length > 0 && (
                            <div className="flex gap-2 flex-wrap mt-2">
                                {formData.interviewerIds.map(id => {
                                    const interviewer = interviewers.find(i => i.user_id === id);
                                    return interviewer ? (
                                        <Badge key={id} variant="secondary">
                                            {interviewer.full_name}
                                        </Badge>
                                    ) : null;
                                })}
                            </div>
                        )}
                    </div>

                    {/* Date and Time */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="scheduledAt">Date & Time *</Label>
                            <Input
                                id="scheduledAt"
                                type="datetime-local"
                                value={formData.scheduledAt}
                                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="duration">Duration (minutes) *</Label>
                            <Input
                                id="duration"
                                type="number"
                                min="15"
                                step="15"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                required
                            />
                        </div>
                    </div>

                    {/* Meeting Platform */}
                    <div className="space-y-2">
                        <Label htmlFor="platform">Meeting Platform *</Label>
                        <select
                            id="platform"
                            className="w-full p-2 border rounded-md bg-background"
                            value={formData.meetingPlatform}
                            onChange={(e) => setFormData({ ...formData, meetingPlatform: e.target.value as MeetingPlatform })}
                        >
                            <option value="google-meet">Google Meet</option>
                            <option value="zoom">Zoom</option>
                            <option value="teams">Microsoft Teams</option>
                        </select>
                    </div>

                    {/* Meeting Link */}
                    <div className="space-y-2">
                        <Label>Meeting Link</Label>
                        {generatedLink ? (
                            <Alert className="border-success bg-success/10">
                                <CheckCircle className="h-4 w-4" />
                                <AlertDescription>
                                    <div className="space-y-1">
                                        <p className="font-medium">Meeting link generated!</p>
                                        <a
                                            href={generatedLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-primary hover:underline break-all"
                                        >
                                            {generatedLink}
                                        </a>
                                    </div>
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleGenerateLink}
                                className="w-full"
                            >
                                <LinkIcon className="h-4 w-4 mr-2" />
                                Generate Meeting Link
                            </Button>
                        )}
                        <p className="text-xs text-muted-foreground">
                            A meeting link will be auto-generated if not created manually
                        </p>
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3">
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={loading}
                            size="lg"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Scheduling...
                                </>
                            ) : (
                                <>
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Schedule Interview
                                </>
                            )}
                        </Button>
                    </div>

                    <Alert>
                        <Users className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                            All selected participants (candidate + interviewers) will receive an immediate notification
                            with the meeting link. A reminder will be sent 5 minutes before the interview starts.
                        </AlertDescription>
                    </Alert>
                </form>
            </CardContent>
        </Card>
    );
};

export default InterviewSchedulingForm;
