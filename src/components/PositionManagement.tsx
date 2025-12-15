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
  Briefcase,
  Users,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Position {
  id: string;
  title: string;
  description: string;
  department: string;
  experience_level: string;
  status: string;
  created_at: string;
}

const PositionManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: '',
    experience_level: 'junior',
    status: 'active',
    job_requirements: null as any
  });

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    try {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPositions(data || []);
    } catch (error) {
      console.error('Error fetching positions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch positions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingPosition) {
        const { error } = await supabase
          .from('positions')
          .update(formData)
          .eq('id', editingPosition.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Position updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('positions')
          .insert({
            ...formData,
            created_by: user?.id
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Position created successfully.",
        });
      }

      await fetchPositions();
      resetForm();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving position:', error);
      toast({
        title: "Error",
        description: "Failed to save position.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this position? This will also delete all associated questions.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('positions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Position deleted successfully.",
      });

      await fetchPositions();
    } catch (error) {
      console.error('Error deleting position:', error);
      toast({
        title: "Error",
        description: "Failed to delete position.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (position: Position) => {
    setEditingPosition(position);
    setFormData({
      title: position.title,
      description: position.description || '',
      department: position.department || '',
      experience_level: position.experience_level,
      status: position.status,
      job_requirements: (position as any).job_requirements || null
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingPosition(null);
    setFormData({
      title: '',
      description: '',
      department: '',
      experience_level: 'junior',
      status: 'active',
      job_requirements: null
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success';
      case 'inactive': return 'bg-warning';
      case 'closed': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const getExperienceColor = (level: string) => {
    switch (level) {
      case 'intern': return 'bg-blue-500';
      case 'junior': return 'bg-green-500';
      case 'mid': return 'bg-yellow-500';
      case 'senior': return 'bg-orange-500';
      case 'lead': return 'bg-purple-500';
      default: return 'bg-muted';
    }
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
          <h2 className="text-2xl font-bold">Position Management</h2>
          <p className="text-muted-foreground">Create and manage job positions</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Position
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingPosition ? 'Edit Position' : 'Create New Position'}
              </DialogTitle>
              <DialogDescription>
                {editingPosition ? 'Update the position details.' : 'Add a new job position to the system.'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Position Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Senior Web Developer"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g., Engineering"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience_level">Experience Level</Label>
                <Select value={formData.experience_level} onValueChange={(value) => setFormData({ ...formData, experience_level: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="intern">Intern</SelectItem>
                    <SelectItem value="junior">Junior</SelectItem>
                    <SelectItem value="mid">Mid-Level</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Job description and requirements..."
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="job_requirements">Job Requirements (JSON format)</Label>
                <Textarea
                  id="job_requirements"
                  className="text-sm"
                  placeholder='{"required_experience": "3-5 years", "skills": ["React", "TypeScript"], "education": "Bachelor degree"}'
                  value={formData.job_requirements ? JSON.stringify(formData.job_requirements, null, 2) : ''}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setFormData({ ...formData, job_requirements: parsed });
                    } catch {
                      // Invalid JSON, store as string for now
                      setFormData({ ...formData, job_requirements: e.target.value });
                    }
                  }}
                  rows={4}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingPosition ? 'Update' : 'Create'} Position
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {positions.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No positions created yet. Click "Add Position" to create your first job opening.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4">
          {positions.map((position) => (
            <Card key={position.id} className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">{position.title}</h3>
                      <Badge className={`text-white ${getStatusColor(position.status)}`}>
                        {position.status}
                      </Badge>
                      <Badge variant="outline" className={`text-white ${getExperienceColor(position.experience_level)}`}>
                        {position.experience_level}
                      </Badge>
                    </div>
                    
                    {position.department && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {position.department}
                      </p>
                    )}
                    
                    {position.description && (
                      <p className="text-sm text-muted-foreground">
                        {position.description}
                      </p>
                    )}
                    
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(position.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(position)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(position.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PositionManagement;