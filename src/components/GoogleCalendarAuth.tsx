import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, CheckCircle, ExternalLink, Info, AlertCircle } from "lucide-react";
import { isGoogleMeetConfigured } from "@/lib/meetingLinks";

/**
 * Google Calendar OAuth Helper Component
 * 
 * This component helps administrators connect their Google Calendar
 * to enable real Google Meet link generation.
 * 
 * Usage: Add this to Settings page or Interview Management page
 */

const GoogleCalendarAuth = () => {
    const { toast } = useToast();
    const [authCode, setAuthCode] = useState('');
    const [isConfigured, setIsConfigured] = useState(isGoogleMeetConfigured());

    const handleAuthorize = () => {
        // Check if client ID is configured
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

        if (!clientId) {
            toast({
                title: "Configuration Missing",
                description: "Please add VITE_GOOGLE_CLIENT_ID to your .env file first. See docs/GOOGLE_MEET_SETUP.md for instructions.",
                variant: "destructive"
            });
            return;
        }

        // Build OAuth URL manually
        const redirectUri = `${window.location.origin}/auth/google/callback`;
        const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar');

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${clientId}&` +
            `redirect_uri=${redirectUri}&` +
            `response_type=code&` +
            `scope=${scope}&` +
            `access_type=offline&` +
            `prompt=consent`;

        // Open in new window
        window.open(authUrl, 'Google Calendar Authorization', 'width=600,height=700');

        toast({
            title: "Authorization Window Opened",
            description: "Please authorize access to your Google Calendar in the popup window."
        });
    };

    const handleManualAuth = async () => {
        if (!authCode.trim()) {
            toast({
                title: "Code Required",
                description: "Please paste the authorization code",
                variant: "destructive"
            });
            return;
        }

        toast({
            title: "Processing...",
            description: "Exchanging authorization code for access tokens"
        });

        // In a real implementation, you would:
        // 1. Send the code to your backend
        // 2. Backend exchanges code for tokens
        // 3. Store tokens securely in database
        // 4. Return success/failure

        // For now, show instructions
        toast({
            title: "Manual Setup Required",
            description: "Please follow the setup guide in docs/GOOGLE_MEET_SETUP.md to complete OAuth flow and obtain tokens.",
            duration: 10000
        });
    };

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Google Calendar Integration
                </CardTitle>
                <CardDescription>
                    Connect Google Calendar to generate real Google Meet links for interviews
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isConfigured ? (
                    <Alert className="border-success bg-success/10">
                        <CheckCircle className="h-4 w4" />
                        <AlertDescription>
                            <div className="space-y-1">
                                <p className="font-medium">✅ Google Calendar is connected!</p>
                                <p className="text-xs text-muted-foreground">
                                    Interview scheduling will create real Google Meet links automatically.
                                </p>
                            </div>
                        </AlertDescription>
                    </Alert>
                ) : (
                    <>
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                                <p className="font-medium mb-2">Setup Required</p>
                                <p>To enable real Google Meet links, you need to:</p>
                                <ol className="list-decimal list-inside space-y-1 mt-2 ml-2">
                                    <li>Create Google Cloud Project</li>
                                    <li>Enable Google Calendar API</li>
                                    <li>Create OAuth 2.0 credentials</li>
                                    <li>Complete authorization flow</li>
                                    <li>Add credentials to environment variables</li>
                                </ol>
                                <a
                                    href="/docs/GOOGLE_MEET_SETUP.md"
                                    target="_blank"
                                    className="text-primary hover:underline text-sm mt-2 inline-flex items-center gap-1"
                                >
                                    View Setup Guide <ExternalLink className="h-3 w-3" />
                                </a>
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label>Step 1: Get Client ID</Label>
                                <p className="text-xs text-muted-foreground">
                                    Add your Google Client ID to .env file as VITE_GOOGLE_CLIENT_ID
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Step 2: Authorize Access</Label>
                                <Button
                                    onClick={handleAuthorize}
                                    className="w-full"
                                    variant="outline"
                                    disabled={!import.meta.env.VITE_GOOGLE_CLIENT_ID}
                                >
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Authorize Google Calendar
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="authCode">Step 3: Paste Authorization Code (Optional)</Label>
                                <Input
                                    id="authCode"
                                    placeholder="Paste code from callback URL..."
                                    value={authCode}
                                    onChange={(e) => setAuthCode(e.target.value)}
                                />
                                <Button
                                    onClick={handleManualAuth}
                                    variant="secondary"
                                    size="sm"
                                    disabled={!authCode.trim()}
                                >
                                    Submit Code
                                </Button>
                            </div>

                            <Alert className="border-warning bg-warning/10">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-xs">
                                    <p className="font-medium">Without Google Calendar:</p>
                                    <p className="mt-1">
                                        The system will generate mock Google Meet links that look real but won't create
                                        actual calendar events. Complete the setup to enable real meeting creation.
                                    </p>
                                </AlertDescription>
                            </Alert>
                        </div>
                    </>
                )}

                <div className="pt-4 border-t">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Current Status:</span>
                        <Badge variant={isConfigured ? "default" : "secondary"}>
                            {isConfigured ? 'Connected' : 'Mock Links Only'}
                        </Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default GoogleCalendarAuth;
