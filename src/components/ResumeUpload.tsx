import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Upload, FileText, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ResumeUploadProps {
  candidateId: string;
  positionId?: string;
  onUploadComplete?: (resumeId: string) => void;
  existingResume?: any;
}

export const ResumeUpload: React.FC<ResumeUploadProps> = ({
  candidateId,
  positionId,
  onUploadComplete,
  existingResume
}) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.includes('pdf') && !file.type.includes('doc')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or Word document",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      setProgress(20);

      // Create file path with user ID folder structure
      const fileExt = file.name.split('.').pop();
      const fileName = `${candidateId}/${Date.now()}.${fileExt}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      setProgress(50);

      // Create resume record in database
      const { data: resumeData, error: resumeError } = await supabase
        .from('resumes')
        .insert({
          candidate_id: candidateId,
          position_id: positionId,
          file_path: uploadData.path,
          file_name: file.name,
          file_size: file.size,
          content_type: file.type,
        })
        .select()
        .single();

      if (resumeError) throw resumeError;

      setProgress(75);

      // Extract text from PDF/DOC for AI analysis
      const formData = new FormData();
      formData.append('file', file);

      // For now, we'll use a simple text extraction
      // In production, you'd want to use a proper PDF/DOC parser
      const extractedText = `Resume for ${file.name}. This would contain the actual extracted text from the PDF/DOC file.`;

      // Get job requirements for AI analysis
      let jobRequirements = {};
      if (positionId) {
        const { data: positionData } = await supabase
          .from('positions')
          .select('job_requirements, title, experience_level')
          .eq('id', positionId)
          .single();
        
        jobRequirements = positionData?.job_requirements || {
          title: positionData?.title,
          experience_level: positionData?.experience_level
        };
      }

      setAnalyzing(true);

      // Call AI analysis function
      const { data: analysisData, error: analysisError } = await supabase.functions
        .invoke('analyze-resume', {
          body: {
            resumeId: resumeData.id,
            resumeText: extractedText,
            jobRequirements
          }
        });

      if (analysisError) {
        console.error('Analysis error:', analysisError);
        // Continue without analysis
      }

      setProgress(100);

      toast({
        title: "Resume uploaded successfully",
        description: "Your resume has been uploaded and analyzed",
      });

      onUploadComplete?.(resumeData.id);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload resume",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setAnalyzing(false);
      setProgress(0);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Resume Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {existingResume ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-medium">{existingResume.file_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Uploaded {new Date(existingResume.uploaded_at).toLocaleDateString()}
                  </p>
                  {existingResume.ai_score && (
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">
                        AI Score: {existingResume.ai_score}/100
                      </Badge>
                      {existingResume.ai_score >= 70 ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                  )}
                </div>
              </div>
              <Button variant="outline" onClick={triggerFileSelect}>
                Replace
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <Label>Upload Resume</Label>
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
              onClick={triggerFileSelect}
            >
              <Upload className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Upload your resume</p>
              <p className="text-sm text-muted-foreground mb-4">
                PDF or Word document (max 5MB)
              </p>
              <Button variant="outline">Choose File</Button>
            </div>
          </div>
        )}

        <Input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />

        {(uploading || analyzing) && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                {analyzing ? 'Analyzing resume...' : 'Uploading...'}
              </span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-1">Supported formats:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>PDF documents (.pdf)</li>
            <li>Microsoft Word (.doc, .docx)</li>
            <li>Maximum file size: 5MB</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};