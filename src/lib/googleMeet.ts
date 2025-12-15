/**
 * Google Meet Integration using Google Calendar API
 * 
 * This implementation creates REAL Google Meet links by creating Calendar events
 * with conferencing enabled.
 * 
 * Setup Required:
 * 1. Create Google Cloud Project: https://console.cloud.google.com
 * 2. Enable Google Calendar API
 * 3. Create OAuth 2.0 credentials (Web application)
 * 4. Add authorized redirect URIs
 * 5. Set environment variables in .env
 */

import { google } from 'googleapis';

// Environment variables needed (add to .env):
// GOOGLE_CLIENT_ID=your_client_id
// GOOGLE_CLIENT_SECRET=your_client_secret
// GOOGLE_REDIRECT_URI=http://localhost:8080/auth/google/callback

export interface GoogleMeetDetails {
    title: string;
    description?: string;
    startTime: string; // ISO 8601 format
    duration: number; // minutes
    attendees: string[]; // email addresses
}

export interface GoogleMeetResponse {
    meetLink: string;
    eventId: string;
    calendarEventLink: string;
}

/**
 * Initialize OAuth2 client for Google Calendar API
 */
export function getOAuth2Client() {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    return oauth2Client;
}

/**
 * Generate authorization URL for OAuth flow
 * Users need to visit this URL to grant calendar access
 */
export function getAuthorizationUrl(): string {
    const oauth2Client = getOAuth2Client();

    const scopes = [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar'
    ];

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent'
    });
}

/**
 * Exchange authorization code for access tokens
 * Call this after user authorizes and you receive the code
 */
export async function getAccessToken(code: string) {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Store tokens securely in your database for future use
    return tokens;
}

/**
 * Create a Google Meet link by creating a Calendar event
 * 
 * IMPORTANT: This requires the user to have already authorized the app
 * and you must have valid access tokens stored
 */
export async function createGoogleMeetLink(
    meetDetails: GoogleMeetDetails,
    accessToken: string,
    refreshToken?: string
): Promise<GoogleMeetResponse> {
    try {
        // Initialize OAuth client with stored tokens
        const oauth2Client = getOAuth2Client();
        oauth2Client.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken
        });

        // Initialize Calendar API
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        // Calculate end time
        const start = new Date(meetDetails.startTime);
        const end = new Date(start.getTime() + meetDetails.duration * 60000);

        // Create calendar event with Google Meet conferencing
        const event = {
            summary: meetDetails.title,
            description: meetDetails.description || '',
            start: {
                dateTime: start.toISOString(),
                timeZone: 'UTC', // Consider making this configurable
            },
            end: {
                dateTime: end.toISOString(),
                timeZone: 'UTC',
            },
            attendees: meetDetails.attendees.map(email => ({ email })),
            conferenceData: {
                createRequest: {
                    requestId: `meet-${Date.now()}`, // Unique ID for the request
                    conferenceSolutionKey: {
                        type: 'hangoutsMeet' // This creates a Google Meet link
                    }
                }
            },
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'popup', minutes: 5 },
                    { method: 'email', minutes: 10 }
                ]
            }
        };

        // Create the event
        const response = await calendar.events.insert({
            calendarId: 'primary',
            conferenceDataVersion: 1, // Required for creating Meet links
            requestBody: event,
            sendUpdates: 'all' // Send email invites to attendees
        });

        // Extract the Google Meet link
        const meetLink = response.data.hangoutLink || response.data.conferenceData?.entryPoints?.[0]?.uri || '';

        if (!meetLink) {
            throw new Error('Failed to create Google Meet link');
        }

        return {
            meetLink,
            eventId: response.data.id || '',
            calendarEventLink: response.data.htmlLink || ''
        };

    } catch (error) {
        console.error('Error creating Google Meet link:', error);
        throw new Error(`Failed to create Google Meet link: ${error.message}`);
    }
}

/**
 * Update an existing calendar event (for rescheduling)
 */
export async function updateGoogleMeetEvent(
    eventId: string,
    updates: Partial<GoogleMeetDetails>,
    accessToken: string,
    refreshToken?: string
): Promise<void> {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const updateData: any = {};

    if (updates.title) {
        updateData.summary = updates.title;
    }

    if (updates.startTime && updates.duration) {
        const start = new Date(updates.startTime);
        const end = new Date(start.getTime() + updates.duration * 60000);

        updateData.start = {
            dateTime: start.toISOString(),
            timeZone: 'UTC',
        };
        updateData.end = {
            dateTime: end.toISOString(),
            timeZone: 'UTC',
        };
    }

    if (updates.attendees) {
        updateData.attendees = updates.attendees.map(email => ({ email }));
    }

    await calendar.events.patch({
        calendarId: 'primary',
        eventId: eventId,
        requestBody: updateData,
        sendUpdates: 'all'
    });
}

/**
 * Cancel a calendar event (for interview cancellation)
 */
export async function cancelGoogleMeetEvent(
    eventId: string,
    accessToken: string,
    refreshToken?: string
): Promise<void> {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
        sendUpdates: 'all' // Notify attendees
    });
}

/**
 * Simplified function for when tokens are stored in database
 * Use this in your interview scheduling flow
 */
export async function generateRealGoogleMeetLink(
    title: string,
    startTime: string,
    duration: number,
    attendees: string[]
): Promise<string> {
    // TODO: Fetch admin's Google tokens from database
    // For now, using environment variables (not recommended for production)
    const accessToken = process.env.GOOGLE_ACCESS_TOKEN || '';
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN || '';

    if (!accessToken) {
        throw new Error('Google Calendar not authorized. Please complete OAuth flow first.');
    }

    const result = await createGoogleMeetLink(
        {
            title,
            description: `Interview scheduled via Smart HR`,
            startTime,
            duration,
            attendees
        },
        accessToken,
        refreshToken
    );

    return result.meetLink;
}
