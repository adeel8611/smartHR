import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Eye,
    Shield,
    BarChart3,
    Users,
    AlertTriangle,
    CheckCircle,
    Clock,
    MessageSquare,
    ThumbsUp,
    ThumbsDown,
    Scale,
    TrendingUp
} from "lucide-react";

interface InterviewSession {
    id: string;
    candidateName: string;
    position: string;
    interviewer: string;
    date: string;
    fairnessScore: number;
    sentimentAnalysis: {
        positive: number;
        neutral: number;
        negative: number;
    };
    speakingRatio: {
        interviewer: number;
        candidate: number;
    };
    questionFairness: {
        total: number;
        biased: number;
        neutral: number;
    };
    flags: string[];
    diversityScore: number;
}

const MOCK_SESSIONS: InterviewSession[] = [
    {
        id: 's1', candidateName: 'Ali Rahman', position: 'Frontend Developer',
        interviewer: 'Ahmed Khan', date: '2026-03-08',
        fairnessScore: 92, sentimentAnalysis: { positive: 65, neutral: 25, negative: 10 },
        speakingRatio: { interviewer: 35, candidate: 65 },
        questionFairness: { total: 12, biased: 0, neutral: 12 },
        flags: [], diversityScore: 88,
    },
    {
        id: 's2', candidateName: 'Fatima Zahra', position: 'Data Analyst',
        interviewer: 'Bilal Sheikh', date: '2026-03-07',
        fairnessScore: 64, sentimentAnalysis: { positive: 30, neutral: 40, negative: 30 },
        speakingRatio: { interviewer: 70, candidate: 30 },
        questionFairness: { total: 10, biased: 3, neutral: 7 },
        flags: ['Interviewer dominated conversation (70%)', 'Potentially biased questions detected (3)'],
        diversityScore: 55,
    },
    {
        id: 's3', candidateName: 'Hassan Malik', position: 'Backend Engineer',
        interviewer: 'Sara Qureshi', date: '2026-03-06',
        fairnessScore: 85, sentimentAnalysis: { positive: 55, neutral: 35, negative: 10 },
        speakingRatio: { interviewer: 40, candidate: 60 },
        questionFairness: { total: 15, biased: 1, neutral: 14 },
        flags: ['Minor: 1 potentially biased question detected'],
        diversityScore: 82,
    },
    {
        id: 's4', candidateName: 'Ayesha Siddiqui', position: 'Product Manager',
        interviewer: 'Usman Ali', date: '2026-03-05',
        fairnessScore: 48, sentimentAnalysis: { positive: 20, neutral: 30, negative: 50 },
        speakingRatio: { interviewer: 75, candidate: 25 },
        questionFairness: { total: 8, biased: 4, neutral: 4 },
        flags: ['High bias risk: Interviewer spoke 75% of the time', '4 out of 8 questions flagged as biased', 'Negative sentiment dominant'],
        diversityScore: 35,
    },
    {
        id: 's5', candidateName: 'Zain Abbas', position: 'DevOps Engineer',
        interviewer: 'Ahmed Khan', date: '2026-03-04',
        fairnessScore: 95, sentimentAnalysis: { positive: 70, neutral: 25, negative: 5 },
        speakingRatio: { interviewer: 30, candidate: 70 },
        questionFairness: { total: 14, biased: 0, neutral: 14 },
        flags: [], diversityScore: 92,
    },
];

