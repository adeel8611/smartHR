import { UserRole } from "@/types/user";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Users,
  Calendar,
  Clock,
  Video,
  MessageSquare,
  BarChart3,
  MapPin,
  FileText,
  LogOut,
  CalendarDays,
  UserPlus,
  Flame,
  Brain,
  Sparkles,
  Scale
} from "lucide-react";

interface NavigationProps {
  userRole: UserRole;
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
}

const Navigation = ({ userRole, currentPage, onPageChange, onLogout }: NavigationProps) => {
  const getNavigationItems = () => {
    switch (userRole) {
      case 'admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { id: 'attendance', label: 'Attendance', icon: Clock },
          { id: 'leave', label: 'Leave Management', icon: CalendarDays },
          { id: 'work-location', label: 'Work Locations', icon: MapPin },
          { id: 'onboarding', label: 'Onboarding', icon: UserPlus },
          { id: 'meetings', label: 'Meetings', icon: Calendar },
          { id: 'interviews', label: 'Interviews', icon: Video },
          { id: 'employees', label: 'Employees', icon: Users },
          { id: 'skill-gap', label: 'Skill Gap Analysis', icon: Brain },
          { id: 'burnout-predictor', label: 'Burnout Predictor', icon: Flame },
          { id: 'truth-portal', label: 'Truth Portal', icon: Scale },
        ];
      case 'staff':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { id: 'attendance', label: 'My Attendance', icon: Clock },
          { id: 'leave', label: 'My Leave', icon: CalendarDays },
          { id: 'meetings', label: 'My Meetings', icon: Calendar },
          { id: 'truth-portal', label: 'Truth Portal', icon: Scale },
        ];
      case 'candidate':
        return [
          { id: 'interview', label: 'Interview Session', icon: Video },
          { id: 'instructions', label: 'Instructions', icon: FileText },
        ];
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <nav className="bg-card border-r border-border h-screen w-64 flex flex-col shadow-lg">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">Smart HR</h1>
        <p className="text-sm text-muted-foreground mt-1 capitalize">{userRole} Portal</p>
      </div>

      <div className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={currentPage === item.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-11",
                currentPage === item.id && "bg-primary text-primary-foreground shadow-sm"
              )}
              onClick={() => onPageChange(item.id)}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Button>
          );
        })}
      </div>

      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </nav>
  );
};

export default Navigation;