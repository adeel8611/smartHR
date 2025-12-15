import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  MapPin,
  Camera,
  Mail,
  Save,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";

const Settings = () => {
  const { profile } = useAuth();
  const { settings, updateSetting } = useSettings();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");

  const saveSettings = () => {
    // Settings are automatically saved to localStorage via useSettings hook
    toast({
      title: "Settings Saved",
      description: "Your settings have been updated successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Configure application settings and preferences</p>
        </div>
        <Button onClick={saveSettings}>
          <Save className="h-4 w-4 mr-2" />
          Save All
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-primary" />
                Company Information
              </CardTitle>
              <CardDescription>
                Basic company settings and configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={settings.companyName}
                    onChange={(e) => updateSetting('companyName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    value={settings.timezone}
                    onChange={(e) => updateSetting('timezone', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="officeAddress">Office Address</Label>
                <Input
                  id="officeAddress"
                  value={settings.officeAddress}
                  onChange={(e) => updateSetting('officeAddress', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workingHours">Working Hours</Label>
                <Input
                  id="workingHours"
                  value={settings.workingHours}
                  onChange={(e) => updateSetting('workingHours', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{profile?.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                  <Badge variant="secondary" className="mt-1">{profile?.role}</Badge>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Update Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Location & Tracking
              </CardTitle>
              <CardDescription>
                GPS and attendance tracking settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="attendanceRadius">Attendance Radius (meters)</Label>
                <Input
                  id="attendanceRadius"
                  type="number"
                  value={settings.attendanceRadius}
                  onChange={(e) => updateSetting('attendanceRadius', parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Employees must be within this distance from office to mark attendance
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lateThreshold">Late Threshold (minutes)</Label>
                <Input
                  id="lateThreshold"
                  type="number"
                  value={settings.lateThreshold}
                  onChange={(e) => updateSetting('lateThreshold', parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Mark attendance as late after this many minutes past 9:00 AM
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoCheckout">Auto Checkout</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically check out employees at end of day
                  </p>
                </div>
                <Switch
                  id="autoCheckout"
                  checked={settings.autoCheckout}
                  onCheckedChange={(checked) => updateSetting('autoCheckout', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weekendTracking">Weekend Tracking</Label>
                  <p className="text-sm text-muted-foreground">
                    Track attendance on weekends
                  </p>
                </div>
                <Switch
                  id="weekendTracking"
                  checked={settings.weekendTracking}
                  onCheckedChange={(checked) => updateSetting('weekendTracking', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interviews" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                Interview & Proctoring
              </CardTitle>
              <CardDescription>
                Configure interview and monitoring settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="recordingEnabled">Recording Enabled</Label>
                  <p className="text-sm text-muted-foreground">
                    Record interview sessions for review
                  </p>
                </div>
                <Switch
                  id="recordingEnabled"
                  checked={settings.recordingEnabled}
                  onCheckedChange={(checked) => updateSetting('recordingEnabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="cameraRequired">Camera Required</Label>
                  <p className="text-sm text-muted-foreground">
                    Require camera access for interviews
                  </p>
                </div>
                <Switch
                  id="cameraRequired"
                  checked={settings.cameraRequired}
                  onCheckedChange={(checked) => updateSetting('cameraRequired', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="questionTimeLimit">Question Time Limit (seconds)</Label>
                <Input
                  id="questionTimeLimit"
                  type="number"
                  value={settings.questionTimeLimit}
                  onChange={(e) => updateSetting('questionTimeLimit', parseInt(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proctoringSensitivity">Proctoring Sensitivity</Label>
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value={settings.proctoringSensitivity}
                  onChange={(e) => updateSetting('proctoringSensitivity', e.target.value as 'low' | 'medium' | 'high')}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  How sensitive the tab switch detection should be
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="pushNotifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive browser push notifications
                  </p>
                </div>
                <Switch
                  id="pushNotifications"
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="attendanceAlerts">Attendance Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about attendance issues
                  </p>
                </div>
                <Switch
                  id="attendanceAlerts"
                  checked={settings.attendanceAlerts}
                  onCheckedChange={(checked) => updateSetting('attendanceAlerts', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="interviewReminders">Interview Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive reminders about upcoming interviews
                  </p>
                </div>
                <Switch
                  id="interviewReminders"
                  checked={settings.interviewReminders}
                  onCheckedChange={(checked) => updateSetting('interviewReminders', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="systemUpdates">System Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about system updates and maintenance
                  </p>
                </div>
                <Switch
                  id="systemUpdates"
                  checked={settings.systemUpdates}
                  onCheckedChange={(checked) => updateSetting('systemUpdates', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage security and access control settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch
                  id="twoFactorAuth"
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) => updateSetting('twoFactorAuth', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Automatically log out users after this period of inactivity
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                <Input
                  id="passwordExpiry"
                  type="number"
                  value={settings.passwordExpiry}
                  onChange={(e) => updateSetting('passwordExpiry', parseInt(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="failedLoginLimit">Failed Login Limit</Label>
                <Input
                  id="failedLoginLimit"
                  type="number"
                  value={settings.failedLoginLimit}
                  onChange={(e) => updateSetting('failedLoginLimit', parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Lock account after this many failed login attempts
                </p>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Security settings affect all users in the system. Changes will take effect immediately.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;