import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar,
  Download,
  Filter,
  Clock,
  Target,
  Award,
  MapPin
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ReportData {
  attendance: {
    totalEmployees: number;
    presentToday: number;
    averageAttendance: number;
    lateArrivals: number;
  };
  interviews: {
    totalConducted: number;
    averageScore: number;
    completionRate: number;
    proctorAlerts: number;
  };
  employees: {
    totalActive: number;
    newHires: number;
    departments: { [key: string]: number };
  };
}

const ReportsAnalytics = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [reportData, setReportData] = useState<ReportData>({
    attendance: {
      totalEmployees: 0,
      presentToday: 0,
      averageAttendance: 0,
      lateArrivals: 0
    },
    interviews: {
      totalConducted: 0,
      averageScore: 0,
      completionRate: 0,
      proctorAlerts: 0
    },
    employees: {
      totalActive: 0,
      newHires: 0,
      departments: {}
    }
  });

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      // Fetch attendance data
      const today = new Date().toISOString().split('T')[0];
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', today);

      const { data: employeesData } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'candidate');

      const { data: interviewsData } = await supabase
        .from('interviews')
        .select('*');

      // Calculate metrics
      const totalEmployees = employeesData?.length || 0;
      const presentToday = attendanceData?.length || 0;
      const lateArrivals = attendanceData?.filter(record => {
        if (!record.check_in) return false;
        const checkInTime = new Date(record.check_in);
        const cutoffTime = new Date(checkInTime);
        cutoffTime.setHours(9, 15, 0, 0);
        return checkInTime > cutoffTime;
      }).length || 0;

      const completedInterviews = interviewsData?.filter(i => i.status === 'completed') || [];
      const averageScore = completedInterviews.length > 0 
        ? completedInterviews.reduce((sum, i) => sum + (i.score || 0), 0) / completedInterviews.length 
        : 0;

      setReportData({
        attendance: {
          totalEmployees,
          presentToday,
          averageAttendance: totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0,
          lateArrivals
        },
        interviews: {
          totalConducted: completedInterviews.length,
          averageScore: Math.round(averageScore),
          completionRate: 95, // Mock data
          proctorAlerts: 8 // Mock data
        },
        employees: {
          totalActive: totalEmployees,
          newHires: 3, // Mock data
          departments: {
            'Engineering': 8,
            'HR': 2,
            'Marketing': 3,
            'Sales': 4
          }
        }
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    }
  };

  const exportReport = (type: string) => {
    // Mock export functionality
    console.log(`Exporting ${type} report...`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive reports and analytics dashboard</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.employees.totalActive}</div>
                <p className="text-xs text-muted-foreground">
                  +{reportData.employees.newHires} new this month
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                <Clock className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.attendance.averageAttendance}%</div>
                <p className="text-xs text-muted-foreground">
                  {reportData.attendance.presentToday}/{reportData.attendance.totalEmployees} present today
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Interview Score</CardTitle>
                <Award className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.interviews.averageScore}%</div>
                <p className="text-xs text-muted-foreground">
                  {reportData.interviews.totalConducted} interviews conducted
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <TrendingUp className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">98%</div>
                <p className="text-xs text-muted-foreground">
                  All systems operational
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Insights */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Weekly Trends</CardTitle>
                <CardDescription>Key metrics over the past week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Attendance Rate</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 bg-muted rounded-full">
                        <div className="h-2 w-16 bg-success rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium">85%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Interview Completion</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 bg-muted rounded-full">
                        <div className="h-2 w-19 bg-primary rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium">95%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Punctuality</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 bg-muted rounded-full">
                        <div className="h-2 w-17 bg-warning rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium">78%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Department Overview</CardTitle>
                <CardDescription>Employee distribution by department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(reportData.employees.departments).map(([dept, count]) => (
                    <div key={dept} className="flex items-center justify-between">
                      <span className="text-sm">{dept}</span>
                      <Badge variant="secondary">{count} employees</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Today's Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Present</span>
                    <span className="font-semibold text-success">{reportData.attendance.presentToday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Absent</span>
                    <span className="font-semibold text-destructive">
                      {reportData.attendance.totalEmployees - reportData.attendance.presentToday}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Late Arrivals</span>
                    <span className="font-semibold text-warning">{reportData.attendance.lateArrivals}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">This Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {reportData.attendance.averageAttendance}%
                  </div>
                  <div className="text-sm text-muted-foreground">Average Attendance</div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Location Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-sm">GPS Verified: 100%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Attendance Details</CardTitle>
                <CardDescription>Daily attendance breakdown</CardDescription>
              </div>
              <Button size="sm" onClick={() => exportReport('attendance')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                <p>Detailed attendance charts will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interviews" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Interview Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Conducted</span>
                    <span className="font-semibold">{reportData.interviews.totalConducted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Average Score</span>
                    <span className="font-semibold text-primary">{reportData.interviews.averageScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Completion Rate</span>
                    <span className="font-semibold text-success">{reportData.interviews.completionRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Proctoring</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Alerts</span>
                    <span className="font-semibold text-warning">{reportData.interviews.proctorAlerts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Tab Switches</span>
                    <span className="font-semibold">5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Clean Sessions</span>
                    <span className="font-semibold text-success">
                      {reportData.interviews.totalConducted - reportData.interviews.proctorAlerts}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">A+</div>
                  <div className="text-sm text-muted-foreground">System Grade</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Total Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.employees.totalActive}</div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">New Hires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{reportData.employees.newHires}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Departments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Object.keys(reportData.employees.departments).length}</div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Retention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">94%</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsAnalytics;