import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Briefcase,
    Users,
    Brain,
    Star,
    Target,
    ArrowRight,
    Zap,
    Trophy,
    Search,
    CheckCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Project {
    id: string;
    title: string;
    department: string;
    description: string;
    requiredSkills: string[];
    duration: string;
    status: 'open' | 'in_progress' | 'closed';
    applicants: number;
    postedBy: string;
}

interface EmployeeMatch {
    employeeId: string;
    name: string;
    department: string;
    matchScore: number;
    matchedSkills: string[];
    missingSkills: string[];
}

const MOCK_PROJECTS: Project[] = [
    {
        id: 'p1', title: 'Customer Portal Redesign', department: 'Engineering',
        description: 'Redesign the customer-facing portal with modern React components and improved UX.',
        requiredSkills: ['React', 'TypeScript', 'UI/UX', 'Testing'],
        duration: '3 months', status: 'open', applicants: 5, postedBy: 'Engineering Lead'
    },
    {
        id: 'p2', title: 'Q2 Marketing Campaign', department: 'Marketing',
        description: 'Plan and execute the Q2 digital marketing campaign across all channels.',
        requiredSkills: ['SEO', 'Content Strategy', 'Analytics', 'Social Media'],
        duration: '2 months', status: 'open', applicants: 3, postedBy: 'Marketing Director'
    },
    {
        id: 'p3', title: 'Data Pipeline Migration', department: 'Engineering',
        description: 'Migrate existing ETL pipelines to modern cloud-based infrastructure.',
        requiredSkills: ['Python', 'AWS', 'SQL', 'DevOps'],
        duration: '4 months', status: 'open', applicants: 2, postedBy: 'CTO'
    },
    {
        id: 'p4', title: 'Employee Wellness Program', department: 'HR',
        description: 'Design and implement a comprehensive employee wellness initiative.',
        requiredSkills: ['Project Management', 'Communication', 'Event Planning', 'Budgeting'],
        duration: '6 months', status: 'in_progress', applicants: 7, postedBy: 'HR Manager'
    },
    {
        id: 'p5', title: 'Financial Reporting Automation', department: 'Finance',
        description: 'Automate monthly financial reporting with dashboards and alerts.',
        requiredSkills: ['Excel', 'Power BI', 'SQL', 'Financial Analysis'],
        duration: '2 months', status: 'open', applicants: 1, postedBy: 'CFO'
    },
];

