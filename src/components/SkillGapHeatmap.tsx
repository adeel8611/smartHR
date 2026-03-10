import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Map,
    BookOpen,
    TrendingUp,
    Users,
    Brain,
    Target,
    ChevronRight,
    Star,
    Lightbulb,
    GraduationCap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SkillData {
    name: string;
    category: string;
    required: number;
    current: number;
    gap: number;
}

interface EmployeeSkillProfile {
    employeeId: string;
    name: string;
    department: string;
    role: string;
    skills: SkillData[];
    overallGap: number;
    learningPath: string[];
    suggestedTrainer: string;
}

const SKILL_CATEGORIES = ['Technical', 'Leadership', 'Communication', 'Analytics', 'Domain'];

const SKILL_DEFINITIONS: Record<string, { name: string; category: string }[]> = {
    'Engineering': [
        { name: 'Python', category: 'Technical' },
        { name: 'JavaScript', category: 'Technical' },
        { name: 'System Design', category: 'Technical' },
        { name: 'Code Review', category: 'Leadership' },
        { name: 'Technical Writing', category: 'Communication' },
        { name: 'Data Analysis', category: 'Analytics' },
        { name: 'DevOps', category: 'Domain' },
        { name: 'Testing', category: 'Technical' },
    ],
    'Marketing': [
        { name: 'SEO', category: 'Technical' },
        { name: 'Content Strategy', category: 'Domain' },
        { name: 'Analytics Tools', category: 'Analytics' },
        { name: 'Campaign Mgmt', category: 'Domain' },
        { name: 'Presentation', category: 'Communication' },
        { name: 'Market Research', category: 'Analytics' },
        { name: 'Brand Strategy', category: 'Leadership' },
        { name: 'Social Media', category: 'Technical' },
    ],
    'General': [
        { name: 'Project Mgmt', category: 'Leadership' },
        { name: 'Communication', category: 'Communication' },
        { name: 'Excel', category: 'Technical' },
        { name: 'Presentation', category: 'Communication' },
        { name: 'Problem Solving', category: 'Analytics' },
        { name: 'Team Work', category: 'Leadership' },
        { name: 'Time Mgmt', category: 'Domain' },
        { name: 'Reporting', category: 'Analytics' },
    ],
};

const LEARNING_COURSES: Record<string, string[]> = {
    'Python': ['Python Basics (Coursera)', 'Advanced Python in 30 Days', 'Python for Data Science'],
    'JavaScript': ['Modern JS Fundamentals', 'React Masterclass', 'Node.js Complete Guide'],
    'System Design': ['System Design Interview Prep', 'Scalable Architecture Patterns'],
    'SEO': ['SEO Foundations (Google)', 'Advanced SEO Strategies'],
    'Communication': ['Business Communication Skills', 'Public Speaking Mastery'],
    'Project Mgmt': ['PMP Certification Prep', 'Agile Scrum Master Course'],
    'Data Analysis': ['Data Analytics with Python', 'SQL for Analytics'],
    'Analytics Tools': ['Google Analytics 4 Cert', 'Mixpanel & Amplitude Mastery'],
    'Excel': ['Advanced Excel Formulas', 'Excel for Business Intelligence'],
    'DevOps': ['Docker & Kubernetes', 'CI/CD Pipeline Mastery'],
};

