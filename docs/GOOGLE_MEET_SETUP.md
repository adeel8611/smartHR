# Google Meet Integration Setup Guide

This guide will help you set up real Google Meet link generation for the interview scheduling system.

## Prerequisites

- Google Account
- Google Cloud Console access
- Admin privileges for the application

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a Project" → "New Project"
3. Enter project name: "Smart HR Interview System" (or your preferred name)
4. Click "Create"

## Step 2: Enable Google Calendar API

1. In your Google Cloud Project dashboard
2. Go to "APIs & Services" → "Library"
3. Search for "Google Calendar API"
4. Click on it and click "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "+ CREATE CREDENTIALS" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen first:
   - User Type: External (or Internal if using Google Workspace)
   - App name: "Smart HR"
   - User support email: your email
   - Developer contact: your email
   - Scopes: Add `../auth/calendar` and `../auth/calendar.events`
   - Test users: Add your email and any admin emails
   - Save and continue

4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: "Smart HR Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:8080` (for development)
     - Add your production domain later
   - Authorized redirect URIs:
     - `http://localhost:8080/auth/google/callback`
     - Add production callback URL later
   - Click "Create"

5. **IMPORTANT**: Download the credentials JSON or copy:
   - Client ID
   - Client Secret

## Step 4: Add Environment Variables

Create or update your `.env` file in the project root:

```env
# Google Calendar API Credentials
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:8080/auth/google/callback

# These will be set after OAuth flow
GOOGLE_ACCESS_TOKEN=
GOOGLE_REFRESH_TOKEN=
```

## Step 5: Complete OAuth Authorization Flow

Since this is a backend integration, you need to get initial access tokens. You have two options:

### Option A: Manual OAuth Flow (Quickest)

1. Run this in your browser console or use the provided helper page:

```typescript
// In your app, create a temporary page at /auth/google
// Visit: http://localhost:8080/auth/google

import { getAuthorizationUrl } from '@/lib/googleMeet';

const authUrl = getAuthorizationUrl();
console.log('Visit this URL:', authUrl);
// Visit the URL, authorize the app
```

2. After authorization, Google will redirect to your callback URL with a `code` parameter
3. Extract the code from the URL
4. Exchange it for tokens:

```typescript
import { getAccessToken } from '@/lib/googleMeet';

const tokens = await getAccessToken(code);
console.log('Access Token:', tokens.access_token);
console.log('Refresh Token:', tokens.refresh_token);
```

5. Add these tokens to your `.env` file

### Option B: OAuth Helper Component (Recommended for Production)

Create a component for admins to authorize their Google Calendar:

```tsx
// src/components/GoogleCalendarAuth.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getAuthorizationUrl } from '@/lib/googleMeet';

export function GoogleCalendarAuth() {
  const handleAuthorize = () => {
    const authUrl = getAuthorizationUrl();
    window.location.href = authUrl;
  };

  return (
    <div>
      <h3>Connect Google Calendar</h3>
      <Button onClick={handleAuthorize}>
        Authorize Google Calendar Access
      </Button>
    </div>
  );
}
```

Create callback handler at `src/pages/GoogleAuthCallback.tsx`:

```tsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAccessToken } from '@/lib/googleMeet';
import { supabase } from '@/integrations/supabase/client';

export function GoogleAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      handleAuth(code);
    }
  }, []);

  async function handleAuth(code: string) {
    try {
      const tokens = await getAccessToken(code);
      
      // Store tokens in database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('google_tokens')
          .upsert({
            user_id: user.id,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: new Date(Date.now() + (tokens.expiry_date || 3600 * 1000))
          });
      }
      
      alert('Google Calendar connected successfully!');
      navigate('/settings');
    } catch (error) {
      console.error('Auth error:', error);
      alert('Failed to connect Google Calendar');
    }
  }

  return <div>Authorizing...</div>;
}
```

## Step 6: Update Environment Variables (Production)

For production:

1. Add tokens to environment variables in your hosting platform (Vercel, etc.)
2. OR store tokens encrypted in database per admin user
3. Implement token refresh logic when tokens expire

## Step 7: Test the Integration

1. Ensure `.env` has all credentials
2. Restart your dev server: `npm run dev`
3. Go to Interview Management → Schedule tab
4. Create a test interview
5. Check that a real Google Meet link is generated
6. Verify the calendar event was created in Google Calendar

## Troubleshooting

### Error: "Google Calendar not authorized"
- Check that `GOOGLE_ACCESS_TOKEN` is set in `.env`
- Complete the OAuth flow to get tokens

### Error: "Invalid credentials"
- Verify `CLIENT_ID` and `CLIENT_SECRET` are correct
- Check that redirect URI matches exactly (including trailing slash)

### Error: "Access denied"
- Make sure the Google account has granted calendar permissions
- Check OAuth consent screen configuration
- Add test users if app is in testing mode

### Tokens expired
- Implement automatic token refresh using the refresh token
- Google access tokens expire after 1 hour
- Refresh tokens are long-lived

## Security Best Practices

1. **Never commit `.env` to git** - Add to `.gitignore`
2. **Encrypt tokens in database** - Don't store in plain text
3. **Use HTTPS in production** - Required for OAuth
4. **Limit scope** - Only request calendar permissions needed
5. **Rotate tokens** - Implement token refresh before expiry

## Production Considerations

### Multi-User Support

For production with multiple admins, store tokens per user:

```sql
CREATE TABLE google_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);
```

Then modify `googleMeet.ts` to fetch tokens from database instead of env variables.

### Token Refresh

Implement automatic token refresh:

```typescript
async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  
  const { credentials } = await oauth2Client.refreshAccessToken();
  
  // Update database with new access token
  return credentials.access_token;
}
```

## Next Steps

1. Complete OAuth flow to get tokens
2. Test creating a meeting link
3. Verify calendar event appears in Google Calendar
4. Update scheduling form to use real integration
5. Implement token storage in database for production
6. Add token refresh logic
7. Test with multiple admins

## Support

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [googleapis Node.js Client](https://github.com/googleapis/google-api-nodejs-client)
