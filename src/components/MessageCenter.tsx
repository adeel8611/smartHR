import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { 
  Send, 
  Mail, 
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Employee {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department?: string;
}

interface Message {
  id: string;
  recipient_id: string;
  subject: string;
  body: string;
  status: string;
  sent_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

const MessageCenter = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    recipient_id: '',
    subject: '',
    body: ''
  });

  useEffect(() => {
    fetchEmployees();
    fetchMessages();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, email, role, department')
        .neq('user_id', user?.id) // Exclude current user
        .order('full_name');

      if (error) throw error;
      setEmployees(data?.map(profile => ({
        id: profile.user_id,
        full_name: profile.full_name,
        email: profile.email,
        role: profile.role,
        department: profile.department
      })) || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to fetch employees.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          recipient_id,
          subject,
          body,
          status,
          sent_at
        `)
        .eq('sender_id', user?.id)
        .order('sent_at', { ascending: false });

      if (error) throw error;

      // Fetch recipient profiles separately
      const messagesWithProfiles = await Promise.all(
        (data || []).map(async (message) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', message.recipient_id)
            .single();

          return {
            ...message,
            profiles: profile || { full_name: 'Unknown User', email: '' }
          };
        })
      );

      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.recipient_id || !formData.subject || !formData.body) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      // Get recipient email
      const recipient = employees.find(emp => emp.id === formData.recipient_id);
      if (!recipient) {
        throw new Error('Recipient not found');
      }

      // Save message to database
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: user?.id,
          recipient_id: formData.recipient_id,
          subject: formData.subject,
          body: formData.body,
          status: 'sent'
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Send email via Supabase Edge Function
      const { error: emailError } = await supabase.functions.invoke('send-bulk-email', {
        body: {
          recipients: [recipient.email],
          subject: formData.subject,
          body: formData.body,
          senderName: 'HR Team'
        }
      });

      if (emailError) {
        console.error('Email sending error:', emailError);
        // Update message status to failed
        await supabase
          .from('messages')
          .update({ status: 'failed' })
          .eq('id', messageData.id);
        
        throw new Error('Failed to send email');
      }

      // Update message status to delivered
      await supabase
        .from('messages')
        .update({ status: 'delivered' })
        .eq('id', messageData.id);

      toast({
        title: "Success",
        description: `Message sent to ${recipient.full_name} successfully.`,
      });

      await fetchMessages();
      resetForm();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setFormData({
      recipient_id: '',
      subject: '',
      body: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-success';
      case 'sent': return 'bg-primary';
      case 'failed': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'sent': return <Clock className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-500';
      case 'staff': return 'bg-blue-500';
      case 'candidate': return 'bg-green-500';
      default: return 'bg-muted';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Message Center</h2>
          <p className="text-muted-foreground">Send messages to employees via email</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Send className="h-4 w-4 mr-2" />
              Compose Message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Compose New Message</DialogTitle>
              <DialogDescription>
                Send a message to an employee. They will receive it via email.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient</Label>
                <Select value={formData.recipient_id} onValueChange={(value) => setFormData({ ...formData, recipient_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an employee..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        <div className="flex items-center gap-2">
                          <span>{employee.full_name}</span>
                          <Badge className={`text-white text-xs ${getRoleColor(employee.role)}`}>
                            {employee.role}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Enter message subject..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Message</Label>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Type your message here..."
                  rows={6}
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1" disabled={sending}>
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sent Messages */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Sent Messages ({messages.length})
          </CardTitle>
          <CardDescription>
            Messages you have sent to employees
          </CardDescription>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No messages sent yet. Click "Compose Message" to send your first message.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {message.profiles?.full_name || 'Unknown User'}
                      </span>
                      <Badge className={`text-white ${getStatusColor(message.status)}`}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(message.status)}
                          {message.status}
                        </div>
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(message.sent_at).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">{message.subject}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {message.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MessageCenter;