const SkillGapHeatmap = () => {
    const [employees, setEmployees] = useState<EmployeeSkillProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSkillProfile | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>('All');

    useEffect(() => {
        generateSkillData();
    }, []);

    const generateSkillData = async () => {
        setLoading(true);
        try {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('user_id, full_name, department, role')
                .in('role', ['admin', 'staff']);

            if (profiles && profiles.length > 0) {
                const trainers = profiles.filter(p => p.role === 'admin').map(p => p.full_name);

                const data: EmployeeSkillProfile[] = profiles.map(p => {
                    const dept = p.department || 'General';
                    const skillDefs = SKILL_DEFINITIONS[dept] || SKILL_DEFINITIONS['General'];

                    const skills: SkillData[] = skillDefs.map(sd => {
                        const required = 7 + Math.floor(Math.random() * 3);
                        const current = 2 + Math.floor(Math.random() * 8);
                        return {
                            name: sd.name,
                            category: sd.category,
                            required,
                            current: Math.min(current, 10),
                            gap: Math.max(0, required - current),
                        };
                    });

                    const overallGap = Math.round(skills.reduce((s, sk) => s + sk.gap, 0) / skills.length * 10);

                    // Generate learning path from top 3 gaps
                    const topGaps = [...skills].sort((a, b) => b.gap - a.gap).slice(0, 3);
                    const learningPath = topGaps.flatMap(g =>
                        (LEARNING_COURSES[g.name] || [`${g.name} Fundamentals`]).slice(0, 1)
                    );

                    return {
                        employeeId: p.user_id,
                        name: p.full_name,
                        department: dept,
                        role: p.role || 'staff',
                        skills,
                        overallGap,
                        learningPath,
                        suggestedTrainer: trainers[Math.floor(Math.random() * trainers.length)] || 'External Trainer',
                    };
                });

                data.sort((a, b) => b.overallGap - a.overallGap);
                setEmployees(data);
            }
        } catch (err) {
            console.error('Error generating skill data:', err);
        } finally {
            setLoading(false);
        }
    };

    const getGapColor = (gap: number) => {
        if (gap >= 5) return 'bg-red-500';
        if (gap >= 3) return 'bg-amber-500';
        if (gap >= 1) return 'bg-yellow-400';
        return 'bg-emerald-500';
    };

    const getGapTextColor = (gap: number) => {
        if (gap >= 5) return 'text-red-500';
        if (gap >= 3) return 'text-amber-500';
        if (gap >= 1) return 'text-yellow-600';
        return 'text-emerald-500';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center space-y-3">
                    <Map className="h-12 w-12 animate-pulse text-primary mx-auto" />
                    <p className="text-muted-foreground">Mapping skill gaps...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Map className="h-7 w-7 text-cyan-500" />
                        Skill Gap Heatmap & AI Learning Path
                    </h2>
                    <p className="text-muted-foreground mt-1">Visual skill analysis with auto-generated learning recommendations</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant={filterCategory === 'All' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterCategory('All')}
                    >
                        All
                    </Button>
                    {SKILL_CATEGORIES.map(cat => (
                        <Button
                            key={cat}
                            variant={filterCategory === cat ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterCategory(cat)}
                        >
                            {cat}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Heatmap Grid */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Skills vs Employees Heatmap
                    </CardTitle>
                    <CardDescription>Darker = larger gap. Click an employee for AI learning recommendations.</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <div className="min-w-[700px]">
                        {/* Legend */}
                        <div className="flex items-center gap-4 mb-4 text-sm">
                            <span className="text-muted-foreground">Gap Size:</span>
                            <div className="flex items-center gap-1"><div className="h-4 w-4 rounded bg-emerald-500" /> None</div>
                            <div className="flex items-center gap-1"><div className="h-4 w-4 rounded bg-yellow-400" /> Small</div>
                            <div className="flex items-center gap-1"><div className="h-4 w-4 rounded bg-amber-500" /> Medium</div>
                            <div className="flex items-center gap-1"><div className="h-4 w-4 rounded bg-red-500" /> Large</div>
                        </div>

                        {employees.slice(0, 10).map(emp => {
                            const filteredSkills = filterCategory === 'All'
                                ? emp.skills
                                : emp.skills.filter(s => s.category === filterCategory);

                            return (
                                <div
                                    key={emp.employeeId}
                                    className={`flex items-center gap-2 py-2 px-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${selectedEmployee?.employeeId === emp.employeeId ? 'bg-muted' : ''}`}
                                    onClick={() => setSelectedEmployee(emp)}
                                >
                                    <div className="w-32 text-sm font-medium truncate">{emp.name}</div>
                                    <div className="flex gap-1 flex-1">
                                        {filteredSkills.map((skill, i) => (
                                            <div
                                                key={i}
                                                className={`h-8 flex-1 rounded ${getGapColor(skill.gap)} opacity-80 hover:opacity-100 transition-opacity relative group`}
                                                title={`${skill.name}: ${skill.current}/${skill.required} (gap: ${skill.gap})`}
                                            >
                                                <div className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold opacity-0 group-hover:opacity-100">
                                                    {skill.gap}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className={`w-10 text-right text-sm font-bold ${getGapTextColor(emp.overallGap)}`}>
                                        {emp.overallGap}%
                                    </div>
                                </div>
                            );
                        })}

                        {/* Skill Labels */}
                        <div className="flex items-center gap-2 mt-2">
                            <div className="w-32" />
                            <div className="flex gap-1 flex-1">
                                {(filterCategory === 'All' ? employees[0]?.skills : employees[0]?.skills.filter(s => s.category === filterCategory))?.map((skill, i) => (
                                    <div key={i} className="flex-1 text-[10px] text-muted-foreground text-center truncate">
                                        {skill.name}
                                    </div>
                                ))}
                            </div>
                            <div className="w-10" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Selected Employee Detail */}
            {selectedEmployee && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Skill Detail */}
                    <Card className="shadow-lg">
                        <CardHeader className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-t-lg">
                            <CardTitle className="text-white">{selectedEmployee.name}</CardTitle>
                            <CardDescription className="text-white/80">{selectedEmployee.department} • Overall Gap: {selectedEmployee.overallGap}%</CardDescription>
                        </CardHeader>
                        <CardContent className="p-5 space-y-3">
                            {selectedEmployee.skills.map((skill, i) => (
                                <div key={i} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium">{skill.name} <Badge variant="outline" className="text-[10px] ml-1">{skill.category}</Badge></span>
                                        <span className={getGapTextColor(skill.gap)}>
                                            {skill.current}/{skill.required} {skill.gap > 0 && `(gap: ${skill.gap})`}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all duration-500"
                                            style={{ width: `${(skill.current / skill.required) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* AI Learning Path */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lightbulb className="h-5 w-5 text-yellow-500" />
                                AI-Generated Learning Path
                            </CardTitle>
                            <CardDescription>Personalized recommendations based on gap analysis</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {selectedEmployee.learningPath.map((course, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{course}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Complete within 30 days</p>
                                    </div>
                                </div>
                            ))}

                            <Alert className="border-cyan-500/30 bg-cyan-500/10">
                                <GraduationCap className="h-4 w-4" />
                                <AlertDescription className="text-sm">
                                    <strong>Suggested Internal Trainer:</strong> {selectedEmployee.suggestedTrainer}
                                </AlertDescription>
                            </Alert>

                            <Alert className="border-blue-500/30 bg-blue-500/10">
                                <Brain className="h-4 w-4" />
                                <AlertDescription className="text-sm">
                                    <strong>AI Insight:</strong> "{selectedEmployee.name} ko {selectedEmployee.skills.sort((a, b) => b.gap - a.gap)[0]?.name} basic course complete karna chahiye within 30 days"
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default SkillGapHeatmap;
