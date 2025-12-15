import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  Award,
  FileText,
  Target,
  BookOpen,
  Briefcase,
  Star
} from 'lucide-react';

interface ResumeAnalysisProps {
  analysis: {
    overall_score: number;
    criteria_scores: {
      experience_match: number;
      skills_alignment: number;
      education_relevance: number;
      industry_experience: number;
      resume_quality: number;
    };
    detailed_feedback: {
      experience_match: string;
      skills_alignment: string;
      education_relevance: string;
      industry_experience: string;
      resume_quality: string;
    };
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  };
}

export const ResumeAnalysis: React.FC<ResumeAnalysisProps> = ({ analysis }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const criteriaIcons = {
    experience_match: Briefcase,
    skills_alignment: Target,
    education_relevance: BookOpen,
    industry_experience: TrendingUp,
    resume_quality: FileText
  };

  const criteriaLabels = {
    experience_match: 'Experience Match',
    skills_alignment: 'Skills Alignment',
    education_relevance: 'Education Relevance',
    industry_experience: 'Industry Experience',
    resume_quality: 'Resume Quality'
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Resume Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold">Overall Score</h3>
              <p className="text-muted-foreground">AI-powered evaluation</p>
            </div>
            <div className="text-right">
              <Badge 
                variant={getScoreBadgeVariant(analysis.overall_score)}
                className="text-lg px-3 py-1"
              >
                {analysis.overall_score}/100
              </Badge>
              {analysis.overall_score >= 70 ? (
                <CheckCircle className="w-6 h-6 text-green-600 mt-2 ml-auto" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 mt-2 ml-auto" />
              )}
            </div>
          </div>
          <Progress value={analysis.overall_score} className="h-3" />
        </CardContent>
      </Card>

      {/* Criteria Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Scoring</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(analysis.criteria_scores).map(([key, score]) => {
            const Icon = criteriaIcons[key as keyof typeof criteriaIcons];
            const label = criteriaLabels[key as keyof typeof criteriaLabels];
            const feedback = analysis.detailed_feedback[key as keyof typeof analysis.detailed_feedback];
            
            return (
              <div key={key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{label}</span>
                  </div>
                  <Badge variant={getScoreBadgeVariant(score)}>
                    {score}/100
                  </Badge>
                </div>
                <Progress value={score} className="h-2" />
                <p className="text-sm text-muted-foreground">{feedback}</p>
                {key !== 'resume_quality' && <Separator />}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Strengths */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Strengths Identified
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {analysis.strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{strength}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Areas for Improvement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Areas for Improvement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {analysis.improvements.map((improvement, index) => (
              <li key={index} className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{improvement}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {analysis.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start gap-2">
                <Star className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{recommendation}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};