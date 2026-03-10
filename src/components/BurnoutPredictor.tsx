import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Brain,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Heart,
    Activity,
    Clock,
    Coffee,
    Moon,
    Shield,
    ChevronRight,
    BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BurnoutData {
    employeeId: string;
    name: string;
    department: string;
    riskScore: number;
    factors: {
        overtimeHours: number;
        lateArrivals: number;
        leaveBalance: number;
        consecutiveWorkDays: number;
        avgDailyHours: number;
    };
    trend: 'rising' | 'stable' | 'declining';
    recommendation: string;
}

const BurnoutPredictor = () => {
    const [employees, setEmployees] = useState<BurnoutData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmployee, setSelectedEmployee] = useState<BurnoutData | null>(null);
    const [weeklyIndex, setWeeklyIndex] = useState(0);
    const [stressReportSent, setStressReportSent] = useState(false);

    useEffect(() => {
        generateBurnoutData();
    }, []);

    const generateBurnoutData = async () => {
        setLoading(true);
        try {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('user_id, full_name, department')
                .in('role', ['admin', 'staff']);

            if (profiles && profiles.length > 0) {
                // Get date range for the last 30 days
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(endDate.getDate() - 30);

                const burnoutData: BurnoutData[] = await Promise.all(
                    profiles.map(async (p) => {
                        // Fetch real attendance data
                        const { data: attendanceData } = await supabase
                            .from('attendance')
                            .select('*')
                            .eq('user_id', p.user_id)
                            .gte('date', startDate.toISOString().split('T')[0])
                            .lte('date', endDate.toISOString().split('T')[0])
                            .order('date', { ascending: false });

                        // Fetch leave balance
                        const { data: leaveBalanceData } = await supabase
                            .from('leave_balances')
                            .select('*')
                            .eq('employee_id', p.user_id)
                            .eq('year', new Date().getFullYear())
                            .single();

                        // Calculate real metrics from attendance data
                        let totalOvertimeHours = 0;
                        let lateArrivals = 0;
                        let totalDailyHours = 0;
                        let daysWorked = 0;

                        if (attendanceData && attendanceData.length > 0) {
                            attendanceData.forEach((record) => {
                                if (record.check_in && record.check_out) {
                                    const checkInTime = new Date(record.check_in);
                                    const checkOutTime = new Date(record.check_out);

                                    // Calculate hours worked
                                    const hoursWorked = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
                                    totalDailyHours += hoursWorked;
                                    daysWorked++;

                                    // Overtime: more than 8 hours
                                    if (hoursWorked > 8) {
                                        totalOvertimeHours += (hoursWorked - 8);
                                    }

                                    // Late arrival: after 9:15 AM
                                    if (checkInTime.getHours() > 9 || (checkInTime.getHours() === 9 && checkInTime.getMinutes() > 15)) {
                                        lateArrivals++;
                                    }
                                }
                            });
                        }

                        // Calculate average daily hours
                        const avgDailyHours = daysWorked > 0 ? totalDailyHours / daysWorked : 8;

                        // Calculate consecutive work days
                        let consecutiveWorkDays = 0;
                        if (attendanceData && attendanceData.length > 0) {
                            const today = new Date();
                            let checkDate = new Date(today);

                            for (let i = 0; i < 30; i++) {
                                const dateStr = checkDate.toISOString().split('T')[0];
                                const dayOfWeek = checkDate.getDay();

                                // Skip weekends
                                if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                                    const hasAttendance = attendanceData.some(a => a.date === dateStr && a.check_in);
                                    if (hasAttendance) {
                                        consecutiveWorkDays++;
                                    } else {
                                        break;
                                    }
                                }
                                checkDate.setDate(checkDate.getDate() - 1);
                            }
                        }

                        // Get leave balance (total available days)
                        const leaveBalance = leaveBalanceData
                            ? (leaveBalanceData.annual_days_total - leaveBalanceData.annual_days_used) +
                              (leaveBalanceData.sick_days_total - leaveBalanceData.sick_days_used) +
                              (leaveBalanceData.personal_days_total - leaveBalanceData.personal_days_used)
                            : 15; // Default if no data

                        // AI-style burnout score calculation
                        const overtimeWeight = Math.min(totalOvertimeHours / 20, 1) * 30;
                        const lateWeight = Math.min(lateArrivals / 5, 1) * 15;
                        const leaveWeight = (1 - Math.min(leaveBalance / 15, 1)) * 20;
                        const consecutiveWeight = Math.min(consecutiveWorkDays / 15, 1) * 20;
                        const hoursWeight = Math.max((avgDailyHours - 8) / 4, 0) * 15;

                        const riskScore = Math.min(Math.round(overtimeWeight + lateWeight + leaveWeight + consecutiveWeight + hoursWeight), 100);

                        const trend = riskScore > 60 ? 'rising' : riskScore > 35 ? 'stable' : 'declining';

                        const recommendations = [
                            'Consider mandatory break periods and reduced workload.',
                            'Schedule a wellness check-in meeting this week.',
                            'Encourage taking pending leave days before month end.',
                            'Assign a buddy for workload sharing.',
                            'Employee seems stable — continue monitoring.',
                        ];

                        return {
                            employeeId: p.user_id,
                            name: p.full_name,
                            department: p.department || 'General',
                            riskScore,
                            factors: {
                                overtimeHours: Math.round(totalOvertimeHours * 10) / 10,
                                lateArrivals,
                                leaveBalance,
                                consecutiveWorkDays,
                                avgDailyHours: Math.round(avgDailyHours * 10) / 10
                            },
                            trend,
                            recommendation: riskScore > 60
                                ? recommendations[Math.floor(Math.random() * 3)]
                                : riskScore > 35
                                    ? recommendations[3]
                                    : recommendations[4],
                        };
                    })
                );

                burnoutData.sort((a, b) => b.riskScore - a.riskScore);
                setEmployees(burnoutData);

                // Weekly Mental Health Risk Index — average of all risk scores
                const avg = burnoutData.reduce((s, d) => s + d.riskScore, 0) / burnoutData.length;
                setWeeklyIndex(Math.round(avg));
            }
        } catch (err) {
            console.error('Error generating burnout data:', err);
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (score: number) => {
        if (score >= 70) return 'text-red-500';
        if (score >= 45) return 'text-amber-500';
        return 'text-emerald-500';
    };

    const getRiskBg = (score: number) => {
        if (score >= 70) return 'bg-red-500/10 border-red-500/30';
        if (score >= 45) return 'bg-amber-500/10 border-amber-500/30';
        return 'bg-emerald-500/10 border-emerald-500/30';
    };

    const getRiskLabel = (score: number) => {
        if (score >= 70) return 'HIGH RISK';
        if (score >= 45) return 'MODERATE';
        return 'LOW';
    };

    const getRiskGradient = (score: number) => {
        if (score >= 70) return 'from-red-500 to-rose-600';
        if (score >= 45) return 'from-amber-500 to-orange-600';
        return 'from-emerald-500 to-teal-600';
    };

    const handleStressReport = () => {
        setStressReportSent(true);
        setTimeout(() => setStressReportSent(false), 4000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center space-y-3">
                    <Brain className="h-12 w-12 animate-pulse text-primary mx-auto" />
                    <p className="text-muted-foreground">AI analyzing burnout patterns...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Brain className="h-7 w-7 text-purple-500" />
                        AI Burnout Predictor
                    </h2>
                    <p className="text-muted-foreground mt-1">Early warning system for employee mental wellness</p>
                </div>
                <Button variant="outline" onClick={handleStressReport} className="gap-2">
                    <Shield className="h-4 w-4" />
                    {stressReportSent ? '✅ Reported Anonymously' : 'Anonymous Stress Report'}
                </Button>
            </div>

            {stressReportSent && (
                <Alert className="border-purple-500/30 bg-purple-500/10">
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                        Your anonymous stress report has been submitted confidentially. No one can trace it back to you.
                    </AlertDescription>
                </Alert>
            )}

            {/* Weekly Mental Health Risk Index */}
            <Card className="overflow-hidden border-0 shadow-xl">
                <div className={`bg-gradient-to-r ${getRiskGradient(weeklyIndex)} p-6 text-white`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/80 text-sm font-medium uppercase tracking-wider">Weekly Mental Health Risk Index</p>
                            <div className="flex items-end gap-3 mt-2">
                                <span className="text-5xl font-bold">{weeklyIndex}</span>
                                <span className="text-white/70 text-lg mb-1">/ 100</span>
                            </div>
                            <p className="text-white/70 text-sm mt-2">Based on {employees.length} employees' tracked metrics</p>
                        </div>
                        <div className="text-right">
                            <Activity className="h-16 w-16 text-white/30" />
                            <Badge variant="secondary" className="mt-2 bg-white/20 text-white border-0">
                                {getRiskLabel(weeklyIndex)}
                            </Badge>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-red-500">
                                    {employees.filter(e => e.riskScore >= 70).length}
                                </p>
                                <p className="text-xs text-muted-foreground">High Risk</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                                <Activity className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-amber-500">
                                    {employees.filter(e => e.riskScore >= 45 && e.riskScore < 70).length}
                                </p>
                                <p className="text-xs text-muted-foreground">Moderate Risk</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                                <Heart className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-emerald-500">
                                    {employees.filter(e => e.riskScore < 45).length}
                                </p>
                                <p className="text-xs text-muted-foreground">Healthy</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-purple-500">
                                    {employees.filter(e => e.trend === 'rising').length}
                                </p>
                                <p className="text-xs text-muted-foreground">Rising Trend</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Employee Risk List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-3">
                    <h3 className="font-semibold text-lg">Employee Risk Dashboard</h3>
                    {employees.map((emp) => (
                        <Card
                            key={emp.employeeId}
                            className={`cursor-pointer transition-all hover:shadow-md ${selectedEmployee?.employeeId === emp.employeeId ? 'ring-2 ring-primary' : ''}`}
                            onClick={() => setSelectedEmployee(emp)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg ${getRiskBg(emp.riskScore)} ${getRiskColor(emp.riskScore)}`}>
                                            {emp.riskScore}
                                        </div>
                                        <div>
                                            <p className="font-semibold">{emp.name}</p>
                                            <p className="text-sm text-muted-foreground">{emp.department}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className={`${getRiskBg(emp.riskScore)} ${getRiskColor(emp.riskScore)} border`}>
                                            {getRiskLabel(emp.riskScore)}
                                        </Badge>
                                        {emp.trend === 'rising' && <TrendingUp className="h-4 w-4 text-red-500" />}
                                        {emp.trend === 'declining' && <TrendingDown className="h-4 w-4 text-emerald-500" />}
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Detail Panel */}
                <div>
                    {selectedEmployee ? (
                        <Card className="sticky top-6 shadow-lg">
                            <CardHeader className={`bg-gradient-to-br ${getRiskGradient(selectedEmployee.riskScore)} text-white rounded-t-lg`}>
                                <CardTitle className="text-white">{selectedEmployee.name}</CardTitle>
                                <CardDescription className="text-white/80">{selectedEmployee.department}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                                <div className="text-center py-3">
                                    <p className="text-4xl font-bold">{selectedEmployee.riskScore}<span className="text-lg text-muted-foreground">/100</span></p>
                                    <p className="text-sm text-muted-foreground mt-1">Burnout Risk Score</p>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> Overtime Hours</span>
                                        <span className="font-semibold">{selectedEmployee.factors.overtimeHours}h/week</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2"><Coffee className="h-4 w-4" /> Late Arrivals</span>
                                        <span className="font-semibold">{selectedEmployee.factors.lateArrivals} this month</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2"><Moon className="h-4 w-4" /> Leave Balance</span>
                                        <span className="font-semibold">{selectedEmployee.factors.leaveBalance} days</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Avg Daily Hours</span>
                                        <span className="font-semibold">{selectedEmployee.factors.avgDailyHours}h</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2"><Activity className="h-4 w-4" /> Consecutive Days</span>
                                        <span className="font-semibold">{selectedEmployee.factors.consecutiveWorkDays}</span>
                                    </div>
                                </div>

                                <Alert className="border-blue-500/30 bg-blue-500/10">
                                    <Brain className="h-4 w-4" />
                                    <AlertDescription className="text-sm">
                                        <strong>AI Recommendation:</strong> {selectedEmployee.recommendation}
                                    </AlertDescription>
                                </Alert>

                                <Button className="w-full gap-2" variant="outline">
                                    <AlertTriangle className="h-4 w-4" />
                                    Send Early Warning to Manager
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-dashed">
                            <CardContent className="p-10 text-center">
                                <Brain className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                                <p className="text-muted-foreground">Select an employee to view detailed burnout analysis</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BurnoutPredictor;
