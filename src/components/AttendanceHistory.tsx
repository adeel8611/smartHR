import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AttendanceRecord {
  id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  location_address: string | null;
}

const AttendanceHistory = () => {
  const { user } = useAuth();
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [weekStats, setWeekStats] = useState({ present: 0, total: 0, percentage: 0 });

  useEffect(() => {
    if (user) {
      fetchAttendanceHistory();
    }
  }, [user]);

  const fetchAttendanceHistory = async () => {
    if (!user) return;

    // Get past week dates (excluding weekends)
    const dates = getWeekDates();
    
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', dates[0])
      .lte('date', dates[dates.length - 1])
      .order('date', { ascending: false });

    if (!error && data) {
      // Create complete week records including missing days
      const completeHistory = dates.map(date => {
        const existingRecord = data.find(record => record.date === date);
        return existingRecord || {
          id: `missing-${date}`,
          date,
          check_in: null,
          check_out: null,
          status: 'absent',
          location_address: null
        };
      });

      setAttendanceHistory(completeHistory);

      // Calculate stats
      const presentDays = completeHistory.filter(record => record.check_in).length;
      const totalDays = completeHistory.length;
      const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      setWeekStats({
        present: presentDays,
        total: totalDays,
        percentage
      });
    }
  };

  const getWeekDates = () => {
    const dates = [];
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate days back to Monday of this week
    const daysBackToMonday = currentDay === 0 ? 6 : currentDay - 1;
    
    for (let i = daysBackToMonday; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    
    return dates;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];

    if (dateString === today) return 'Today';
    if (dateString === yesterdayString) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return null;
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (record: AttendanceRecord) => {
    if (record.check_in) {
      const checkInTime = new Date(record.check_in);
      const cutoffTime = new Date(checkInTime);
      cutoffTime.setHours(9, 15, 0, 0); // 9:15 AM cutoff for late
      
      return checkInTime > cutoffTime ? 'bg-warning' : 'bg-success';
    }
    return 'bg-destructive';
  };

  const getStatusText = (record: AttendanceRecord) => {
    if (!record.check_in) return 'Absent';
    
    const checkInTime = new Date(record.check_in);
    const cutoffTime = new Date(checkInTime);
    cutoffTime.setHours(9, 15, 0, 0);
    
    return checkInTime > cutoffTime ? 'Late' : 'Present';
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Weekly Attendance
        </CardTitle>
        <CardDescription>
          Your attendance record for this week
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Weekly Stats */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
          <div>
            <p className="text-sm text-muted-foreground">This Week</p>
            <p className="text-2xl font-bold">{weekStats.percentage}%</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {weekStats.present}/{weekStats.total} days
            </p>
            <Badge variant={weekStats.percentage >= 80 ? 'default' : 'destructive'}>
              {weekStats.percentage >= 80 ? 'Good' : 'Needs Improvement'}
            </Badge>
          </div>
        </div>

        {/* Daily Records */}
        <div className="space-y-3">
          {attendanceHistory.map((record) => (
            <div key={record.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(record)}`} />
                <div>
                  <p className="font-medium">{formatDate(record.date)}</p>
                  <p className="text-xs text-muted-foreground">
                    {getStatusText(record)}
                  </p>
                </div>
              </div>
              <div className="text-right text-sm">
                {record.check_in ? (
                  <div>
                    <p className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      In: {formatTime(record.check_in)}
                    </p>
                    {record.check_out && (
                      <p className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Out: {formatTime(record.check_out)}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Not marked</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceHistory;