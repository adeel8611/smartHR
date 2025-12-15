import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Send, Users, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  department: string | null;
}

interface EmailHistory {
  id: string;
  subject: string;
  body: string;
  recipients: string[];
  sent_at: string;
  status: 'sent' | 'failed';
}

const EmailCenter = () => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [emailHistory, setEmailHistory] = useState<EmailHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const [formData, setFormData] = useState({
    subject: '',
    body: '',
    recipientType: 'individual' // 'individual', 'all', 'role', 'department'
  });

  const [filters, setFilters] = useState({
    role: '',
    department: ''
  });

  useEffect(() => {
    fetchProfiles();
    fetchEmailHistory();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Error",
        description: "Failed to load employee profiles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailHistory = async () => {
    // For now, we'll store email history in localStorage
    // In a real app, you'd store this in the database
    const history = localStorage.getItem('emailHistory');
    if (history) {
      setEmailHistory(JSON.parse(history));
    }
  };

  const saveEmailToHistory = (emailData: Omit<EmailHistory, 'id'>) => {
    const newEmail = {
      ...emailData,
      id: Date.now().toString()
    };
    
    const history = JSON.parse(localStorage.getItem('emailHistory') || '[]');
    history.unshift(newEmail);
    localStorage.setItem('emailHistory', JSON.stringify(history.slice(0, 50))); // Keep last 50 emails
    setEmailHistory(history.slice(0, 50));
  };

  const getFilteredProfiles = () => {
    return profiles.filter(profile => {
      if (filters.role && profile.role !== filters.role) return false;
      if (filters.department && profile.department !== filters.department) return false;
      return true;
    });
  };

  const getRecipientEmails = () => {
    switch (formData.recipientType) {
      case 'all':
        return profiles.map(p => p.email);
      case 'role':
        return profiles.filter(p => p.role === filters.role).map(p => p.email);
      case 'department':
        return profiles.filter(p => p.department === filters.department).map(p => p.email);
      default:
        return selectedRecipients;
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.body.trim()) {
      toast({
        title: "Error",
        description: "Please fill in subject and message",
        variant: "destructive",
      });
      return;
    }

    const recipientEmails = getRecipientEmails();
    
    if (recipientEmails.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one recipient",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      const { error } = await supabase.functions.invoke('send-bulk-email', {
        body: {
          recipients: recipientEmails,
          subject: formData.subject,
          body: formData.body
        }
      });

      if (error) throw error;

      // Save to history
      saveEmailToHistory({
        subject: formData.subject,
        body: formData.body,
        recipients: recipientEmails,
        sent_at: new Date().toISOString(),
        status: 'sent'
      });

      toast({
        title: "Success",
        description: `Email sent to ${recipientEmails.length} recipient(s)`,
      });

      // Reset form
      setFormData({
        subject: '',
        body: '',
        recipientType: 'individual'
      });
      setSelectedRecipients([]);
      setFilters({ role: '', department: '' });

    } catch (error) {
      console.error('Error sending email:', error);
      
      // Save failed attempt to history
      saveEmailToHistory({
        subject: formData.subject,
        body: formData.body,
        recipients: recipientEmails,
        sent_at: new Date().toISOString(),
        status: 'failed'
      });

      toast({
        title: "Error",
        description: "Failed to send email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleRecipientToggle = (email: string) => {
    setSelectedRecipients(prev => 
      prev.includes(email) 
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const handleSelectAll = () => {
    const filteredEmails = getFilteredProfiles().map(p => p.email);
    setSelectedRecipients(filteredEmails);
  };

  const handleClearAll = () => {
    setSelectedRecipients([]);
  };

  const uniqueRoles = [...new Set(profiles.map(p => p.role))];
  const uniqueDepartments = [...new Set(profiles.map(p => p.department).filter(Boolean))];

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Email Center</h2>
        <Badge variant="outline" className="flex items-center gap-1">
          <Mail className="h-3 w-3" />
          {profiles.length} Employees
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Composer */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Compose Email
            </CardTitle>
            <CardDescription>
              Send emails to employees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div className="space-y-2">
                <Label>Recipient Type</Label>
                <Select
                  value={formData.recipientType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, recipientType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Select Individual Recipients</SelectItem>
                    <SelectItem value="all">All Employees</SelectItem>
                    <SelectItem value="role">By Role</SelectItem>
                    <SelectItem value="department">By Department</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.recipientType === 'role' && (
                <div className="space-y-2">
                  <Label>Select Role</Label>
                  <Select
                    value={filters.role}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose role..." />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.recipientType === 'department' && (
                <div className="space-y-2">
                  <Label>Select Department</Label>
                  <Select
                    value={filters.department}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, department: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose department..." />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueDepartments.map((dept) => (
                        <SelectItem key={dept} value={dept!}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.recipientType === 'individual' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Recipients ({selectedRecipients.length} selected)</Label>
                    <div className="space-x-2">
                      <Button type="button" variant="outline" size="sm" onClick={handleSelectAll}>
                        Select All
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={handleClearAll}>
                        Clear All
                      </Button>
                    </div>
                  </div>
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                    {getFilteredProfiles().map((profile) => (
                      <div key={profile.user_id} className="flex items-center space-x-2">
                        <Checkbox
                          id={profile.user_id}
                          checked={selectedRecipients.includes(profile.email)}
                          onCheckedChange={() => handleRecipientToggle(profile.email)}
                        />
                        <label htmlFor={profile.user_id} className="text-sm flex-1 cursor-pointer">
                          <div className="flex justify-between">
                            <span>{profile.full_name}</span>
                            <span className="text-muted-foreground">{profile.email}</span>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Email subject..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Message</Label>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="Write your message here..."
                  rows={6}
                  required
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Recipients: {getRecipientEmails().length}
                </div>
                <Button type="submit" disabled={sending}>
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Email
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Email History */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Email History
            </CardTitle>
            <CardDescription>
              Recent sent emails
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {emailHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No emails sent yet</p>
                </div>
              ) : (
                emailHistory.map((email) => (
                  <div key={email.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{email.subject}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant={email.status === 'sent' ? 'default' : 'destructive'}>
                          {email.status === 'sent' ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <AlertCircle className="h-3 w-3 mr-1" />
                          )}
                          {email.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {email.body}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{email.recipients.length} recipient(s)</span>
                      <span>{new Date(email.sent_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailCenter;