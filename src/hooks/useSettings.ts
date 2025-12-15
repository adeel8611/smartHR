import { useState, useEffect } from 'react';

export interface AppSettings {
    // Attendance Settings
    attendanceRadius: number;
    officeLatitude: number;
    officeLongitude: number;
    lateThreshold: number;
    autoCheckout: boolean;
    weekendTracking: boolean;

    // General Settings
    companyName: string;
    officeAddress: string;
    workingHours: string;
    timezone: string;

    // Interview Settings
    recordingEnabled: boolean;
    proctoringSensitivity: 'low' | 'medium' | 'high';
    questionTimeLimit: number;
    cameraRequired: boolean;

    // Notification Settings
    emailNotifications: boolean;
    pushNotifications: boolean;
    attendanceAlerts: boolean;
    interviewReminders: boolean;
    systemUpdates: boolean;

    // Security Settings
    twoFactorAuth: boolean;
    sessionTimeout: number;
    passwordExpiry: number;
    failedLoginLimit: number;
}

const DEFAULT_SETTINGS: AppSettings = {
    // Attendance Settings - using 200m as more forgiving for GPS accuracy
    attendanceRadius: 200,
    officeLatitude: 31.454003,
    officeLongitude: 74.432512,
    lateThreshold: 15,
    autoCheckout: true,
    weekendTracking: false,

    // General Settings
    companyName: "Tech Corp",
    officeAddress: "Lahore, Pakistan",
    workingHours: "9:00 AM - 6:00 PM",
    timezone: "Asia/Karachi",

    // Interview Settings
    recordingEnabled: true,
    proctoringSensitivity: "medium",
    questionTimeLimit: 300,
    cameraRequired: true,

    // Notification Settings
    emailNotifications: true,
    pushNotifications: false,
    attendanceAlerts: true,
    interviewReminders: true,
    systemUpdates: false,

    // Security Settings
    twoFactorAuth: false,
    sessionTimeout: 60,
    passwordExpiry: 90,
    failedLoginLimit: 5,
};

const STORAGE_KEY = 'app_settings';

export const useSettings = () => {
    const [settings, setSettings] = useState<AppSettings>(() => {
        // Try to load settings from localStorage
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Merge with defaults to handle new settings added over time
                return { ...DEFAULT_SETTINGS, ...parsed };
            }
        } catch (error) {
            console.error('Error loading settings from localStorage:', error);
        }
        return DEFAULT_SETTINGS;
    });

    // Save settings to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving settings to localStorage:', error);
        }
    }, [settings]);

    const updateSetting = <K extends keyof AppSettings>(
        key: K,
        value: AppSettings[K]
    ) => {
        setSettings((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const updateSettings = (updates: Partial<AppSettings>) => {
        setSettings((prev) => ({
            ...prev,
            ...updates,
        }));
    };

    const resetSettings = () => {
        setSettings(DEFAULT_SETTINGS);
    };

    return {
        settings,
        updateSetting,
        updateSettings,
        resetSettings,
    };
};
