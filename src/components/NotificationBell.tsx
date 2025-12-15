import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getUserNotifications, markNotificationAsRead } from "@/lib/notifications";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    sent_at: string;
    read_at: string | null;
}

const NotificationBell = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (user) {
            loadNotifications();

            // Refresh notifications every 30 seconds
            const interval = setInterval(loadNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const loadNotifications = async () => {
        if (!user) return;

        const notifs = await getUserNotifications(user.id);
        // Cast to any to avoid type errors until database types are regenerated
        setNotifications(notifs as any);
        setUnreadCount(notifs.length);
    };

    const handleMarkAsRead = async (notifId: string) => {
        await markNotificationAsRead(notifId);
        loadNotifications();
    };

    const handleClearAll = async () => {
        for (const notif of notifications) {
            await markNotificationAsRead(notif.id);
        }
        loadNotifications();
    };

    if (!user) return null;

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setShowDropdown(!showDropdown)}
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <Badge
                        className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                        variant="destructive"
                    >
                        {unreadCount}
                    </Badge>
                )}
            </Button>

            {showDropdown && (
                <Card className="absolute right-0 mt-2 w-96 max-h-96 overflow-y-auto shadow-lg z-50">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Bell className="h-4 w-4" />
                                Notifications
                            </CardTitle>
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClearAll}
                                >
                                    Clear All
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {notifications.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No notifications
                            </div>
                        ) : (
                            <div className="divide-y">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className="p-4 hover:bg-muted/50 cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-1">
                                                <p className="font-semibold text-sm">{notif.title}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {notif.message}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    {new Date(notif.sent_at).toLocaleString()}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMarkAsRead(notif.id);
                                                }}
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default NotificationBell;
