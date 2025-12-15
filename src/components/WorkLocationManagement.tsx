import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Home, Building, Settings, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const workLocationSchema = z.object({
  employee_id: z.string().min(1, "Employee is required"),
  default_location: z.string().min(1, "Default location is required"),
  can_work_remotely: z.boolean(),
  remote_days_per_week: z.coerce.number().min(0).max(5),
});

interface Employee {
  user_id: string;
  full_name: string;
  email: string;
  department?: string;
  position?: string;
}

interface WorkLocationSetting {
  id: string;
  employee_id: string;
  default_location: string;
  can_work_remotely: boolean;
  remote_days_per_week: number;
  approved_by?: string;
  approved_at?: string;
  employee?: Employee;
}

const WorkLocationManagement = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workLocationSettings, setWorkLocationSettings] = useState<WorkLocationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSettings, setEditingSettings] = useState<WorkLocationSetting | null>(null);

  const form = useForm<z.infer<typeof workLocationSchema>>({
    resolver: zodResolver(workLocationSchema),
    defaultValues: {
      employee_id: "",
      default_location: "office",
      can_work_remotely: false,
      remote_days_per_week: 0,
    },
  });

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, department, position')
        .neq('role', 'admin')
        .order('full_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
    }
  };

  const fetchWorkLocationSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('work_location_settings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch employee details separately
      if (data?.length) {
        const employeeIds = data.map(setting => setting.employee_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, department, position')
          .in('user_id', employeeIds);

        const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
        
        const enrichedData = data.map(setting => ({
          ...setting,
          employee: profilesMap.get(setting.employee_id)
        }));
        
        setWorkLocationSettings(enrichedData);
      } else {
        setWorkLocationSettings([]);
      }
    } catch (error) {
      console.error('Error fetching work location settings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch work location settings",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (profile?.role === 'admin') {
        await Promise.all([fetchEmployees(), fetchWorkLocationSettings()]);
      }
      setLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user, profile]);

  const onSubmit = async (values: z.infer<typeof workLocationSchema>) => {
    try {
      const submitData = {
        employee_id: values.employee_id,
        default_location: values.default_location,
        can_work_remotely: values.can_work_remotely,
        remote_days_per_week: values.remote_days_per_week,
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
      };

      let error;
      if (editingSettings) {
        const { error: updateError } = await supabase
          .from('work_location_settings')
          .update(submitData)
          .eq('id', editingSettings.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('work_location_settings')
          .insert(submitData);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `Work location settings ${editingSettings ? 'updated' : 'created'} successfully`,
      });

      setDialogOpen(false);
      setEditingSettings(null);
      form.reset();
      fetchWorkLocationSettings();
    } catch (error) {
      console.error('Error saving work location settings:', error);
      toast({
        title: "Error",
        description: "Failed to save work location settings",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (settings: WorkLocationSetting) => {
    setEditingSettings(settings);
    form.reset({
      employee_id: settings.employee_id,
      default_location: settings.default_location,
      can_work_remotely: settings.can_work_remotely,
      remote_days_per_week: settings.remote_days_per_week,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (settingsId: string) => {
    if (!confirm('Are you sure you want to delete these work location settings?')) return;

    try {
      const { error } = await supabase
        .from('work_location_settings')
        .delete()
        .eq('id', settingsId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Work location settings deleted successfully",
      });

      fetchWorkLocationSettings();
    } catch (error) {
      console.error('Error deleting work location settings:', error);
      toast({
        title: "Error",
        description: "Failed to delete work location settings",
        variant: "destructive",
      });
    }
  };

  const getLocationIcon = (location: string) => {
    switch (location) {
      case 'home':
        return <Home className="w-4 h-4" />;
      case 'remote':
        return <MapPin className="w-4 h-4" />;
      default:
        return <Building className="w-4 h-4" />;
    }
  };

  const getLocationBadge = (location: string) => {
    const colors = {
      office: 'bg-blue-100 text-blue-800',
      home: 'bg-green-100 text-green-800',
      remote: 'bg-purple-100 text-purple-800',
    };
    return (
      <Badge className={colors[location as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        <span className="flex items-center gap-1">
          {getLocationIcon(location)}
          {location.charAt(0).toUpperCase() + location.slice(1)}
        </span>
      </Badge>
    );
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Access denied. Only administrators can manage work locations.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Work Location Management</h1>
          <p className="text-muted-foreground">Manage employee work arrangements and remote work policies</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingSettings(null);
              form.reset();
            }}>
              <Settings className="w-4 h-4 mr-2" />
              Add Location Settings
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingSettings ? 'Edit' : 'Add'} Work Location Settings
              </DialogTitle>
              <DialogDescription>
                Configure work location policies for employees.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="employee_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!editingSettings}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select employee" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {employees.map((employee) => (
                            <SelectItem key={employee.user_id} value={employee.user_id}>
                              {employee.full_name} ({employee.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="default_location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Work Location</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select default location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="office">Office</SelectItem>
                          <SelectItem value="home">Home</SelectItem>
                          <SelectItem value="remote">Remote</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="can_work_remotely"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Can Work Remotely</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Allow this employee to work from home or remotely
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="remote_days_per_week"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remote Days Per Week</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingSettings ? 'Update' : 'Create'} Settings
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Employee Work Location Settings
          </CardTitle>
          <CardDescription>
            Manage where employees can work and their remote work policies
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workLocationSettings.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No work location settings configured</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Default Location</TableHead>
                  <TableHead>Remote Work</TableHead>
                  <TableHead>Remote Days/Week</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workLocationSettings.map((settings) => (
                  <TableRow key={settings.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{settings.employee?.full_name}</div>
                        <div className="text-sm text-muted-foreground">{settings.employee?.email}</div>
                        {settings.employee?.department && (
                          <div className="text-xs text-muted-foreground">{settings.employee.department}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getLocationBadge(settings.default_location)}</TableCell>
                    <TableCell>
                      <Badge variant={settings.can_work_remotely ? "default" : "secondary"}>
                        {settings.can_work_remotely ? "Allowed" : "Not Allowed"}
                      </Badge>
                    </TableCell>
                    <TableCell>{settings.remote_days_per_week} days</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(settings)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(settings.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkLocationManagement;