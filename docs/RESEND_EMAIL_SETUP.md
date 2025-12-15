# Resend Email Integration Setup

## Quick Setup (2 minutes)

### Step 1: Get Resend API Key

1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Create a new API key
3. Copy the API key

### Step 2: Add to Environment Variables

Add to your `.env.local` file:

```env
# Resend Email Configuration
VITE_RESEND_API_KEY=re_your_api_key_here
VITE_FROM_EMAIL=noreply@yourdomain.com
```

**Note:** Replace `yourdomain.com` with your actual domain name.

### Step 3: Verify Domain (For Production)

For sending emails in production, you need to verify your domain in Resend:

1. Go to Resend Dashboard → Domains
2. Add your domain
3. Add the DNS records they provide
4. Wait for verification

**For Development/Testing:**
You can use Resend's test mode which sends to verified emails only.

## Email Templates Included

### 1. Interview Scheduled Email
- Professional HTML template
- Includes all interview details
- Meeting link button
- Calendar-ready formatting

### 2. Interview Reminder Email
- Urgent styling (orange/yellow)
- "Starting in 5 minutes" alert
- Direct join button
- Mobile-friendly

## Testing

1. Add your Resend API key to `.env.local`
2. Restart dev server: `npm run dev`
3. Schedule a test interview
4. Check your email inbox

## Email Flow

**When Interview is Created:**
- ✅ In-app notification sent
- 📧 **Email sent to all participants** (candidate + interviewers)
- ⏰ Reminder scheduled for -5 minutes

**5 Minutes Before Interview:**
- ✅ In-app reminder sent
- 📧 **Reminder email sent to everyone**

## Troubleshooting

**Emails not sending?**
- Check if `VITE_RESEND_API_KEY` is set in `.env.local`
- Check browser console for errors
- Verify API key is valid in Resend dashboard

**Testing without domain verification?**
- Add your test email as a verified email in Resend
- Send test emails to that address

## Production Recommendations

1. **Verify your domain** in Resend
2. **Use environment-specific API keys** (dev vs prod)
3. **Monitor email delivery** in Resend dashboard
4. **Customize email templates** with your branding
5. **Add unsubscribe links** for compliance

## Current Status

✅ Resend package installed
✅ Email templates created  
✅ Integration complete
⚠️ Need to add API key to `.env.local`

Once you add the API key and restart, emails will automatically be sent!
