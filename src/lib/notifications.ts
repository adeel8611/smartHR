import { supabase } from '@/integrations/supabase/client';
import { sendEmail, getInterviewScheduledEmailHTML, getInterviewReminderEmailHTML } from './email';

export type NotificationType =
    | 'interview_scheduled'
    | 'interview_reminder'
    | 'interview_rescheduled'
    | 'interview_cancelled';

export interface Participant {
    userId: string;
    email: string;
    name: string;
}

export interface Interview {
    id: string;
    position: string;
    scheduled_at: string;
    duration_minutes: number;
    meeting_link?: string;
    meeting_platform?: string;
}

/**
 * Send notifications to all interview participants
 * Sends both in-app notifications AND emails via Resend
 */
export async function sendInterviewNotification(
    interview: Interview,
    type: NotificationType,
    participants: Participant[]
) {
    // Send in-app notifications
    const notifications = participants.map(participant => ({
        user_id: participant.userId,
        interview_id: interview.id,
        type: type,
        title: getNotificationTitle(type, interview),
        message: getNotificationMessage(type, interview, participant.name)
    }));

    const { error } = await supabase
        .from('notifications')
        .insert(notifications);

    if (error) {
        console.error('Error sending notifications:', error);
        throw error;
    }

    // Send email notifications via Resend
    for (const participant of participants) {
        try {
            let emailHTML = '';
            let subject = '';

            if (type === 'interview_scheduled') {
                subject = `Interview Scheduled: ${interview.position}`;
                emailHTML = getInterviewScheduledEmailHTML(
                    participant.name,
                    interview.position,
                    interview.scheduled_at,
                    interview.duration_minutes,
                    interview.meeting_link || ''
                );
            } else if (type === 'interview_reminder') {
                subject = `Reminder: Interview Starting in 5 Minutes - ${interview.position}`;
                emailHTML = getInterviewReminderEmailHTML(
                    participant.name,
                    interview.position,
                    interview.meeting_link || ''
                );
            } else {
                // For other types, use simple notification
                subject = getNotificationTitle(type, interview);
                emailHTML = `<p>${getNotificationMessage(type, interview, participant.name)}</p>`;
            }

            await sendEmail({
                to: [participant.email],
                subject,
                html: emailHTML
            });

            console.log(`📧 Email sent to ${participant.email}`);
        } catch (emailError) {
            console.error(`Failed to send email to ${participant.email}:`, emailError);
            // Don't throw - continue with other participants
        }
    }

    console.log(`✅ In-app notifications created for ${participants.length} participants`);
}

/**
 * Schedule a reminder notification for 5 minutes before the interview
 */
export async function scheduleReminder(interviewId: string, scheduledAt: string) {
    const reminderTime = new Date(scheduledAt);
    reminderTime.setMinutes(reminderTime.getMinutes() - 5);

    // Only schedule if the interview is in the future
    if (reminderTime.getTime() > Date.now()) {
        const { error } = await supabase
            .from('notification_schedule')
            .insert({
                interview_id: interviewId,
                scheduled_for: reminderTime.toISOString(),
                type: 'reminder',
                status: 'pending'
            });

        if (error) {
            console.error('Error scheduling reminder:', error);
            throw error;
        }
    }
}

/**
 * Check and send pending reminder notifications
 * Call this periodically (e.g., every minute) from the app
 */
export async function checkAndSendReminders() {
    // Get pending reminders scheduled for now or earlier
    const { data: reminders, error: fetchError } = await supabase
        .from('notification_schedule')
        .select(`
      id,
      interview_id,
      interviews (
        id,
        position,
        scheduled_at,
        duration_minutes,
        meeting_link,
        meeting_platform,
        candidate_id
      )
    `)
        .eq('status', 'pending')
        .lte('scheduled_for', new Date().toISOString());

    if (fetchError) {
        console.error('Error fetching reminders:', fetchError);
        return;
    }

    if (!reminders || reminders.length === 0) {
        return;
    }

    // Send reminders for each interview
    for (const reminder of reminders) {
        try {
            const interview = reminder.interviews as any;

            if (!interview) continue;

            // Get all participants (candidate + interviewers)
            const { data: interviewers } = await supabase
                .from('interview_interviewers')
                .select('interviewer_id, profiles!interviewer_id(user_id, email, full_name)')
                .eq('interview_id', interview.id);

            const { data: candidate } = await supabase
                .from('profiles')
                .select('user_id, email, full_name')
                .eq('user_id', interview.candidate_id)
                .single();

            const participants: Participant[] = [];

            if (candidate) {
                participants.push({
                    userId: candidate.user_id,
                    email: candidate.email,
                    name: candidate.full_name
                });
            }

            if (interviewers) {
                interviewers.forEach((int: any) => {
                    if (int.profiles) {
                        participants.push({
                            userId: int.profiles.user_id,
                            email: int.profiles.email,
                            name: int.profiles.full_name
                        });
                    }
                });
            }

            // Send reminder notifications
            await sendInterviewNotification(interview, 'interview_reminder', participants);

            // Mark reminder as sent
            await supabase
                .from('notification_schedule')
                .update({ status: 'sent', sent_at: new Date().toISOString() })
                .eq('id', reminder.id);

        } catch (error) {
            console.error('Error processing reminder:', error);

            // Mark as failed
            await supabase
                .from('notification_schedule')
                .update({ status: 'failed' })
                .eq('id', reminder.id);
        }
    }
}

/**
 * Get unread notifications for a user
 */
export async function getUserNotifications(userId: string) {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .is('read_at', null)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }

    return data || [];
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
    const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

    if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
}

// Helper functions for notification content

function getNotificationTitle(type: NotificationType, interview: Interview): string {
    switch (type) {
        case 'interview_scheduled':
            return '📅 Interview Scheduled';
        case 'interview_reminder':
            return '⏰ Interview Starting Soon';
        case 'interview_rescheduled':
            return '🔄 Interview Rescheduled';
        case 'interview_cancelled':
            return '❌ Interview Cancelled';
        default:
            return 'Interview Notification';
    }
}

function getNotificationMessage(
    type: NotificationType,
    interview: Interview,
    participantName: string
): string {
    const dateTime = new Date(interview.scheduled_at).toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short'
    });

    switch (type) {
        case 'interview_scheduled':
            return `Hi ${participantName}, your interview for ${interview.position} has been scheduled for ${dateTime}. ${interview.meeting_link ? `Join via: ${interview.meeting_link}` : ''}`;

        case 'interview_reminder':
            return `Hi ${participantName}, your interview for ${interview.position} starts in 5 minutes! ${interview.meeting_link ? `Join now: ${interview.meeting_link}` : ''}`;

        case 'interview_rescheduled':
            return `Hi ${participantName}, your interview for ${interview.position} has been rescheduled to ${dateTime}. ${interview.meeting_link ? `Meeting link: ${interview.meeting_link}` : ''}`;

        case 'interview_cancelled':
            return `Hi ${participantName}, your interview for ${interview.position} scheduled for ${dateTime} has been cancelled.`;

        default:
            return `Interview update for ${interview.position}`;
    }
}
