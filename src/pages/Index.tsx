import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
import StaffDashboard from "@/components/dashboards/StaffDashboard";
import CandidateDashboard from "@/components/dashboards/CandidateDashboard";
import TodayMeetings from "@/components/TodayMeetings";
import EmployeeManagement from "@/components/EmployeeManagement";
import LeaveManagement from "@/components/LeaveManagement";
import WorkLocationManagement from "@/components/WorkLocationManagement";
import HoursBasedAnalytics from "@/components/HoursBasedAnalytics";
import AttendanceManagement from "./AttendanceManagement";
import InterviewManagement from "./InterviewManagement";
import OnboardingManagement from "./OnboardingManagement";
import ReportsAnalytics from "./ReportsAnalytics";
import Settings from "./Settings";
import NotificationBell from "@/components/NotificationBell";
import SkillGapHeatmap from "@/components/SkillGapHeatmap";
import BurnoutPredictor from "@/components/BurnoutPredictor";
import TruthPortal from "@/components/TruthPortal";

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const renderDashboard = () => {
    if (!profile) return null;

    switch (profile.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'staff':
        return <StaffDashboard />;
      case 'candidate':
        return <CandidateDashboard />;
      default:
        return null;
    }
  };

  const renderPageContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return renderDashboard();
      case 'attendance':
        return <AttendanceManagement />;
      case 'leave':
        return <LeaveManagement />;
      case 'work-location':
        return <WorkLocationManagement />;
      case 'onboarding':
        return <OnboardingManagement />;
      case 'meetings':
        return <TodayMeetings />;
      case 'interviews':
        return <InterviewManagement />;
      case 'employees':
        return <EmployeeManagement />;
      case 'reports':
        return <HoursBasedAnalytics />;
      case 'settings':
        return <Settings />;
      case 'skill-gap':
        return <SkillGapHeatmap />;
      case 'burnout-predictor':
        return <BurnoutPredictor />;
      case 'truth-portal':
        return <TruthPortal />;
      default:
        return renderDashboard();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation
        userRole={profile.role}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col">
        {/* Header with Notification Bell */}
        <header className="bg-background border-b px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{profile.full_name}</h1>
            <p className="text-sm text-muted-foreground capitalize">{profile.role}</p>
          </div>
          <NotificationBell />
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {renderPageContent()}
        </main>
      </div>
    </div>
  );
};

export default Index;
