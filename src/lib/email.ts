import { Resend } from 'resend';

// Lazy initialize Resend only when needed to avoid crashing app if API key is missing
let resendInstance: Resend | null = null;

function getResendClient(): Resend | null {
  // If already initialized, return it
  if (resendInstance) return resendInstance;

  // Check if API key exists
  const apiKey = import.meta.env.VITE_RESEND_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ Resend API key not configured. Email notifications will be skipped.');
    return null;
  }

  // Initialize Resend
  try {
    resendInstance = new Resend(apiKey);
    return resendInstance;
  } catch (error) {
    console.error('Failed to initialize Resend:', error);
    return null;
  }
}

export interface EmailNotification {
  to: string[];
  subject: string;
  html: string;
}

/**
 * Send email notification using Resend
 * Gracefully handles missing API keys - logs warning instead of throwing
 */
export async function sendEmail(notification: EmailNotification): Promise<void> {
  // ⚠️ WARNING: Resend API calls from browser will fail due to CORS
  // For production, move this to a Supabase Edge Function
  // For now, just log and skip to avoid errors

  console.warn('⚠️ Email sending skipped: Resend API must be called from backend (Edge Function), not browser');
  console.log('📧 Would send email to:', notification.to);
  return;

  /* COMMENTED OUT TO PREVENT CORS ERRORS - USE EDGE FUNCTION INSTEAD
  try {
    // Get Resend client (lazy initialization)
    const resend = getResendClient();

    // If no API key configured, skip silently
    if (!resend) {
      console.warn('📧 Skipping email to:', notification.to, '(Resend not configured)');
      return;
    }

    const fromEmail = import.meta.env.VITE_FROM_EMAIL || 'noreply@yourdomain.com';

    await resend.emails.send({
      from: fromEmail,
      to: notification.to,
      subject: notification.subject,
      html: notification.html,
    });

    console.log('✅ Email sent to:',notification.to);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    // Don't throw - we don't want email failures to break the app
  }
  */
}

/**
 * Generate HTML email template for interview scheduled notification
 */
export function getInterviewScheduledEmailHTML(
  recipientName: string,
  position: string,
  scheduledAt: string,
  duration: number,
  meetingLink: string
): string {
  const formattedDate = new Date(scheduledAt).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📅 Interview Scheduled</h1>
        </div>
        <div class="content">
          <p>Hi ${recipientName},</p>
          
          <p>Your interview has been scheduled! Here are the details:</p>
          
          <div class="details">
            <p><strong>Position:</strong> ${position}</p>
            <p><strong>Date & Time:</strong> ${formattedDate}</p>
            <p><strong>Duration:</strong> ${duration} minutes</p>
          </div>
          
          <p>Join the meeting using the link below:</p>
          
          <a href="${meetingLink}" class="button">Join Meeting</a>
          
          <p style="font-size: 14px; color: #6b7280;">
            Or copy this link: <a href="${meetingLink}">${meetingLink}</a>
          </p>
          
          <p style="margin-top: 30px;">
            <strong>💡 Reminder:</strong> You will receive another notification 5 minutes before the interview starts.
          </p>
        </div>
        
        <div class="footer">
          <p>This is an automated message from Smart HR Interview System</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate HTML email template for interview reminder
 */
export function getInterviewReminderEmailHTML(
  recipientName: string,
  position: string,
  meetingLink: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #fffbeb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Interview Starting Soon!</h1>
        </div>
        <div class="content">
          <p>Hi ${recipientName},</p>
          
          <div class="alert">
            <p style="margin: 0; font-weight: bold;">Your interview for <strong>${position}</strong> starts in 5 minutes!</p>
          </div>
          
          <p>Please join the meeting now:</p>
          
          <a href="${meetingLink}" class="button">Join Meeting Now</a>
          
          <p style="font-size: 14px; color: #6b7280;">
            Meeting link: <a href="${meetingLink}">${meetingLink}</a>
          </p>
        </div>
        
        <div class="footer">
          <p>This is an automated reminder from Smart HR Interview System</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
