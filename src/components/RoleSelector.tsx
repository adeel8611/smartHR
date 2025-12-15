import { UserRole } from "@/types/user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Video } from "lucide-react";

interface RoleSelectorProps {
  onRoleSelect: (role: UserRole) => void;
}

const RoleSelector = ({ onRoleSelect }: RoleSelectorProps) => {
  const roles = [
    {
      id: 'admin' as UserRole,
      title: 'HR Admin',
      description: 'Manage employees, attendance, and interviews',
      icon: Users,
      color: 'from-primary to-primary-hover',
    },
    {
      id: 'staff' as UserRole,
      title: 'Staff Member',
      description: 'Mark attendance and view your schedule',
      icon: UserCheck,
      color: 'from-success to-success/80',
    },
    {
      id: 'candidate' as UserRole,
      title: 'Interview Candidate',
      description: 'Join your scheduled interview session',
      icon: Video,
      color: 'from-warning to-warning/80',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Smart HR Assistant
          </h1>
          <p className="text-xl text-muted-foreground">
            Professional attendance, meeting & interview monitoring system
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Card
                key={role.id}
                className="relative overflow-hidden border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
                onClick={() => onRoleSelect(role.id)}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${role.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
                
                <CardHeader className="text-center space-y-4">
                  <div className={`mx-auto w-16 h-16 rounded-full bg-gradient-to-r ${role.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{role.title}</CardTitle>
                  <CardDescription className="text-base">
                    {role.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="text-center pb-8">
                  <Button 
                    className="w-full shadow-sm"
                    variant="outline"
                  >
                    Continue as {role.title}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>Professional HR management system with geo-fenced attendance, meeting monitoring, and interview proctoring</p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;