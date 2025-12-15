import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Calendar, 
  MapPin, 
  CheckCircle,
  AlertCircle,
  TrendingUp
} from "lucide-react";
import AttendanceMarking from "@/components/AttendanceMarking";
import AttendanceHistory from "@/components/AttendanceHistory";
import TodayMeetings from "@/components/TodayMeetings";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const StaffDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [attendanceStats, setAttendanceStats] = useState({
    thisMonth: {
      present: 0,
      total: 0,
      percentage: 0,
    },
    thisWeek: {
      present: 0,
      total: 0,
      percentage: 0,
    },
  });
  const [todayAttendance, setTodayAttendance] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchAttendanceStats();
    }
  }, [user]);

  // Add effect to refresh when attendance is marked
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        fetchAttendanceStats();
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [user]);

  const fetchAttendanceStats = async () => {
    if (!user) return;

    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      // Get start of month and week
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString().split('T')[0];

      // Fetch today's attendance
      const { data: todayData } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      setTodayAttendance(todayData);

      // Fetch month attendance
      const { data: monthData } = await supabase
        .from('attendance')
        .select('date')
        .eq('user_id', user.id)
        .gte('date', startOfMonth)
        .eq('status', 'present');

      // Fetch week attendance
      const { data: weekData } = await supabase
        .from('attendance')
        .select('date')
        .eq('user_id', user.id)
        .gte('date', startOfWeek)
        .eq('status', 'present');

      // Calculate working days
      const workingDaysInMonth = getWorkingDaysInMonth(now);
      const workingDaysInWeek = getWorkingDaysInWeek();

      setAttendanceStats({
        thisMonth: {
          present: monthData?.length || 0,
          total: workingDaysInMonth,
          percentage: Math.round(((monthData?.length || 0) / workingDaysInMonth) * 100),
        },
        thisWeek: {
          present: weekData?.length || 0,
          total: workingDaysInWeek,
          percentage: Math.round(((weekData?.length || 0) / workingDaysInWeek) * 100),
        },
      });
      
      console.log('Attendance Stats Updated:', {
        todayData,
        monthData: monthData?.length,
        weekData: weekData?.length,
        stats: {
          thisMonth: {
            present: monthData?.length || 0,
            total: workingDaysInMonth,
            percentage: Math.round(((monthData?.length || 0) / workingDaysInMonth) * 100),
          },
          thisWeek: {
            present: weekData?.length || 0,
            total: workingDaysInWeek,
            percentage: Math.round(((weekData?.length || 0) / workingDaysInWeek) * 100),
          },
        }
      });
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
    }
  };

  const getWorkingDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let workingDays = 0;

    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(year, month, i).getDay();
      if (day !== 0 && day !== 6) { // Not Sunday or Saturday
        workingDays++;
      }
    }
    return workingDays;
  };

  const getWorkingDaysInWeek = () => {
    return 5; // Monday to Friday
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'location':
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              toast({
                title: "Location Found",
                description: `Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`,
              });
            },
            (error) => {
              toast({
                title: "Location Error",
                description: "Could not get your current location",
                variant: "destructive",
              });
            }
          );
        } else {
          toast({
            title: "Location Not Supported",
            description: "Geolocation is not supported by this browser",
            variant: "destructive",
          });
        }
        break;
      case 'history':
        // Scroll to attendance history section
        const historyElement = document.querySelector('[data-section="attendance-history"]');
        if (historyElement) {
          historyElement.scrollIntoView({ behavior: 'smooth' });
        }
        toast({
          title: "Attendance History",
          description: "Scrolled to your attendance history",
        });
        break;
      case 'calendar':
        // Scroll to meetings section
        const meetingsElement = document.querySelector('[data-section="meetings"]');
        if (meetingsElement) {
          meetingsElement.scrollIntoView({ behavior: 'smooth' });
        }
        toast({
          title: "Today's Meetings",
          description: "Scrolled to your meetings section",
        });
        break;
      case 'leave':
        toast({
          title: "Leave Request",
          description: "Leave management feature coming soon!",
        });
        break;
      default:
        break;
    }
  };

  const todaySchedule = [
    {
      id: 1,
      title: "Daily Standup",
      time: "9:00 AM",
      duration: "30 min",
      platform: "Google Meet",
      status: "upcoming",
    },
    {
      id: 2,
      title: "Project Review",
      time: "2:00 PM",
      duration: "1 hour",
      platform: "Zoom",
      status: "upcoming",
    },
    {
      id: 3,
      title: "Team Meeting",
      time: "4:30 PM",
      duration: "45 min",
      platform: "Teams",
      status: "upcoming",
    },
  ];

  const recentAttendance = [
    { date: "Today", status: "not-marked", checkIn: null, checkOut: null },
    { date: "Yesterday", status: "present", checkIn: "9:15 AM", checkOut: "6:30 PM" },
    { date: "Jan 19", status: "present", checkIn: "9:00 AM", checkOut: "6:45 PM" },
    { date: "Jan 18", status: "late", checkIn: "9:45 AM", checkOut: "6:30 PM" },
    { date: "Jan 17", status: "present", checkIn: "8:55 AM", checkOut: "6:15 PM" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back!</h1>
          <p className="text-muted-foreground">{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>
      </div>

      {/* Attendance Status */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Status</CardTitle>
            <AlertCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${todayAttendance?.check_in ? 'text-success' : 'text-warning'}`}>
              {todayAttendance?.check_in ? 'Present' : 'Not Marked'}
            </div>
            <p className="text-xs text-muted-foreground">
              {todayAttendance?.check_in ? 'Checked in today' : 'Please mark your attendance'}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceStats.thisWeek.percentage}%</div>
            <p className="text-xs text-muted-foreground">
              {attendanceStats.thisWeek.present}/{attendanceStats.thisWeek.total} days present
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceStats.thisMonth.percentage}%</div>
            <p className="text-xs text-muted-foreground">
              {attendanceStats.thisMonth.present}/{attendanceStats.thisMonth.total} days present
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* GPS Attendance Marking */}
        <AttendanceMarking />

        {/* Weekly Attendance History */}
        <div data-section="attendance-history">
          <AttendanceHistory />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Meetings */}
        <div data-section="meetings">
          <TodayMeetings />
        </div>

        {/* Quick Actions */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2"
                onClick={() => handleQuickAction('location')}
              >
                <MapPin className="h-6 w-6" />
                <span className="text-sm">Check Location</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2"
                onClick={() => handleQuickAction('history')}
              >
                <Clock className="h-6 w-6" />
                <span className="text-sm">View History</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2"
                onClick={() => handleQuickAction('calendar')}
              >
                <Calendar className="h-6 w-6" />
                <span className="text-sm">My Calendar</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2"
                onClick={() => handleQuickAction('leave')}
              >
                <CheckCircle className="h-6 w-6" />
                <span className="text-sm">Request Leave</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

export default StaffDashboard;