import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";

interface OnboardingStage {
  id: string;
  name: string;
  stage_order: number;
  description: string | null;
}

export const OnboardingStageManagement = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stages, isLoading } = useQuery({
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

  const createMutation = useMutation({
    mutationFn: async (newStage: { name: string; description: string }) => {
      const maxOrder = stages?.reduce((max, s) => Math.max(max, s.stage_order), 0) || 0;
      const { error } = await supabase
        .from("onboarding_stages")
        .insert({
          name: newStage.name,
          description: newStage.description,
          stage_order: maxOrder + 1,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-stages"] });
      setIsAdding(false);
      setFormData({ name: "", description: "" });
      toast({ title: "Stage created successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error creating stage",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<OnboardingStage> }) => {
      const { error } = await supabase
        .from("onboarding_stages")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-stages"] });
      setEditingId(null);
      setFormData({ name: "", description: "" });
      toast({ title: "Stage updated successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error updating stage",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("onboarding_stages")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-stages"] });
      toast({ title: "Stage deleted successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error deleting stage",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (stage: OnboardingStage) => {
    setEditingId(stage.id);
    setFormData({
      name: stage.name,
      description: stage.description || "",
    });
  };

  const handleSave = () => {
    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        updates: {
          name: formData.name,
          description: formData.description,
        },
      });
    } else if (isAdding) {
      createMutation.mutate(formData);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({ name: "", description: "" });
  };

  if (isLoading) {
    return <div>Loading stages...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>GSG Program Stages</CardTitle>
          <Button onClick={() => setIsAdding(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Stage
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <Card className="border-2 border-primary">
            <CardContent className="pt-6 space-y-4">
              <Input
                placeholder="Stage name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
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

        {stages?.map((stage) => (
          <Card key={stage.id}>
            <CardContent className="pt-6">
              {editingId === stage.id ? (
                <div className="space-y-4">
                  <Input
                    placeholder="Stage name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <Textarea
                    placeholder="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
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
                    <h3 className="font-semibold text-lg">
                      {stage.stage_order}. {stage.name}
                    </h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      {stage.description || "No description"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(stage)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => deleteMutation.mutate(stage.id)}
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
      </CardContent>
    </Card>
  );
};
