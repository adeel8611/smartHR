import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Calendar, 
  Video, 
  BarChart3, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Briefcase,
  HelpCircle,
  Mail,
  TrendingUp,
  MapPin,
  MessageSquare,
  User,
  Target
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PositionManagement from "@/components/PositionManagement";
import QuestionManagement from "@/components/QuestionManagement";
import MessageCenter from "@/components/MessageCenter";
import EmailCenter from "@/components/EmailCenter";
import MeetingManagement from "@/components/MeetingManagement";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [staffAttendance, setStaffAttendance] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState({
    weeklyAverage: 0,
    monthlyAverage: 0,
    onTimeRate: 0,
    totalStaff: 0
  });

  const [systemStats, setSystemStats] = useState({
    totalEmployees: 0,
    activeInterviews: 0,
    attendanceRate: 0,
    pendingApprovals: 0
  });

  useEffect(() => {
    fetchRealData();
    fetchStaffAttendanceData();
  }, []);

  const fetchRealData = async () => {
    try {
      // Fetch total employees (staff and admin only)
      const { data: employeesData } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['admin', 'staff']);
      
      // Fetch active interviews
      const { data: interviewsData } = await supabase
        .from('interviews')
        .select('id')
        .eq('status', 'scheduled');
      
      // Fetch today's attendance
      const today = new Date().toISOString().split('T')[0];
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('id')
        .eq('date', today);
      
      // Fetch pending approvals (interviews awaiting scheduling)
      const { data: pendingData } = await supabase
        .from('interviews')
        .select('id')
        .eq('status', 'pending');

      setSystemStats({
        totalEmployees: employeesData?.length || 0,
        activeInterviews: interviewsData?.length || 0,
        attendanceRate: Math.round(((attendanceData?.length || 0) / (employeesData?.length || 1)) * 100),
        pendingApprovals: pendingData?.length || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchStaffAttendanceData = async () => {
    try {
      // Get all staff members
      const { data: staffData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, role')
        .in('role', ['admin', 'staff']);

      if (!staffData) return;

      // Get current week dates (Monday to Friday)
      const weekDates = getWeekDates();
      const monthStart = new Date();
      monthStart.setDate(1);
      const monthStartStr = monthStart.toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];

      // Fetch attendance data for all staff
      const staffAttendancePromises = staffData.map(async (staff) => {
        // Weekly attendance
        const { data: weeklyData } = await supabase
          .from('attendance')
          .select('*')
          .eq('user_id', staff.user_id)
          .gte('date', weekDates[0])
          .lte('date', weekDates[weekDates.length - 1]);

        // Monthly attendance
        const { data: monthlyData } = await supabase
          .from('attendance')
          .select('*')
          .eq('user_id', staff.user_id)
          .gte('date', monthStartStr)
          .lte('date', today);

        // Calculate stats
        const weeklyPresentDays = weeklyData?.filter(record => record.check_in).length || 0;
        const monthlyPresentDays = monthlyData?.filter(record => record.check_in).length || 0;
        const workingDaysThisMonth = getWorkingDaysInMonth();
        
        // Calculate on-time attendance
        const onTimeCount = weeklyData?.filter(record => {
          if (!record.check_in) return false;
          const checkInTime = new Date(record.check_in);
          const cutoffTime = new Date(checkInTime);
          cutoffTime.setHours(9, 15, 0, 0);
          return checkInTime <= cutoffTime;
        }).length || 0;

        return {
          ...staff,
          weeklyPresent: weeklyPresentDays,
          weeklyTotal: weekDates.length,
          weeklyPercentage: Math.round((weeklyPresentDays / weekDates.length) * 100),
          monthlyPresent: monthlyPresentDays,
          monthlyTotal: workingDaysThisMonth,
          monthlyPercentage: Math.round((monthlyPresentDays / workingDaysThisMonth) * 100),
          onTimePercentage: weeklyPresentDays > 0 ? Math.round((onTimeCount / weeklyPresentDays) * 100) : 0,
          lastCheckIn: weeklyData?.[0]?.check_in || null
        };
      });

      const attendanceResults = await Promise.all(staffAttendancePromises);
      setStaffAttendance(attendanceResults);

      // Calculate overall stats
      const totalStaff = attendanceResults.length;
      const avgWeekly = attendanceResults.reduce((sum, staff) => sum + staff.weeklyPercentage, 0) / totalStaff;
      const avgMonthly = attendanceResults.reduce((sum, staff) => sum + staff.monthlyPercentage, 0) / totalStaff;
      const avgOnTime = attendanceResults.reduce((sum, staff) => sum + staff.onTimePercentage, 0) / totalStaff;

      setAttendanceStats({
        weeklyAverage: Math.round(avgWeekly) || 0,
        monthlyAverage: Math.round(avgMonthly) || 0,
        onTimeRate: Math.round(avgOnTime) || 0,
        totalStaff
      });

    } catch (error) {
      console.error('Error fetching staff attendance:', error);
    }
  };

  const getWeekDates = () => {
    const dates = [];
    const today = new Date();
    const currentDay = today.getDay();
    const daysBackToMonday = currentDay === 0 ? 6 : currentDay - 1;
    
    for (let i = daysBackToMonday; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    return dates;
  };

  const getWorkingDaysInMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let workingDays = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
    }
    return workingDays;
  };

  const formatLastCheckIn = (checkInTime: string | null) => {
    if (!checkInTime) return 'No recent check-in';
    const date = new Date(checkInTime);
    const today = new Date().toISOString().split('T')[0];
    const checkInDate = checkInTime.split('T')[0];
    
    if (checkInDate === today) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const recentActivity = [
    {
      type: "interview",
      message: "New interview scheduled for Senior Developer position",
      time: "2 minutes ago"
    },
    {
      type: "attendance",
      message: "John Doe marked attendance from office location",
      time: "15 minutes ago"
    },
    {
      type: "alert",
      message: "Candidate tab switch detected during interview",
      time: "1 hour ago"
    },
    {
      type: "interview",
      message: "Interview completed for Marketing Specialist",
      time: "2 hours ago"
    }
  ];

  const todaySchedule = [
    {
      title: "Team Standup",
      time: "10:00 AM",
      type: "Meeting"
    },
    {
      title: "Senior Dev Interview",
      time: "2:00 PM",
      type: "Interview"
    },
    {
      title: "Client Presentation",
      time: "4:00 PM",
      type: "Meeting"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your organization efficiently</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="positions">Positions</TabsTrigger>
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="meetings">Meetings</TabsTrigger>
              <TabsTrigger value="emails">Emails</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Overview Stats */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.totalEmployees}</div>
                <p className="text-xs text-muted-foreground">
                  +2 new this month
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Interviews</CardTitle>
                <Video className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.activeInterviews}</div>
                <p className="text-xs text-muted-foreground">
                  5 scheduled today
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.attendanceRate}%</div>
                <p className="text-xs text-muted-foreground">
                  +5% from last week
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <AlertTriangle className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.pendingApprovals}</div>
                <p className="text-xs text-muted-foreground">
                  Requires attention
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest system activities and updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'interview' ? 'bg-primary' :
                      activity.type === 'attendance' ? 'bg-success' :
                      activity.type === 'alert' ? 'bg-warning' : 'bg-muted'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Today's Schedule
                </CardTitle>
                <CardDescription>
                  Upcoming meetings and interviews
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {todaySchedule.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{item.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{item.time}</span>
                        <Badge variant="secondary" className="text-xs">
                          {item.type}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="positions">
          <PositionManagement />
        </TabsContent>

        <TabsContent value="questions">
          <QuestionManagement />
        </TabsContent>

        <TabsContent value="meetings">
          <MeetingManagement />
        </TabsContent>

        <TabsContent value="emails">
          <EmailCenter />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics Overview Stats */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendanceStats.totalStaff}</div>
                <p className="text-xs text-muted-foreground">Active employees</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Weekly Average</CardTitle>
                <TrendingUp className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendanceStats.weeklyAverage}%</div>
                <p className="text-xs text-muted-foreground">This week attendance</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Average</CardTitle>
                <Calendar className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendanceStats.monthlyAverage}%</div>
                <p className="text-xs text-muted-foreground">This month attendance</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
                <Target className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendanceStats.onTimeRate}%</div>
                <p className="text-xs text-muted-foreground">Punctuality rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Staff Attendance Details */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Staff Attendance Details
              </CardTitle>
              <CardDescription>
                Individual attendance tracking for all staff members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>This Week</TableHead>
                    <TableHead>This Month</TableHead>
                    <TableHead>Punctuality</TableHead>
                    <TableHead>Last Check-in</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffAttendance.map((staff, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        <div>
                          <p className="font-medium">{staff.full_name}</p>
                          <p className="text-xs text-muted-foreground">{staff.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={staff.role === 'admin' ? 'default' : 'secondary'}>
                          {staff.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{staff.weeklyPercentage}%</span>
                          <span className="text-xs text-muted-foreground">
                            ({staff.weeklyPresent}/{staff.weeklyTotal})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{staff.monthlyPercentage}%</span>
                          <span className="text-xs text-muted-foreground">
                            ({staff.monthlyPresent}/{staff.monthlyTotal})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={staff.onTimePercentage >= 80 ? 'default' : 'destructive'}>
                          {staff.onTimePercentage}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{formatLastCheckIn(staff.lastCheckIn)}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {staffAttendance.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No staff attendance data found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;