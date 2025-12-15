import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { 
  Plus, 
  Edit, 
  Trash2, 
  HelpCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Position {
  id: string;
  title: string;
}

interface QuestionTemplate {
  id: string;
  position_id: string;
  question: string;
  question_type: string;
  time_limit_seconds: number;
  question_order: number;
}

interface QuestionManagementProps {
  selectedPositionId?: string;
}

const QuestionManagement = ({ selectedPositionId }: QuestionManagementProps) => {
  const { toast } = useToast();
  const [positions, setPositions] = useState<Position[]>([]);
  const [questions, setQuestions] = useState<QuestionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionTemplate | null>(null);
  const [currentPositionId, setCurrentPositionId] = useState(selectedPositionId || '');
  const [formData, setFormData] = useState({
    question: '',
    question_type: 'text',
    time_limit_seconds: 300
  });

  useEffect(() => {
    fetchPositions();
  }, []);

  useEffect(() => {
    if (currentPositionId) {
      fetchQuestions();
    }
  }, [currentPositionId]);

  const fetchPositions = async () => {
    try {
      const { data, error } = await supabase
        .from('positions')
        .select('id, title')
        .eq('status', 'active')
        .order('title');

      if (error) throw error;
      setPositions(data || []);
      
      if (data && data.length > 0 && !currentPositionId) {
        setCurrentPositionId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    if (!currentPositionId) return;

    try {
      const { data, error } = await supabase
        .from('question_templates')
        .select('*')
        .eq('position_id', currentPositionId)
        .order('question_order');

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch questions.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPositionId) {
      toast({
        title: "Error",
        description: "Please select a position first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const nextOrder = editingQuestion 
        ? editingQuestion.question_order 
        : (questions.length > 0 ? Math.max(...questions.map(q => q.question_order)) + 1 : 1);

      if (editingQuestion) {
        const { error } = await supabase
          .from('question_templates')
          .update({
            ...formData,
            question_order: nextOrder
          })
          .eq('id', editingQuestion.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Question updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('question_templates')
          .insert({
            ...formData,
            position_id: currentPositionId,
            question_order: nextOrder
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Question added successfully.",
        });
      }

      await fetchQuestions();
      resetForm();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving question:', error);
      toast({
        title: "Error",
        description: "Failed to save question.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('question_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question deleted successfully.",
      });

      await fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: "Error",
        description: "Failed to delete question.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (question: QuestionTemplate) => {
    setEditingQuestion(question);
    setFormData({
      question: question.question,
      question_type: question.question_type,
      time_limit_seconds: question.time_limit_seconds
    });
    setDialogOpen(true);
  };

  const moveQuestion = async (questionId: string, direction: 'up' | 'down') => {
    const currentIndex = questions.findIndex(q => q.id === questionId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;

    try {
      const updatedQuestions = [...questions];
      [updatedQuestions[currentIndex], updatedQuestions[newIndex]] = [updatedQuestions[newIndex], updatedQuestions[currentIndex]];

      // Update order in database
      for (let i = 0; i < updatedQuestions.length; i++) {
        await supabase
          .from('question_templates')
          .update({ question_order: i + 1 })
          .eq('id', updatedQuestions[i].id);
      }

      await fetchQuestions();
    } catch (error) {
      console.error('Error reordering questions:', error);
      toast({
        title: "Error",
        description: "Failed to reorder questions.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingQuestion(null);
    setFormData({
      question: '',
      question_type: 'text',
      time_limit_seconds: 300
    });
  };

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case 'text': return 'bg-blue-500';
      case 'video': return 'bg-green-500';
      case 'code': return 'bg-purple-500';
      default: return 'bg-muted';
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Question Management</h2>
          <p className="text-muted-foreground">Manage interview questions for each position</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} disabled={!currentPositionId}>
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </DialogTitle>
              <DialogDescription>
                {editingQuestion ? 'Update the question details.' : 'Add a new interview question.'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question">Question</Label>
                <Textarea
                  id="question"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Enter your interview question..."
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="question_type">Question Type</Label>
                <Select value={formData.question_type} onValueChange={(value) => setFormData({ ...formData, question_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text Response</SelectItem>
                    <SelectItem value="video">Video Response</SelectItem>
                    <SelectItem value="code">Code Challenge</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time_limit">Time Limit (seconds)</Label>
                <Input
                  id="time_limit"
                  type="number"
                  value={formData.time_limit_seconds}
                  onChange={(e) => setFormData({ ...formData, time_limit_seconds: parseInt(e.target.value) || 300 })}
                  min={30}
                  max={1800}
                />
                <p className="text-xs text-muted-foreground">
                  {formatTime(formData.time_limit_seconds)} to answer
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingQuestion ? 'Update' : 'Add'} Question
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Position Selector */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Select Position</CardTitle>
          <CardDescription>Choose a position to manage its interview questions</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={currentPositionId} onValueChange={setCurrentPositionId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a position..." />
            </SelectTrigger>
            <SelectContent>
              {positions.map((position) => (
                <SelectItem key={position.id} value={position.id}>
                  {position.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Questions List */}
      {currentPositionId && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Interview Questions ({questions.length})
            </CardTitle>
            <CardDescription>
              Questions for {positions.find(p => p.id === currentPositionId)?.title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No questions added yet. Click "Add Question" to create the first interview question for this position.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div key={question.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-muted-foreground">
                            Question {index + 1}
                          </span>
                          <Badge className={`text-white ${getQuestionTypeColor(question.question_type)}`}>
                            {question.question_type}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(question.time_limit_seconds)}
                          </Badge>
                        </div>
                        <p className="text-sm">{question.question}</p>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveQuestion(question.id, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveQuestion(question.id, 'down')}
                          disabled={index === questions.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(question)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(question.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuestionManagement;