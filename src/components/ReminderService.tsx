import { useEffect } from 'react';
import { checkAndSendReminders } from '@/lib/notifications';

/**
 * Background service to check and send pending reminder notifications
 * Add this component to your App.tsx or main layout
 */
export function ReminderService() {
    useEffect(() => {
        // Check immediately on mount
        checkAndSendReminders();

        // Check every minute for pending reminders
        const interval = setInterval(() => {
            checkAndSendReminders();
        }, 60000); // 60 seconds

        return () => clearInterval(interval);
    }, []);

    return null; // This component doesn't render anything
}
