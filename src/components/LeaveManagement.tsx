import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";

const leaveRequestSchema = z.object({
  leave_type: z.string().min(1, "Leave type is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  reason: z.string().min(10, "Please provide a detailed reason (minimum 10 characters)"),
});

interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: string;
  approved_by?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
  employee_profile?: {
    full_name: string;
    email: string;
  } | null;
}

interface LeaveBalance {
  annual_days_total: number;
  annual_days_used: number;
  sick_days_total: number;
  sick_days_used: number;
  personal_days_total: number;
  personal_days_used: number;
}

const LeaveManagement = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof leaveRequestSchema>>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      leave_type: "",
      start_date: "",
      end_date: "",
      reason: "",
    },
  });

  const fetchLeaveRequests = async () => {
    try {
      let query = supabase
        .from('leave_requests')
        .select('*')
        .order('created_at', { ascending: false });

      // If not admin, only fetch own requests
      if (profile?.role !== 'admin') {
        query = query.eq('employee_id', user?.id);
      }

      const { data: leaveData, error } = await query;

      if (error) throw error;

      // For admin, fetch employee profiles separately
      if (profile?.role === 'admin' && leaveData?.length) {
        const employeeIds = [...new Set(leaveData.map(req => req.employee_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', employeeIds);

        const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
        
        const enrichedData = leaveData.map(req => ({
          ...req,
          employee_profile: profilesMap.get(req.employee_id) || null
        }));
        
        setLeaveRequests(enrichedData);
      } else {
        setLeaveRequests(leaveData || []);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch leave requests",
        variant: "destructive",
      });
    }
  };

  const fetchLeaveBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('employee_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setLeaveBalance(data);
    } catch (error) {
      console.error('Error fetching leave balance:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchLeaveRequests(), fetchLeaveBalance()]);
      setLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user, profile]);

  const calculateTotalDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const onSubmit = async (values: z.infer<typeof leaveRequestSchema>) => {
    try {
      const totalDays = calculateTotalDays(values.start_date, values.end_date);

      const { error } = await supabase
        .from('leave_requests')
        .insert({
          employee_id: user?.id,
          leave_type: values.leave_type,
          start_date: values.start_date,
          end_date: values.end_date,
          total_days: totalDays,
          reason: values.reason,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Leave request submitted successfully",
      });

      setDialogOpen(false);
      form.reset();
      fetchLeaveRequests();
    } catch (error) {
      console.error('Error submitting leave request:', error);
      toast({
        title: "Error",
        description: "Failed to submit leave request",
        variant: "destructive",
      });
    }
  };

  const updateLeaveStatus = async (requestId: string, status: 'approved' | 'rejected', rejectionReason?: string) => {
    try {
      const updateData: any = {
        status,
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
      };

      if (status === 'rejected' && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('leave_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Leave request ${status} successfully`,
      });

      fetchLeaveRequests();
    } catch (error) {
      console.error('Error updating leave status:', error);
      toast({
        title: "Error",
        description: "Failed to update leave request",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const getLeaveTypeColor = (type: string) => {
    const colors = {
      annual: 'bg-blue-100 text-blue-800',
      sick: 'bg-red-100 text-red-800',
      personal: 'bg-purple-100 text-purple-800',
      maternity: 'bg-pink-100 text-pink-800',
      paternity: 'bg-green-100 text-green-800',
      emergency: 'bg-orange-100 text-orange-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

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
          <h1 className="text-3xl font-bold text-foreground">Leave Management</h1>
          <p className="text-muted-foreground">Manage leave requests and track balances</p>
        </div>
        {profile?.role !== 'admin' && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Request Leave
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Request Leave</DialogTitle>
                <DialogDescription>
                  Submit a new leave request for approval.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="leave_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Leave Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select leave type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="annual">Annual Leave</SelectItem>
                            <SelectItem value="sick">Sick Leave</SelectItem>
                            <SelectItem value="personal">Personal Leave</SelectItem>
                            <SelectItem value="maternity">Maternity Leave</SelectItem>
                            <SelectItem value="paternity">Paternity Leave</SelectItem>
                            <SelectItem value="emergency">Emergency Leave</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Please provide a detailed reason for your leave request"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Submit Request</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Leave Balance Card (for employees) */}
      {profile?.role !== 'admin' && leaveBalance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Leave Balance ({new Date().getFullYear()})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {leaveBalance.annual_days_total - leaveBalance.annual_days_used}
                </div>
                <div className="text-sm text-muted-foreground">Annual Days Remaining</div>
                <div className="text-xs text-muted-foreground">
                  {leaveBalance.annual_days_used} used of {leaveBalance.annual_days_total}
                </div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {leaveBalance.sick_days_total - leaveBalance.sick_days_used}
                </div>
                <div className="text-sm text-muted-foreground">Sick Days Remaining</div>
                <div className="text-xs text-muted-foreground">
                  {leaveBalance.sick_days_used} used of {leaveBalance.sick_days_total}
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {leaveBalance.personal_days_total - leaveBalance.personal_days_used}
                </div>
                <div className="text-sm text-muted-foreground">Personal Days Remaining</div>
                <div className="text-xs text-muted-foreground">
                  {leaveBalance.personal_days_used} used of {leaveBalance.personal_days_total}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {profile?.role === 'admin' ? 'All Leave Requests' : 'My Leave Requests'}
          </CardTitle>
          <CardDescription>
            {profile?.role === 'admin' 
              ? 'Review and manage employee leave requests'
              : 'Track your submitted leave requests'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leaveRequests.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No leave requests found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {profile?.role === 'admin' && <TableHead>Employee</TableHead>}
                  <TableHead>Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                  {profile?.role === 'admin' && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveRequests.map((request) => (
                  <TableRow key={request.id}>
                    {profile?.role === 'admin' && (
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.employee_profile?.full_name}</div>
                          <div className="text-sm text-muted-foreground">{request.employee_profile?.email}</div>
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge className={getLeaveTypeColor(request.leave_type)}>
                        {request.leave_type.charAt(0).toUpperCase() + request.leave_type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(request.start_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{format(new Date(request.end_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{request.total_days}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                    {profile?.role === 'admin' && (
                      <TableCell>
                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => updateLeaveStatus(request.id, 'approved')}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const reason = prompt('Rejection reason (optional):');
                                updateLeaveStatus(request.id, 'rejected', reason || undefined);
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    )}
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

export default LeaveManagement;