const InterviewBiasDetector = () => {
    const [sessions] = useState<InterviewSession[]>(MOCK_SESSIONS);
    const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null);

    const avgFairness = Math.round(sessions.reduce((s, se) => s + se.fairnessScore, 0) / sessions.length);
    const avgDiversity = Math.round(sessions.reduce((s, se) => s + se.diversityScore, 0) / sessions.length);
    const flaggedCount = sessions.filter(s => s.flags.length > 0).length;

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-500';
        if (score >= 60) return 'text-amber-500';
        return 'text-red-500';
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/30';
        if (score >= 60) return 'bg-amber-500/10 border-amber-500/30';
        return 'bg-red-500/10 border-red-500/30';
    };

    const getScoreGradient = (score: number) => {
        if (score >= 80) return 'from-emerald-500 to-teal-500';
        if (score >= 60) return 'from-amber-500 to-orange-500';
        return 'from-red-500 to-rose-500';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Scale className="h-7 w-7 text-violet-500" />
                    AI Interview Bias Detector
                </h2>
                <p className="text-muted-foreground mt-1">Ensuring fair, unbiased hiring across your organization</p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="overflow-hidden border-0 shadow-lg">
                    <div className={`bg-gradient-to-r ${getScoreGradient(avgFairness)} p-5 text-white`}>
                        <p className="text-white/80 text-xs uppercase tracking-wider">Avg Fair Hiring Score</p>
                        <p className="text-3xl font-bold mt-1">{avgFairness}%</p>
                    </div>
                </Card>
                <Card className="overflow-hidden border-0 shadow-lg">
                    <div className={`bg-gradient-to-r ${getScoreGradient(avgDiversity)} p-5 text-white`}>
                        <p className="text-white/80 text-xs uppercase tracking-wider">Diversity Index</p>
                        <p className="text-3xl font-bold mt-1">{avgDiversity}%</p>
                    </div>
                </Card>
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-red-500">{flaggedCount}</p>
                                <p className="text-xs text-muted-foreground">Flagged Sessions</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                                <MessageSquare className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{sessions.length}</p>
                                <p className="text-xs text-muted-foreground">Sessions Analyzed</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sessions List */}
                <div className="lg:col-span-2 space-y-3">
                    <h3 className="font-semibold text-lg">Recent Interview Sessions</h3>
                    {sessions.map(session => (
                        <Card
                            key={session.id}
                            className={`cursor-pointer transition-all hover:shadow-md ${selectedSession?.id === session.id ? 'ring-2 ring-primary' : ''} ${session.flags.length > 0 ? 'border-l-4 border-l-amber-500' : ''}`}
                            onClick={() => setSelectedSession(session)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold ${getScoreBg(session.fairnessScore)} ${getScoreColor(session.fairnessScore)}`}>
                                            {session.fairnessScore}
                                        </div>
                                        <div>
                                            <p className="font-semibold">{session.candidateName}</p>
                                            <p className="text-sm text-muted-foreground">{session.position} • Interviewer: {session.interviewer}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {session.flags.length > 0 ? (
                                            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                                                <AlertTriangle className="h-3 w-3 mr-1" /> {session.flags.length} flags
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                                                <CheckCircle className="h-3 w-3 mr-1" /> Fair
                                            </Badge>
                                        )}
                                        <span className="text-xs text-muted-foreground">{session.date}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Detail Panel */}
                <div>
                    {selectedSession ? (
                        <Card className="sticky top-6 shadow-lg">
                            <CardHeader className={`bg-gradient-to-br ${getScoreGradient(selectedSession.fairnessScore)} text-white rounded-t-lg`}>
                                <CardTitle className="text-white">{selectedSession.candidateName}</CardTitle>
                                <CardDescription className="text-white/80">{selectedSession.position} • {selectedSession.date}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 space-y-5">
                                {/* Fairness Score */}
                                <div className="text-center py-2">
                                    <p className="text-4xl font-bold">{selectedSession.fairnessScore}<span className="text-lg text-muted-foreground">%</span></p>
                                    <p className="text-sm text-muted-foreground">Fair Hiring Score</p>
                                </div>

                                {/* Sentiment Analysis */}
                                <div>
                                    <p className="text-sm font-medium mb-2 flex items-center gap-1">
                                        <BarChart3 className="h-4 w-4" /> Sentiment Analysis
                                    </p>
                                    <div className="flex h-6 rounded-full overflow-hidden">
                                        <div className="bg-emerald-500 transition-all" style={{ width: `${selectedSession.sentimentAnalysis.positive}%` }} />
                                        <div className="bg-blue-400 transition-all" style={{ width: `${selectedSession.sentimentAnalysis.neutral}%` }} />
                                        <div className="bg-red-500 transition-all" style={{ width: `${selectedSession.sentimentAnalysis.negative}%` }} />
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                        <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3 text-emerald-500" /> {selectedSession.sentimentAnalysis.positive}%</span>
                                        <span>{selectedSession.sentimentAnalysis.neutral}% neutral</span>
                                        <span className="flex items-center gap-1"><ThumbsDown className="h-3 w-3 text-red-500" /> {selectedSession.sentimentAnalysis.negative}%</span>
                                    </div>
                                </div>

                                {/* Speaking Ratio */}
                                <div>
                                    <p className="text-sm font-medium mb-2 flex items-center gap-1">
                                        <Clock className="h-4 w-4" /> Speaking Time Ratio
                                    </p>
                                    <div className="flex h-6 rounded-full overflow-hidden">
                                        <div className="bg-violet-500 transition-all flex items-center justify-center text-[10px] text-white font-bold"
                                            style={{ width: `${selectedSession.speakingRatio.interviewer}%` }}>
                                            {selectedSession.speakingRatio.interviewer}%
                                        </div>
                                        <div className="bg-cyan-500 transition-all flex items-center justify-center text-[10px] text-white font-bold"
                                            style={{ width: `${selectedSession.speakingRatio.candidate}%` }}>
                                            {selectedSession.speakingRatio.candidate}%
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                        <span>🎤 Interviewer</span>
                                        <span>🎯 Candidate</span>
                                    </div>
                                    {selectedSession.speakingRatio.interviewer > 60 && (
                                        <p className="text-xs text-amber-600 mt-1">⚠️ Interviewer is dominating the conversation</p>
                                    )}
                                </div>

                                {/* Question Fairness */}
                                <div>
                                    <p className="text-sm font-medium mb-2 flex items-center gap-1">
                                        <Shield className="h-4 w-4" /> Question Fairness
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <div className="text-center">
                                            <p className="text-xl font-bold">{selectedSession.questionFairness.total}</p>
                                            <p className="text-[10px] text-muted-foreground">Total</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-emerald-500">{selectedSession.questionFairness.neutral}</p>
                                            <p className="text-[10px] text-muted-foreground">Fair</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-red-500">{selectedSession.questionFairness.biased}</p>
                                            <p className="text-[10px] text-muted-foreground">Biased</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-violet-500">{selectedSession.diversityScore}%</p>
                                            <p className="text-[10px] text-muted-foreground">Diversity</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Flags */}
                                {selectedSession.flags.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium flex items-center gap-1">
                                            <AlertTriangle className="h-4 w-4 text-amber-500" /> AI Flags
                                        </p>
                                        {selectedSession.flags.map((flag, i) => (
                                            <Alert key={i} className="border-amber-500/30 bg-amber-500/10 py-2">
                                                <AlertDescription className="text-xs">{flag}</AlertDescription>
                                            </Alert>
                                        ))}
                                    </div>
                                )}

                                {selectedSession.flags.length === 0 && (
                                    <Alert className="border-emerald-500/30 bg-emerald-500/10">
                                        <CheckCircle className="h-4 w-4" />
                                        <AlertDescription className="text-sm">
                                            No bias detected. This interview meets fair hiring standards.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-dashed">
                            <CardContent className="p-10 text-center">
                                <Scale className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                                <p className="text-muted-foreground">Select a session to see AI bias analysis</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InterviewBiasDetector;
