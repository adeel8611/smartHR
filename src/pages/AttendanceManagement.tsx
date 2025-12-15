import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, MapPin, BarChart3 } from "lucide-react";
import AttendanceMarking from "@/components/AttendanceMarking";
import AttendanceHistory from "@/components/AttendanceHistory";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const AttendanceManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("mark");
  const [weeklyStats, setWeeklyStats] = useState({ present: 0, total: 5 });
  const [monthlyStats, setMonthlyStats] = useState({ present: 0, absent: 0, rate: 0 });
  const [weeklyTrend, setWeeklyTrend] = useState<any[]>([]);
  const [punctualityStats, setPunctualityStats] = useState({ early: 0, onTime: 0, late: 0, rate: 0 });
  const [averageCheckIn, setAverageCheckIn] = useState("--:--");

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;

    // Get current week dates
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday

    // Get current month dates
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    try {
      // Fetch weekly data
      const { data: weeklyData } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startOfWeek.toISOString().split('T')[0])
        .lte('date', endOfWeek.toISOString().split('T')[0]);

      // Fetch monthly data
      const { data: monthlyData } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0]);

      // Process weekly stats
      const weeklyPresent = weeklyData?.filter(d => d.check_in).length || 0;
      setWeeklyStats({ present: weeklyPresent, total: 5 });

      // Process monthly stats
      const monthlyPresent = monthlyData?.filter(d => d.check_in).length || 0;
      const workingDaysInMonth = getWorkingDaysInMonth(now.getFullYear(), now.getMonth());
      const monthlyAbsent = workingDaysInMonth - monthlyPresent;
      const monthlyRate = workingDaysInMonth > 0 ? Math.round((monthlyPresent / workingDaysInMonth) * 100) : 0;
      
      setMonthlyStats({
        present: monthlyPresent,
        absent: monthlyAbsent,
        rate: monthlyRate
      });

      // Process weekly trend
      const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      const trend = daysOfWeek.map((day, index) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + index);
        const attendance = weeklyData?.find(d => d.date === date.toISOString().split('T')[0]);
        
        let status = 'Absent';
        if (attendance?.check_in) {
          const checkInTime = new Date(attendance.check_in);
          const hour = checkInTime.getHours();
          const minute = checkInTime.getMinutes();
          
          if (hour < 9 || (hour === 9 && minute <= 15)) {
            status = '✓';
          } else {
            status = 'Late';
          }
        }
        
        return { day, status, date: date.toISOString().split('T')[0] };
      });
      
      setWeeklyTrend(trend);

      // Process punctuality stats
      const attendedDays = monthlyData?.filter(d => d.check_in) || [];
      let early = 0, onTime = 0, late = 0;
      
      attendedDays.forEach(attendance => {
        if (attendance.check_in) {
          const checkInTime = new Date(attendance.check_in);
          const hour = checkInTime.getHours();
          const minute = checkInTime.getMinutes();
          
          if (hour < 9) {
            early++;
          } else if (hour === 9 && minute <= 15) {
            onTime++;
          } else {
            late++;
          }
        }
      });

      const totalAttended = attendedDays.length;
      const punctualityRate = totalAttended > 0 ? Math.round(((early + onTime) / totalAttended) * 100) : 0;
      
      setPunctualityStats({ early, onTime, late, rate: punctualityRate });

      // Calculate average check-in time
      if (attendedDays.length > 0) {
        const totalMinutes = attendedDays.reduce((sum, attendance) => {
          if (attendance.check_in) {
            const checkInTime = new Date(attendance.check_in);
            return sum + (checkInTime.getHours() * 60 + checkInTime.getMinutes());
          }
          return sum;
        }, 0);
        
        const avgMinutes = Math.round(totalMinutes / attendedDays.length);
        const avgHour = Math.floor(avgMinutes / 60);
        const avgMin = avgMinutes % 60;
        setAverageCheckIn(`${avgHour.toString().padStart(2, '0')}:${avgMin.toString().padStart(2, '0')}`);
      }

    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const getWorkingDaysInMonth = (year: number, month: number) => {
    const date = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    let workingDays = 0;
    
    while (date <= endDate) {
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Monday = 1, Friday = 5
        workingDays++;
      }
      date.setDate(date.getDate() + 1);
    }
    
    return workingDays;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Attendance Management</h1>
          <p className="text-muted-foreground">GPS-based attendance tracking and history</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mark" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Mark Attendance
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mark" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <AttendanceMarking />
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Quick Stats
                </CardTitle>
                <CardDescription>
                  Your attendance overview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                    <span className="text-sm font-medium">This Week</span>
                    <span className="text-lg font-bold text-primary">{weeklyStats.present}/{weeklyStats.total} days</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                    <span className="text-sm font-medium">This Month</span>
                    <span className="text-lg font-bold text-primary">{monthlyStats.present}/{monthlyStats.present + monthlyStats.absent} days</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                    <span className="text-sm font-medium">Average Check-in</span>
                    <span className="text-lg font-bold text-success">{averageCheckIn}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <AttendanceHistory />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Weekly Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {weeklyTrend.map((day, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{day.day}</span>
                      <span className={
                        day.status === '✓' ? 'text-success' : 
                        day.status === 'Late' ? 'text-warning' : 
                        'text-muted-foreground'
                      }>
                        {day.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Monthly Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{monthlyStats.rate}%</div>
                    <div className="text-sm text-muted-foreground">Attendance Rate</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center p-2 rounded bg-success/10">
                      <div className="font-semibold">{monthlyStats.present}</div>
                      <div className="text-muted-foreground">Present</div>
                    </div>
                    <div className="text-center p-2 rounded bg-destructive/10">
                      <div className="font-semibold">{monthlyStats.absent}</div>
                      <div className="text-muted-foreground">Absent</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Punctuality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">{punctualityStats.rate}%</div>
                    <div className="text-sm text-muted-foreground">On Time</div>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Early (before 9:00)</span>
                      <span className="font-semibold">{punctualityStats.early} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>On time (9:00-9:15)</span>
                      <span className="font-semibold">{punctualityStats.onTime} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Late (after 9:15)</span>
                      <span className="font-semibold">{punctualityStats.late} days</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AttendanceManagement;