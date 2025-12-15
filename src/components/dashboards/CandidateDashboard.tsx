import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ResumeUpload } from "@/components/ResumeUpload";
import { ResumeAnalysis } from "@/components/ResumeAnalysis";
import { 
  Video, 
  Clock, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Camera,
  Mic,
  Monitor,
  MapPin,
  User
} from "lucide-react";
import CameraTest from "@/components/CameraTest";

interface Position {
  id: string;
  title: string;
  department: string | null;
  description: string | null;
  experience_level: string | null;
}

interface Question {
  id: string;
  question: string;
  question_type: string;
  time_limit_seconds: number;
  question_order: number;
}

const CandidateDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [userResume, setUserResume] = useState<any>(null);

  const fetchUserResume = async () => {
    if (!user || !selectedPosition) return;
    
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('candidate_id', user.id)
      .eq('position_id', selectedPosition)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching resume:', error);
      return;
    }
    
    setUserResume(data);
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  useEffect(() => {
    if (selectedPosition && user) {
      fetchUserResume();
    }
  }, [selectedPosition, user]);

  useEffect(() => {
    if (selectedPosition) {
      fetchQuestions(selectedPosition);
    }
  }, [selectedPosition]);

  const fetchPositions = async () => {
    try {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .eq('status', 'active')
        .order('title');

      if (error) throw error;
      setPositions(data || []);
    } catch (error) {
      console.error('Error fetching positions:', error);
      toast({
        title: "Error",
        description: "Failed to load available positions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (positionId: string) => {
    try {
      const { data, error } = await supabase
        .from('question_templates')
        .select('*')
        .eq('position_id', positionId)
        .order('question_order');

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: "Error",
        description: "Failed to load interview questions",
        variant: "destructive",
      });
    }
  };

  const selectedPositionData = positions.find(p => p.id === selectedPosition);

  const interviewDetails = {
    position: selectedPositionData?.title || "Please select a position",
    interviewer: "HR Team",
    scheduledTime: "Available upon selection",
    duration: "60 minutes",
    status: selectedPosition ? "ready" : "pending",
  };

  const requirements = [
    { item: "Stable internet connection", status: "good" },
    { item: "Camera access", status: "good" },
    { item: "Microphone access", status: "good" },
    { item: "Browser compatibility", status: "good" },
    { item: "Quiet environment", status: "pending" },
  ];

  const instructions = [
    "Ensure you are in a quiet, well-lit room",
    "Test your camera and microphone before starting",
    "Keep your browser tab active during the interview",
    "Do not switch to other applications during the session",
    "Answer questions clearly and concisely",
    "Take your time to think before answering",
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="h-4 bg-muted rounded w-48"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">Interview Application</h1>
        <p className="text-muted-foreground">Select a position and prepare for your interview</p>
      </div>

      {/* Position Selection */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Select Position
          </CardTitle>
          <CardDescription>
            Choose the position you'd like to apply for
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="position">Available Positions</Label>
            <Select value={selectedPosition} onValueChange={setSelectedPosition}>
              <SelectTrigger>
                <SelectValue placeholder="Select a position to apply for..." />
              </SelectTrigger>
              <SelectContent>
                {positions.map((position) => (
                  <SelectItem key={position.id} value={position.id}>
                    <div className="text-left">
                      <div className="font-medium">{position.title}</div>
                      {position.department && (
                        <div className="text-xs text-muted-foreground">{position.department}</div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedPositionData && (
            <div className="p-4 bg-muted/30 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{selectedPositionData.title}</h4>
                {selectedPositionData.experience_level && (
                  <Badge variant="secondary">{selectedPositionData.experience_level}</Badge>
                )}
              </div>
              {selectedPositionData.department && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {selectedPositionData.department}
                </div>
              )}
              {selectedPositionData.description && (
                <p className="text-sm text-muted-foreground">{selectedPositionData.description}</p>
              )}
              {questions.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  <strong>{questions.length}</strong> interview questions prepared
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resume Upload Section */}
      {selectedPosition && user && (
        <ResumeUpload
          candidateId={user.id}
          positionId={selectedPosition}
          onUploadComplete={(resumeId) => {
            fetchUserResume();
          }}
          existingResume={userResume}
        />
      )}

      {/* Resume Analysis */}
      {userResume?.ai_analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Resume Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ResumeAnalysis analysis={userResume.ai_analysis} />
          </CardContent>
        </Card>
      )}

      {/* Interview Details */}
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mb-4">
            <Video className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-xl">{interviewDetails.position}</CardTitle>
          <CardDescription className="text-base">
            {interviewDetails.interviewer}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>{interviewDetails.scheduledTime}</span>
            </div>
            <Badge variant="secondary">{interviewDetails.duration}</Badge>
          </div>
          
          <div className="text-center">
            <Button 
              variant="gradient" 
              size="lg" 
              className="shadow-lg"
              disabled={!selectedPosition}
            >
              <Video className="h-5 w-5 mr-2" />
              {selectedPosition ? "Start Interview" : "Select Position First"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Check */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            System Check
          </CardTitle>
          <CardDescription>
            Verify your setup before starting the interview
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {requirements.map((req, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-sm">{req.item}</span>
              <div className={`w-3 h-3 rounded-full ${
                req.status === 'good' ? 'bg-success' :
                req.status === 'warning' ? 'bg-warning' : 'bg-destructive'
              }`} />
            </div>
          ))}
          <Button variant="outline" className="w-full mt-4">
            <Monitor className="h-4 w-4 mr-2" />
            Run System Test
          </Button>
        </CardContent>
      </Card>

      {/* Important Alerts */}
      <Alert className="border-warning bg-warning/10">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Tab switching during the interview will be monitored. 
          Screenshots will be captured if you navigate away from this page.
        </AlertDescription>
      </Alert>

      {/* Interview Questions Preview */}
      {selectedPosition && questions.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Interview Questions Preview
            </CardTitle>
            <CardDescription>
              Questions you'll be asked during the interview for {selectedPositionData?.title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={question.id} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Question {index + 1}</Badge>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {Math.floor(question.time_limit_seconds / 60)} min
                      <Badge variant="secondary" className="text-xs">
                        {question.question_type}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm">{question.question}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Interview Instructions
          </CardTitle>
          <CardDescription>
            Please read carefully before starting your interview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {instructions.map((instruction, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <p className="text-sm">{instruction}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Camera & Mic Test */}
      <CameraTest />
    </div>
  );
};

export default CandidateDashboard;