import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewUserNotificationRequest {
  userId: string;
  userEmail: string;
  fullName: string;
  role: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, userEmail, fullName, role }: NewUserNotificationRequest = await req.json();

    // Get all admin users
    const { data: admins, error: adminError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('role', 'admin');

    if (adminError) {
      console.error('Error fetching admins:', adminError);
      throw new Error('Failed to fetch admin users');
    }

    if (!admins || admins.length === 0) {
      console.log('No admin users found to notify');
      return new Response(JSON.stringify({ message: 'No admin users to notify' }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Send email notification to all admins
    for (const admin of admins) {
      const emailResponse = await resend.emails.send({
        from: "Smart HR Assistant <onboarding@resend.dev>",
        to: [admin.email],
        subject: "New User Registration - Smart HR Assistant",
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <h1 style="color: #2563eb; text-align: center;">New User Registration</h1>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Hello ${admin.full_name},</strong></p>
              <p>A new user has registered for the Smart HR Assistant system:</p>
              
              <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <p><strong>Full Name:</strong> ${fullName}</p>
                <p><strong>Email:</strong> ${userEmail}</p>
                <p><strong>Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
                <p><strong>Registration Time:</strong> ${new Date().toLocaleString()}</p>
              </div>
              
              <p>You can manage this user's role and permissions through the Employee Management section in your admin dashboard.</p>
              
              <div style="text-align: center; margin: 20px 0;">
                <a href="${supabaseUrl.replace('.co', '.app')}" 
                   style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Access Admin Dashboard
                </a>
              </div>
            </div>
            
            <p style="color: #64748b; font-size: 14px; text-align: center;">
              This is an automated notification from Smart HR Assistant
            </p>
          </div>
        `,
      });

      console.log(`Email sent to admin ${admin.email}:`, emailResponse);
    }

    return new Response(JSON.stringify({ message: 'Admin notifications sent successfully' }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in notify-admin-new-user function:", error);
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