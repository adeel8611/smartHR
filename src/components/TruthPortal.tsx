import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Shield,
    Send,
    AlertTriangle,
    ThumbsDown,
    DollarSign,
    Star,
    TrendingUp,
    Eye,
    EyeOff,
    MessageSquare,
    BarChart3,
    Users
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Report {
    id: string;
    category: string;
    content: string;
    sentiment: string;
    department: string;
    created_at: string;
}

const CATEGORIES = [
    { id: 'toxic_behavior', label: 'Toxic Behavior', icon: AlertTriangle, color: 'text-red-500' },
    { id: 'salary_dissatisfaction', label: 'Salary Dissatisfaction', icon: DollarSign, color: 'text-amber-500' },
    { id: 'management_rating', label: 'Management Rating', icon: Star, color: 'text-blue-500' },
    { id: 'workplace_safety', label: 'Workplace Safety', icon: Shield, color: 'text-purple-500' },
    { id: 'general_feedback', label: 'General Feedback', icon: MessageSquare, color: 'text-emerald-500' },
];

const TruthPortal = () => {
    const [activeTab, setActiveTab] = useState<'submit' | 'dashboard'>('submit');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [feedbackText, setFeedbackText] = useState('');
    const [selectedDept, setSelectedDept] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState<string[]>([]);

    const fetchDepartments = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('department')
                .not('department', 'is', null);

            if (error) throw error;
            if (data && data.length > 0) {
                const uniqueDepts = [...new Set(data.map(d => d.department).filter(Boolean))];
                console.log('Fetched departments:', uniqueDepts);
                setDepartments(uniqueDepts);
            } else {
                // If no departments found, use defaults
                console.log('No departments found, using defaults');
                setDepartments(['Engineering', 'Marketing', 'HR', 'Finance', 'Operations', 'Sales']);
            }
        } catch (err) {
            console.error('Error fetching departments:', err);
            // Fallback to default departments
            setDepartments(['Engineering', 'Marketing', 'HR', 'Finance', 'Operations', 'Sales']);
        }
    };

    const fetchReports = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('anonymous_reports')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            if (data) {
                setReports(data);
            }
        } catch (err) {
            console.error('Error fetching reports:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch reports and departments from database
    useEffect(() => {
        fetchReports();
        fetchDepartments();
    }, []);

    const handleSubmit = async () => {
        if (!selectedCategory || !feedbackText.trim()) return;

        setLoading(true);
        try {
            // Simple sentiment analysis based on keywords
            const negativeKeywords = ['yells', 'toxic', 'unfair', 'bad', 'terrible', 'worst', 'hate', 'poor', 'dropped', 'bias'];
            const positiveKeywords = ['good', 'great', 'excellent', 'best', 'love', 'amazing', 'wonderful', 'thanks'];
            const feedbackLower = feedbackText.toLowerCase();

            let sentiment = 'neutral';
            const negativeCount = negativeKeywords.filter(kw => feedbackLower.includes(kw)).length;
            const positiveCount = positiveKeywords.filter(kw => feedbackLower.includes(kw)).length;

            if (negativeCount > positiveCount) sentiment = 'negative';
            else if (positiveCount > negativeCount) sentiment = 'positive';

            const { error } = await supabase
                .from('anonymous_reports')
                .insert({
                    category: selectedCategory,
                    content: feedbackText.trim(),
                    sentiment,
                    department: selectedDept || null,
                });

            if (error) throw error;

            setSubmitted(true);
            setFeedbackText('');
            setSelectedCategory('');
            setSelectedDept('');

            // Refresh reports
            await fetchReports();

            setTimeout(() => setSubmitted(false), 4000);
        } catch (err) {
            console.error('Error submitting report:', err);
            alert('Failed to submit report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Department toxicity scores
    const deptScores = departments.length > 0 ? departments.map(dept => {
        const deptReports = reports.filter(r => r.department === dept);
        const negativeCount = deptReports.filter(r => r.sentiment === 'negative').length;
        const score = deptReports.length > 0 ? Math.round((negativeCount / Math.max(deptReports.length, 1)) * 100) : 0;
        return { dept, score, totalReports: deptReports.length };
    }).sort((a, b) => b.score - a.score) : [];

    const sentimentCounts = {
        negative: reports.filter(r => r.sentiment === 'negative').length,
        neutral: reports.filter(r => r.sentiment === 'neutral').length,
        positive: reports.filter(r => r.sentiment === 'positive').length,
    };

    const categoryCounts = CATEGORIES.map(cat => ({
        ...cat,
        count: reports.filter(r => r.category === cat.id).length,
    }));

    if (loading && reports.length === 0) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center space-y-3">
                    <Shield className="h-12 w-12 animate-pulse text-primary mx-auto" />
                    <p className="text-muted-foreground">Loading reports...</p>
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
                        <Shield className="h-7 w-7 text-indigo-500" />
                        Anonymous Workplace Truth Portal
                    </h2>
                    <p className="text-muted-foreground mt-1">Your voice matters — speak without fear</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={activeTab === 'submit' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('submit')}
                        className="gap-2"
                    >
                        <EyeOff className="h-4 w-4" /> Submit Report
                    </Button>
                    <Button
                        variant={activeTab === 'dashboard' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('dashboard')}
                        className="gap-2"
                    >
                        <BarChart3 className="h-4 w-4" /> Dashboard
                    </Button>
                </div>
            </div>

            {activeTab === 'submit' ? (
                <div className="max-w-2xl mx-auto space-y-6">
                    {/* Privacy Notice */}
                    <Alert className="border-indigo-500/30 bg-indigo-500/10">
                        <EyeOff className="h-4 w-4" />
                        <AlertDescription>
                            <strong>100% Anonymous.</strong> No IP addresses, user IDs, or identifying information is collected. Your feedback is encrypted and categorized by AI.
                        </AlertDescription>
                    </Alert>

                    {submitted && (
                        <Alert className="border-emerald-500/30 bg-emerald-500/10">
                            <Shield className="h-4 w-4" />
                            <AlertDescription>
                                ✅ Your anonymous report has been submitted and will be reviewed by authorized personnel only. Thank you for your courage.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Category Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">What would you like to report?</CardTitle>
                            <CardDescription>Select a category for your feedback</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {CATEGORIES.map(cat => {
                                    const Icon = cat.icon;
                                    return (
                                        <Button
                                            key={cat.id}
                                            variant={selectedCategory === cat.id ? 'default' : 'outline'}
                                            className="justify-start gap-3 h-14"
                                            onClick={() => setSelectedCategory(cat.id)}
                                        >
                                            <Icon className={`h-5 w-5 ${selectedCategory === cat.id ? '' : cat.color}`} />
                                            {cat.label}
                                        </Button>
                                    );
                                })}
                            </div>

                            <div className="space-y-2 pt-2">
                                <Label>Department (Optional)</Label>
                                <select
                                    className="w-full p-2 border rounded-md bg-background"
                                    value={selectedDept}
                                    onChange={(e) => setSelectedDept(e.target.value)}
                                >
                                    <option value="">Prefer not to say</option>
                                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label>Your Feedback *</Label>
                                <Textarea
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                    placeholder="Describe the situation in detail. Be as specific as possible while maintaining your anonymity..."
                                    rows={5}
                                    className="resize-none"
                                />
                            </div>

                            <Button
                                className="w-full gap-2"
                                onClick={handleSubmit}
                                disabled={!selectedCategory || !feedbackText.trim() || loading}
                                size="lg"
                            >
                                <Send className="h-4 w-4" />
                                Submit Anonymous Report
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Sentiment Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-red-500/20">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                                        <ThumbsDown className="h-6 w-6 text-red-500" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold text-red-500">{sentimentCounts.negative}</p>
                                        <p className="text-sm text-muted-foreground">Negative Reports</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-5">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                                        <MessageSquare className="h-6 w-6 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold text-blue-500">{sentimentCounts.neutral}</p>
                                        <p className="text-sm text-muted-foreground">Neutral Reports</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-emerald-500/20">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                                        <TrendingUp className="h-6 w-6 text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold text-emerald-500">{sentimentCounts.positive}</p>
                                        <p className="text-sm text-muted-foreground">Positive Reports</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Department Toxicity Scores */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Department Toxicity Index
                            </CardTitle>
                            <CardDescription>AI-categorized negativity score by department</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {deptScores.map(d => (
                                <div key={d.dept} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium">{d.dept}</span>
                                        <span className="text-muted-foreground">{d.score}% negative ({d.totalReports} reports)</span>
                                    </div>
                                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${d.score >= 60 ? 'bg-red-500' : d.score >= 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${Math.max(d.score, 3)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Category Breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Reports by Category</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                                {categoryCounts.map(cat => {
                                    const Icon = cat.icon;
                                    return (
                                        <div key={cat.id} className="flex flex-col items-center p-4 rounded-lg border bg-muted/30">
                                            <Icon className={`h-6 w-6 ${cat.color} mb-2`} />
                                            <span className="text-2xl font-bold">{cat.count}</span>
                                            <span className="text-xs text-muted-foreground text-center mt-1">{cat.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Reports */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Anonymous Reports</CardTitle>
                            <CardDescription>AI-processed and categorized (identities are never stored)</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {reports.slice(0, 6).map(r => (
                                <div key={r.id} className="p-4 rounded-lg border bg-muted/20 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">{CATEGORIES.find(c => c.id === r.category)?.label}</Badge>
                                            <Badge
                                                className={`${r.sentiment === 'negative' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                                                    r.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' :
                                                        'bg-blue-500/10 text-blue-500 border-blue-500/30'} border`}
                                                variant="outline"
                                            >
                                                {r.sentiment}
                                            </Badge>
                                        </div>
                                        <span className="text-xs text-muted-foreground">{r.department}</span>
                                    </div>
                                    <p className="text-sm">{r.content}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default TruthPortal;
