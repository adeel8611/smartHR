import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BulkEmailRequest {
  recipients: string[];
  subject: string;
  body: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const { recipients, subject, body }: BulkEmailRequest = await req.json();

    if (!recipients || recipients.length === 0) {
      throw new Error('No recipients provided');
    }

    if (!subject || !body) {
      throw new Error('Subject and body are required');
    }

    // Send emails in batches to avoid rate limits
    const batchSize = 10;
    const batches = [];
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      batches.push(recipients.slice(i, i + batchSize));
    }

    const results = [];
    
    for (const batch of batches) {
      const emailPromises = batch.map(async (recipient) => {
        try {
          const emailResponse = await resend.emails.send({
            from: "Smart HR Assistant <onboarding@resend.dev>",
            to: [recipient],
            subject: subject,
            html: `
              <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
                  <h1 style="margin: 0;">Smart HR Assistant</h1>
                </div>
                <div style="padding: 20px; background: #f8fafc;">
                  <div style="background: white; padding: 20px; border-radius: 8px;">
                    ${body.replace(/\n/g, '<br>')}
                  </div>
                </div>
                <div style="text-align: center; padding: 20px; color: #64748b; font-size: 14px;">
                  <p>This email was sent from Smart HR Assistant</p>
                </div>
              </div>
            `,
          });
          
          return { recipient, success: true, response: emailResponse };
        } catch (error) {
          console.error(`Failed to send email to ${recipient}:`, error);
          return { recipient, success: false, error: error.message };
        }
      });

      const batchResults = await Promise.all(emailPromises);
      results.push(...batchResults);
      
      // Add a small delay between batches
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Bulk email completed: ${successCount} successful, ${failureCount} failed`);

    return new Response(JSON.stringify({
      message: 'Bulk email completed',
      totalSent: successCount,
      totalFailed: failureCount,
      results: results
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-bulk-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);