const TalentMarketplace = () => {
    const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [matches, setMatches] = useState<EmployeeMatch[]>([]);
    const [loading, setLoading] = useState(false);
    const [applied, setApplied] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState<'all' | 'open' | 'in_progress'>('all');

    const generateMatches = async (project: Project) => {
        setLoading(true);
        setSelectedProject(project);

        try {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('user_id, full_name, department')
                .in('role', ['admin', 'staff']);

            if (profiles) {
                const mockSkillSets: Record<string, string[]> = {};
                const allSkills = ['React', 'TypeScript', 'Python', 'SQL', 'DevOps', 'AWS', 'SEO',
                    'Content Strategy', 'Analytics', 'Social Media', 'UI/UX', 'Testing',
                    'Project Management', 'Communication', 'Event Planning', 'Budgeting',
                    'Excel', 'Power BI', 'Financial Analysis'];

                profiles.forEach(p => {
                    const count = 4 + Math.floor(Math.random() * 6);
                    const shuffled = [...allSkills].sort(() => Math.random() - 0.5);
                    mockSkillSets[p.user_id] = shuffled.slice(0, count);
                });

                const employeeMatches: EmployeeMatch[] = profiles.map(p => {
                    const empSkills = mockSkillSets[p.user_id] || [];
                    const matched = project.requiredSkills.filter(s => empSkills.includes(s));
                    const missing = project.requiredSkills.filter(s => !empSkills.includes(s));
                    const matchScore = Math.round((matched.length / project.requiredSkills.length) * 100);

                    return {
                        employeeId: p.user_id,
                        name: p.full_name,
                        department: p.department || 'General',
                        matchScore,
                        matchedSkills: matched,
                        missingSkills: missing,
                    };
                });

                employeeMatches.sort((a, b) => b.matchScore - a.matchScore);
                setMatches(employeeMatches);
            }
        } catch (err) {
            console.error('Error generating matches:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = (projectId: string) => {
        setApplied(prev => new Set([...prev, projectId]));
    };

    const filteredProjects = filter === 'all' ? projects : projects.filter(p => p.status === filter);

    const getMatchColor = (score: number) => {
        if (score >= 75) return 'text-emerald-500';
        if (score >= 50) return 'text-amber-500';
        return 'text-red-500';
    };

    const getMatchBg = (score: number) => {
        if (score >= 75) return 'bg-emerald-500/10 border-emerald-500/30';
        if (score >= 50) return 'bg-amber-500/10 border-amber-500/30';
        return 'bg-red-500/10 border-red-500/30';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Briefcase className="h-7 w-7 text-orange-500" />
                        Internal Talent Marketplace
                    </h2>
                    <p className="text-muted-foreground mt-1">Discover internal opportunities — grow without leaving</p>
                </div>
                <div className="flex gap-2">
                    <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>All</Button>
                    <Button variant={filter === 'open' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('open')}>Open</Button>
                    <Button variant={filter === 'in_progress' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('in_progress')}>In Progress</Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="overflow-hidden border-0 shadow-lg">
                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-5 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/80 text-sm">Open Projects</p>
                                <p className="text-3xl font-bold mt-1">{projects.filter(p => p.status === 'open').length}</p>
                            </div>
                            <Briefcase className="h-10 w-10 text-white/30" />
                        </div>
                    </div>
                </Card>
                <Card className="overflow-hidden border-0 shadow-lg">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-5 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/80 text-sm">Total Applicants</p>
                                <p className="text-3xl font-bold mt-1">{projects.reduce((s, p) => s + p.applicants, 0)}</p>
                            </div>
                            <Users className="h-10 w-10 text-white/30" />
                        </div>
                    </div>
                </Card>
                <Card className="overflow-hidden border-0 shadow-lg">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-5 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/80 text-sm">AI Matches Available</p>
                                <p className="text-3xl font-bold mt-1">{matches.filter(m => m.matchScore >= 50).length || '—'}</p>
                            </div>
                            <Brain className="h-10 w-10 text-white/30" />
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Project List */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Search className="h-5 w-5" /> Available Projects
                    </h3>
                    {filteredProjects.map(project => (
                        <Card
                            key={project.id}
                            className={`cursor-pointer transition-all hover:shadow-md ${selectedProject?.id === project.id ? 'ring-2 ring-primary' : ''}`}
                            onClick={() => generateMatches(project)}
                        >
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h4 className="font-semibold text-base">{project.title}</h4>
                                        <p className="text-sm text-muted-foreground">{project.department} • {project.duration}</p>
                                    </div>
                                    <Badge variant={project.status === 'open' ? 'default' : 'secondary'}>
                                        {project.status === 'open' ? 'Open' : 'In Progress'}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
                                <div className="flex gap-1 flex-wrap mb-3">
                                    {project.requiredSkills.map(s => (
                                        <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">👤 {project.applicants} applicants • Posted by {project.postedBy}</span>
                                    {applied.has(project.id) ? (
                                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30" variant="outline">
                                            <CheckCircle className="h-3 w-3 mr-1" /> Applied
                                        </Badge>
                                    ) : (
                                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleApply(project.id); }}>
                                            Apply <ArrowRight className="h-3 w-3 ml-1" />
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* AI Match Panel */}
                <div>
                    {selectedProject ? (
                        <Card className="sticky top-6 shadow-lg">
                            <CardHeader className="bg-gradient-to-br from-orange-500 to-rose-500 text-white rounded-t-lg">
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Brain className="h-5 w-5" /> AI Match Results
                                </CardTitle>
                                <CardDescription className="text-white/80">
                                    Best internal matches for "{selectedProject.title}"
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3">
                                {loading ? (
                                    <div className="text-center py-10">
                                        <Brain className="h-8 w-8 animate-pulse text-primary mx-auto" />
                                        <p className="text-sm text-muted-foreground mt-2">AI matching employees...</p>
                                    </div>
                                ) : (
                                    <>
                                        {matches.slice(0, 8).map((match, i) => (
                                            <div key={match.employeeId} className={`p-3 rounded-lg border ${i < 3 ? 'bg-gradient-to-r from-yellow-500/5 to-transparent border-yellow-500/20' : ''}`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        {i === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                                                        <span className="font-medium text-sm">{match.name}</span>
                                                    </div>
                                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${getMatchBg(match.matchScore)} ${getMatchColor(match.matchScore)}`}>
                                                        {match.matchScore}%
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 flex-wrap">
                                                    {match.matchedSkills.map(s => (
                                                        <Badge key={s} className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30" variant="outline">✓ {s}</Badge>
                                                    ))}
                                                    {match.missingSkills.map(s => (
                                                        <Badge key={s} className="text-[10px] bg-red-500/10 text-red-500 border-red-500/30" variant="outline">✗ {s}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-dashed">
                            <CardContent className="p-10 text-center">
                                <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                                <p className="text-muted-foreground">Select a project to see AI-matched employees</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TalentMarketplace;
