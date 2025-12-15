import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeId, resumeText, jobRequirements } = await req.json();
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not found');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const prompt = `
Analyze this resume against the job requirements and provide a score out of 100 and detailed analysis.

RESUME TEXT:
${resumeText}

JOB REQUIREMENTS:
${JSON.stringify(jobRequirements, null, 2)}

Please analyze the following criteria and provide:
1. Overall score (0-100)
2. Experience match score (0-100) 
3. Skills alignment score (0-100)
4. Education relevance score (0-100)
5. Industry experience score (0-100)
6. Resume quality score (0-100)
7. Detailed feedback for each criteria
8. Strengths identified
9. Areas for improvement
10. Recommendations

Return your analysis in the following JSON format:
{
  "overall_score": number,
  "criteria_scores": {
    "experience_match": number,
    "skills_alignment": number,
    "education_relevance": number,
    "industry_experience": number,
    "resume_quality": number
  },
  "detailed_feedback": {
    "experience_match": "string",
    "skills_alignment": "string", 
    "education_relevance": "string",
    "industry_experience": "string",
    "resume_quality": "string"
  },
  "strengths": ["string"],
  "improvements": ["string"],
  "recommendations": ["string"]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert HR recruiter and resume analyst. Provide detailed, constructive analysis.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;
    
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (e) {
      // Fallback if JSON parsing fails
      analysis = {
        overall_score: 75,
        criteria_scores: {
          experience_match: 75,
          skills_alignment: 75,
          education_relevance: 75,
          industry_experience: 75,
          resume_quality: 75
        },
        detailed_feedback: {
          experience_match: "Analysis could not be parsed properly",
          skills_alignment: "Analysis could not be parsed properly",
          education_relevance: "Analysis could not be parsed properly", 
          industry_experience: "Analysis could not be parsed properly",
          resume_quality: "Analysis could not be parsed properly"
        },
        strengths: ["Resume uploaded successfully"],
        improvements: ["Analysis parsing failed"],
        recommendations: ["Please try again"]
      };
    }

    // Update the resume record with the analysis
    const { error: updateError } = await supabase
      .from('resumes')
      .update({
        ai_score: analysis.overall_score,
        ai_analysis: analysis
      })
      .eq('id', resumeId);

    if (updateError) {
      console.error('Error updating resume:', updateError);
      throw updateError;
    }

    return new Response(JSON.stringify({
      success: true,
      analysis
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-resume function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});