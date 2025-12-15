import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, Save, X, FileText } from "lucide-react";

interface OnboardingTask {
  id: string;
  stage_id: string;
  title: string;
  description: string | null;
  due_days_offset: number;
  file_url: string | null;
  notify_employee: boolean;
  task_order: number;
}

interface OnboardingStage {
  id: string;
  name: string;
  stage_order: number;
}

export const OnboardingTaskManagement = () => {
  const [selectedStageId, setSelectedStageId] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_days_offset: 0,
    file_url: "",
    notify_employee: true,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stages } = useQuery({
    queryKey: ["onboarding-stages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_stages")
        .select("*")
        .order("stage_order");

      if (error) throw error;
      return data as OnboardingStage[];
    },
  });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["onboarding-tasks", selectedStageId],
    queryFn: async () => {
      if (!selectedStageId) return [];

      const { data, error } = await supabase
        .from("onboarding_tasks")
        .select("*")
        .eq("stage_id", selectedStageId)
        .order("task_order");

      if (error) throw error;
      return data as OnboardingTask[];
    },
    enabled: !!selectedStageId,
  });

  const createMutation = useMutation({
    mutationFn: async (newTask: Omit<OnboardingTask, "id" | "task_order">) => {
      const maxOrder = tasks?.reduce((max, t) => Math.max(max, t.task_order), 0) || 0;
      const { error } = await supabase
        .from("onboarding_tasks")
        .insert({
          ...newTask,
          task_order: maxOrder + 1,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-tasks"] });
      setIsAdding(false);
      resetForm();
      toast({ title: "Task created successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error creating task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<OnboardingTask> }) => {
      const { error } = await supabase
        .from("onboarding_tasks")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-tasks"] });
      setEditingId(null);
      resetForm();
      toast({ title: "Task updated successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error updating task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("onboarding_tasks")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-tasks"] });
      toast({ title: "Task deleted successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error deleting task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      due_days_offset: 0,
      file_url: "",
      notify_employee: true,
    });
  };

  const handleEdit = (task: OnboardingTask) => {
    setEditingId(task.id);
    setFormData({
      title: task.title,
      description: task.description || "",
      due_days_offset: task.due_days_offset,
      file_url: task.file_url || "",
      notify_employee: task.notify_employee,
    });
  };

  const handleSave = () => {
    if (!selectedStageId && !editingId) {
      toast({
        title: "Please select a stage",
        variant: "destructive",
      });
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        updates: formData,
      });
    } else if (isAdding) {
      createMutation.mutate({
        ...formData,
        stage_id: selectedStageId,
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    resetForm();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Onboarding Tasks</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Label>Select Stage</Label>
            <Select value={selectedStageId} onValueChange={setSelectedStageId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a stage" />
              </SelectTrigger>
              <SelectContent>
                {stages?.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.stage_order}. {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => setIsAdding(true)}
            disabled={!selectedStageId}
            className="mt-6"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>

        {isAdding && (
          <Card className="border-2 border-primary">
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label>Task Title</Label>
                <Input
                  placeholder="Task title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Task description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <Label>Due Days After Joining</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.due_days_offset}
                  onChange={(e) =>
                    setFormData({ ...formData, due_days_offset: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <Label>File URL (optional)</Label>
                <Input
                  placeholder="https://..."
                  value={formData.file_url}
                  onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.notify_employee}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, notify_employee: checked })
                  }
                />
                <Label>Notify employee</Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading && selectedStageId && <div>Loading tasks...</div>}

        {tasks?.map((task) => (
          <Card key={task.id}>
            <CardContent className="pt-6">
              {editingId === task.id ? (
                <div className="space-y-4">
                  <div>
                    <Label>Task Title</Label>
                    <Input
                      placeholder="Task title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Task description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Due Days After Joining</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.due_days_offset}
                      onChange={(e) =>
                        setFormData({ ...formData, due_days_offset: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div>
                    <Label>File URL (optional)</Label>
                    <Input
                      placeholder="https://..."
                      value={formData.file_url}
                      onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.notify_employee}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, notify_employee: checked })
                      }
                    />
                    <Label>Notify employee</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button onClick={handleCancel} variant="outline" size="sm">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{task.title}</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      {task.description || "No description"}
                    </p>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Due: Day {task.due_days_offset}</span>
                      {task.file_url && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          File attached
                        </span>
                      )}
                      <span>Notify: {task.notify_employee ? "Yes" : "No"}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(task)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => deleteMutation.mutate(task.id)}
                      variant="outline"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {selectedStageId && tasks?.length === 0 && !isAdding && (
          <p className="text-center text-muted-foreground py-8">
            No tasks in this stage. Click "Add Task" to create one.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
