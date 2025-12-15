import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Play, Calendar, User, CheckCircle, Clock } from "lucide-react";
import { format, addDays } from "date-fns";

interface Profile {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
}

interface OnboardingRecord {
  id: string;
  employee_id: string;
  expected_joining_date: string;
  actual_joining_date: string | null;
  status: string;
  profiles: Profile;
}

interface TaskAssignment {
  id: string;
  task_id: string;
  due_date: string;
  status: string;
  assigned_to: string | null;
  onboarding_tasks: {
    title: string;
    description: string | null;
    stage_id: string;
    onboarding_stages: {
      name: string;
      stage_order: number;
    };
  };
}

export const EmployeeOnboardingExecution = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [joiningDate, setJoiningDate] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingEmployees } = useQuery({
    queryKey: ["pending-employees", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("user_id, full_name, email, role")
        .eq("role", "staff")
        .not("user_id", "in", `(SELECT employee_id FROM employee_onboarding)`);

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.limit(10);

      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: onboardingRecords } = useQuery({
    queryKey: ["employee-onboarding"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_onboarding")
        .select(`
          *,
          profiles:employee_id (
            user_id,
            full_name,
            email,
            role
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as OnboardingRecord[];
    },
  });

  const { data: taskAssignments } = useQuery({
    queryKey: ["task-assignments", selectedEmployeeId],
    queryFn: async () => {
      if (!selectedEmployeeId) return [];

      const onboarding = onboardingRecords?.find(
        (r) => r.employee_id === selectedEmployeeId
      );
      if (!onboarding) return [];

      const { data, error } = await supabase
        .from("employee_onboarding_tasks")
        .select(`
          *,
          onboarding_tasks (
            title,
            description,
            stage_id,
            onboarding_stages (
              name,
              stage_order
            )
          )
        `)
        .eq("employee_onboarding_id", onboarding.id)
        .order("due_date");

      if (error) throw error;
      return data as TaskAssignment[];
    },
    enabled: !!selectedEmployeeId,
  });

  const executeOnboardingMutation = useMutation({
    mutationFn: async ({
      employeeId,
      joiningDate,
    }: {
      employeeId: string;
      joiningDate: string;
    }) => {
      // Create onboarding record
      const { data: onboarding, error: onboardingError } = await supabase
        .from("employee_onboarding")
        .insert({
          employee_id: employeeId,
          expected_joining_date: joiningDate,
          status: "pending",
        })
        .select()
        .single();

      if (onboardingError) throw onboardingError;

      // Get all tasks
      const { data: tasks, error: tasksError } = await supabase
        .from("onboarding_tasks")
        .select("*");

      if (tasksError) throw tasksError;

      // Create task assignments
      const taskAssignments = tasks.map((task) => ({
        employee_onboarding_id: onboarding.id,
        task_id: task.id,
        due_date: format(
          addDays(new Date(joiningDate), task.due_days_offset),
          "yyyy-MM-dd"
        ),
        status: "pending",
      }));

      const { error: assignError } = await supabase
        .from("employee_onboarding_tasks")
        .insert(taskAssignments);

      if (assignError) throw assignError;

      return onboarding;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-onboarding"] });
      queryClient.invalidateQueries({ queryKey: ["pending-employees"] });
      setSelectedEmployeeId("");
      setJoiningDate("");
      toast({ title: "Onboarding plan executed successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error executing onboarding",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleExecute = () => {
    if (!selectedEmployeeId || !joiningDate) {
      toast({
        title: "Missing information",
        description: "Please select an employee and joining date",
        variant: "destructive",
      });
      return;
    }

    executeOnboardingMutation.mutate({
      employeeId: selectedEmployeeId,
      joiningDate,
    });
  };

  const groupTasksByStage = (tasks: TaskAssignment[]) => {
    const grouped: { [key: string]: TaskAssignment[] } = {};

    tasks.forEach((task) => {
      const stageName = task.onboarding_tasks.onboarding_stages.name;
      if (!grouped[stageName]) {
        grouped[stageName] = [];
      }
      grouped[stageName].push(task);
    });

    return grouped;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Execute Onboarding Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Search Employee</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {pendingEmployees && pendingEmployees.length > 0 && (
            <div className="space-y-2">
              <Label>Select Employee</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an employee" />
                </SelectTrigger>
                <SelectContent>
                  {pendingEmployees.map((emp) => (
                    <SelectItem key={emp.user_id} value={emp.user_id}>
                      {emp.full_name} ({emp.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Expected Joining Date</Label>
            <Input
              type="date"
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
            />
          </div>

          <Button onClick={handleExecute} disabled={!selectedEmployeeId || !joiningDate}>
            <Play className="h-4 w-4 mr-2" />
            Execute Onboarding Plan
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Onboarding Plans</CardTitle>
        </CardHeader>
        <CardContent>
          {onboardingRecords?.map((record) => (
            <Card
              key={record.id}
              className="mb-4 cursor-pointer hover:bg-accent"
              onClick={() => setSelectedEmployeeId(record.employee_id)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <User className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold">{record.profiles.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{record.profiles.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">Joining Date</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(record.expected_joining_date), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <Badge
                      variant={
                        record.status === "completed"
                          ? "default"
                          : record.status === "in_progress"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {record.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {onboardingRecords?.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No onboarding plans executed yet
            </p>
          )}
        </CardContent>
      </Card>

      {selectedEmployeeId && taskAssignments && taskAssignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Onboarding Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(groupTasksByStage(taskAssignments)).map(([stage, tasks]) => (
              <div key={stage}>
                <h3 className="font-semibold mb-3">{stage}</h3>
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <Card key={task.id}>
                      <CardContent className="pt-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {task.status === "completed" ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <Clock className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div>
                            <h4 className="font-medium">{task.onboarding_tasks.title}</h4>
                            {task.onboarding_tasks.description && (
                              <p className="text-sm text-muted-foreground">
                                {task.onboarding_tasks.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(task.due_date), "MMM dd, yyyy")}
                          </div>
                          <Badge variant="outline" className="mt-1">
                            {task.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
