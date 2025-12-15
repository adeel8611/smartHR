import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Video,
  Camera,
  Play,
  Square,
  Users,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Eye
} from "lucide-react";
import CameraTest from "@/components/CameraTest";
import { ResumeAnalysis } from "@/components/ResumeAnalysis";
import InterviewSchedulingForm from "@/components/InterviewSchedulingForm";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Interview {
  id: string;
  position: string;
  candidate_id: string;
  scheduled_at: string;
  status: string;
  duration_minutes: number;
  score?: number;
  notes?: string;
}

const InterviewManagement = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("conduct");
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [currentInterview, setCurrentInterview] = useState<Interview | null>(null);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .order('scheduled_at', { ascending: true });

    if (!error && data) {
      setInterviews(data);
    }
  };

  const startInterview = () => {
    setInterviewStarted(true);
    setIsRecording(true);
  };

  const endInterview = () => {
    setInterviewStarted(false);
    setIsRecording(false);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-primary';
      case 'in_progress':
        return 'bg-warning';
      case 'completed':
        return 'bg-success';
      case 'cancelled':
        return 'bg-destructive';
      default:
        return 'bg-muted';
    }
  };

  if (profile?.role === 'candidate') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Interview Session</h1>
            <p className="text-muted-foreground">Prepare and take your interview</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                Interview Session
              </CardTitle>
              <CardDescription>
                Your scheduled interview details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30">
                <h3 className="font-semibold mb-2">Frontend Developer Position</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>📅 Today, 2:00 PM - 3:00 PM</p>
                  <p>👥 Interviewer: HR Team</p>
                  <p>⏱️ Duration: 60 minutes</p>
                </div>
              </div>

              {!interviewStarted ? (
                <div className="space-y-3">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Please complete the camera and microphone test before starting the interview.
                    </AlertDescription>
                  </Alert>
                  <Button
                    onClick={startInterview}
                    className="w-full"
                    size="lg"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Interview
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Alert className="border-success bg-success/10">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Interview is in progress. Recording started.
                    </AlertDescription>
                  </Alert>
                  <Button
                    onClick={endInterview}
                    variant="destructive"
                    className="w-full"
                    size="lg"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    End Interview
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <CameraTest />
        </div>

        {interviewStarted && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Interview Questions</CardTitle>
              <CardDescription>
                Answer each question to the best of your ability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg border">
                  <h3 className="font-semibold mb-2">Question 1 of 5</h3>
                  <p className="text-foreground">
                    Tell us about your experience with React and modern JavaScript frameworks.
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Time limit: 5 minutes
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Interview Management</h1>
          <p className="text-muted-foreground">Conduct and manage interviews with proctoring</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="conduct">Conduct</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-6">
          <InterviewSchedulingForm />
        </TabsContent>

        <TabsContent value="conduct" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  Live Interview
                </CardTitle>
                <CardDescription>
                  Current interview session controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/30">
                  <h3 className="font-semibold mb-2">Frontend Developer Interview</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>👤 Candidate: John Doe</p>
                    <p>⏱️ Duration: 45 minutes remaining</p>
                    <p>📊 Progress: 3/5 questions answered</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1">
                    <Eye className="h-4 w-4 mr-2" />
                    Monitor
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Square className="h-4 w-4 mr-2" />
                    End
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Proctoring Alerts</CardTitle>
                <CardDescription>
                  Real-time monitoring alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Alert className="border-warning bg-warning/10">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Tab switch detected at 2:34 PM
                    </AlertDescription>
                  </Alert>
                  <Alert className="border-success bg-success/10">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Camera and audio verified
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          <div className="grid gap-4">
            {interviews.filter(i => i.status === 'scheduled').map((interview) => (
              <Card key={interview.id} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{interview.position}</h3>
                      <p className="text-sm text-muted-foreground">
                        📅 {formatDateTime(interview.scheduled_at)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ⏱️ {interview.duration_minutes} minutes
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(interview.status)}>
                        {interview.status}
                      </Badge>
                      <Button size="sm">
                        Start
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          <div className="grid gap-4">
            {interviews.filter(i => i.status === 'completed').map((interview) => (
              <Card key={interview.id} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{interview.position}</h3>
                      <p className="text-sm text-muted-foreground">
                        📅 {formatDateTime(interview.scheduled_at)}
                      </p>
                      {interview.score && (
                        <p className="text-sm font-medium text-primary">
                          Score: {interview.score}/100
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(interview.status)}>
                        Completed
                      </Badge>
                      <Button size="sm" variant="outline">
                        Review
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Interviews</span>
                    <span className="font-semibold">24</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Completed</span>
                    <span className="font-semibold text-success">18</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Scheduled</span>
                    <span className="font-semibold text-primary">6</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Average Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">78%</div>
                  <div className="text-sm text-muted-foreground">Overall Average</div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Proctoring Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Tab Switches</span>
                    <span className="font-semibold text-warning">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Camera Issues</span>
                    <span className="font-semibold text-destructive">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Clean Sessions</span>
                    <span className="font-semibold text-success">15</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InterviewManagement;