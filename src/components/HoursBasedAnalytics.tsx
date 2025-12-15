import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, TrendingUp, Calendar, MapPin, Home, Building } from "lucide-react";

interface AttendanceRecord {
  id: string;
  user_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  work_location: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

interface EmployeeHours {
  userId: string;
  name: string;
  email: string;
  totalHours: number;
  daysWorked: number;
  averageHoursPerDay: number;
  hoursThisWeek: number;
  workLocation: { [key: string]: number };
}

const HoursBasedAnalytics = () => {
  const { user, profile } = useAuth();
  const [employeeHours, setEmployeeHours] = useState<EmployeeHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyStats, setMonthlyStats] = useState({
    totalHours: 0,
    expectedHours: 0,
    efficiency: 0,
    workingDays: 0
  });

  const calculateWorkingHours = (checkIn: string | null, checkOut: string | null): number => {
    if (!checkIn || !checkOut) return 0;
    
    const checkInTime = new Date(checkIn);
    const checkOutTime = new Date(checkOut);
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    const hours = diffMs / (1000 * 60 * 60);
    
    // Cap at 12 hours max per day to avoid unrealistic calculations
    return Math.min(Math.max(hours, 0), 12);
  };

  const getWorkingDaysInMonth = (): number => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    
    let workingDays = 0;
    for (let day = 1; day <= today; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not weekend
        workingDays++;
      }
    }
    return workingDays;
  };

  const fetchEmployeeHoursData = async () => {
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
      const firstDayStr = firstDayOfMonth.toISOString().split('T')[0];
      const todayStr = now.toISOString().split('T')[0];

      // Get current week dates
      const startOfWeek = new Date(now);
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startOfWeek.setDate(now.getDate() - daysToMonday);
      const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

      // Fetch attendance data for current month
      const { data: attendanceData, error } = await supabase
        .from('attendance')
        .select(`
          *,
          profiles!inner(full_name, email)
        `)
        .gte('date', firstDayStr)
        .lte('date', todayStr)
        .not('check_in', 'is', null);

      if (error) throw error;

      // Process data by employee
      const employeeMap = new Map<string, EmployeeHours>();
      let totalSystemHours = 0;
      
      attendanceData?.forEach((record: any) => {
        const userId = record.user_id;
        const hoursWorked = calculateWorkingHours(record.check_in, record.check_out);
        const recordDate = new Date(record.date);
        const isThisWeek = recordDate >= startOfWeek;
        
        totalSystemHours += hoursWorked;

        if (!employeeMap.has(userId)) {
          employeeMap.set(userId, {
            userId,
            name: record.profiles?.full_name || 'Unknown',
            email: record.profiles?.email || 'No email',
            totalHours: 0,
            daysWorked: 0,
            averageHoursPerDay: 0,
            hoursThisWeek: 0,
            workLocation: { office: 0, home: 0, remote: 0 }
          });
        }

        const employee = employeeMap.get(userId)!;
        employee.totalHours += hoursWorked;
        if (hoursWorked > 0) {
          employee.daysWorked += 1;
        }
        if (isThisWeek) {
          employee.hoursThisWeek += hoursWorked;
        }
        
        // Track work location
        const location = record.work_location || 'office';
        employee.workLocation[location] = (employee.workLocation[location] || 0) + 1;
      });

      // Calculate averages and convert to array
      const employeeHoursArray = Array.from(employeeMap.values()).map(employee => ({
        ...employee,
        averageHoursPerDay: employee.daysWorked > 0 ? employee.totalHours / employee.daysWorked : 0
      }));

      setEmployeeHours(employeeHoursArray);

      // Calculate monthly stats
      const workingDays = getWorkingDaysInMonth();
      const expectedHours = workingDays * 7 * employeeHoursArray.length; // 7 hours per day per employee
      const efficiency = expectedHours > 0 ? (totalSystemHours / expectedHours) * 100 : 0;

      setMonthlyStats({
        totalHours: Math.round(totalSystemHours),
        expectedHours: Math.round(expectedHours),
        efficiency: Math.round(efficiency),
        workingDays
      });

    } catch (error) {
      console.error('Error fetching employee hours data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      fetchEmployeeHoursData();
    } else {
      setLoading(false);
    }
  }, [user, profile]);

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

  const getPrimaryWorkLocation = (workLocation: { [key: string]: number }) => {
    const locations = Object.entries(workLocation);
    if (locations.length === 0) return 'office';
    
    const primaryLocation = locations.reduce((a, b) => a[1] > b[1] ? a : b);
    return primaryLocation[0];
  };

  const getHoursStatus = (hours: number, days: number) => {
    const expectedHours = days * 7; // 7 hours per day
    const percentage = expectedHours > 0 ? (hours / expectedHours) * 100 : 0;
    
    if (percentage >= 90) return { color: 'text-green-600', label: 'Excellent' };
    if (percentage >= 75) return { color: 'text-blue-600', label: 'Good' };
    if (percentage >= 60) return { color: 'text-yellow-600', label: 'Average' };
    return { color: 'text-red-600', label: 'Below Average' };
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Access denied. Only administrators can view analytics.</p>
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
          <h1 className="text-3xl font-bold text-foreground">Hours-Based Analytics</h1>
          <p className="text-muted-foreground">Track employee working hours and productivity</p>
        </div>
      </div>

      {/* Monthly Overview Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours This Month</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyStats.totalHours}h</div>
            <p className="text-xs text-muted-foreground">
              Across all employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expected Hours</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyStats.expectedHours}h</div>
            <p className="text-xs text-muted-foreground">
              Based on {monthlyStats.workingDays} working days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Efficiency</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyStats.efficiency}%</div>
            <p className="text-xs text-muted-foreground">
              Hours worked vs expected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Per Employee</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employeeHours.length > 0 
                ? Math.round(monthlyStats.totalHours / employeeHours.length)
                : 0}h
            </div>
            <p className="text-xs text-muted-foreground">
              This month average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Employee Hours Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Working Hours</CardTitle>
          <CardDescription>
            Detailed breakdown of working hours for each employee this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          {employeeHours.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No attendance data found for this month</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Days Worked</TableHead>
                  <TableHead>Avg Hours/Day</TableHead>
                  <TableHead>This Week</TableHead>
                  <TableHead>Primary Location</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeeHours.map((employee) => {
                  const status = getHoursStatus(employee.totalHours, employee.daysWorked);
                  const primaryLocation = getPrimaryWorkLocation(employee.workLocation);
                  
                  return (
                    <TableRow key={employee.userId}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{employee.name}</div>
                          <div className="text-sm text-muted-foreground">{employee.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{Math.round(employee.totalHours)}h</div>
                        <div className="text-xs text-muted-foreground">
                          vs {employee.daysWorked * 7}h expected
                        </div>
                      </TableCell>
                      <TableCell>{employee.daysWorked} days</TableCell>
                      <TableCell>{employee.averageHoursPerDay.toFixed(1)}h</TableCell>
                      <TableCell>{Math.round(employee.hoursThisWeek)}h</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getLocationIcon(primaryLocation)}
                          <span className="capitalize">{primaryLocation}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={status.color}>
                          {status.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HoursBasedAnalytics;