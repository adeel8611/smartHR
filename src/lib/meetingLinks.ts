/**
 * Generate a meeting link for the specified platform
 * For Google Meet: Attempts real API integration, falls back to mock if not configured
 * For Zoom/Teams: Uses mock links (API integration can be added similarly)
 */

export type MeetingPlatform = 'google-meet' | 'zoom' | 'teams';

export interface MeetingDetails {
    title: string;
    startTime: string;
    duration: number;
    participants: string[];
}

export async function generateMeetingLink(
    platform: MeetingPlatform,
    meetingDetails: MeetingDetails
): Promise<string> {
    // For Google Meet, try real API integration first
    if (platform === 'google-meet') {
        try {
            // Check if Google Calendar integration is configured
            const hasGoogleAuth = import.meta.env.VITE_GOOGLE_CLIENT_ID &&
                import.meta.env.VITE_GOOGLE_ACCESS_TOKEN;

            if (hasGoogleAuth) {
                // Use real Google Meet integration
                const { generateRealGoogleMeetLink } = await import('./googleMeet');

                const meetLink = await generateRealGoogleMeetLink(
                    meetingDetails.title,
                    meetingDetails.startTime,
                    meetingDetails.duration,
                    meetingDetails.participants
                );

                console.log('✅ Real Google Meet link generated:', meetLink);
                return meetLink;
            }
        } catch (error) {
            console.warn('Google Meet API failed, falling back to mock link:', error);
            // Fall through to mock generation
        }
    }

    // Fallback to mock links for all platforms
    console.log(`📝 Generating mock ${platform} link`);
    return generateMockMeetingLink(platform);
}

function generateMockMeetingLink(platform: MeetingPlatform): string {
    const meetingId = generateMeetingId();

    switch (platform) {
        case 'google-meet':
            return `https://meet.google.com/${meetingId}`;
        case 'zoom':
            return `https://zoom.us/j/${meetingId}`;
        case 'teams':
            return `https://teams.microsoft.com/l/meetup-join/${meetingId}`;
        default:
            return `https://meet.google.com/${meetingId}`;
    }
}

function generateMeetingId(): string {
    // Generate a random meeting ID
    const chars = 'abcdefghijklmnopqrstuvwxyz';

    let id = '';
    for (let i = 0; i < 3; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    id += '-';
    for (let i = 0; i < 4; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    id += '-';
    for (let i = 0; i < 3; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return id;
}

/**
 * Check if Google Meet real integration is available
 */
export function isGoogleMeetConfigured(): boolean {
    return !!(import.meta.env.VITE_GOOGLE_CLIENT_ID &&
        import.meta.env.VITE_GOOGLE_ACCESS_TOKEN);
}
