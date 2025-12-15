export type UserRole = 'admin' | 'staff' | 'candidate';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  position?: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  status: 'present' | 'absent' | 'late';
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  participants: string[];
  platform: 'google-meet' | 'zoom' | 'teams';
  status: 'upcoming' | 'ongoing' | 'completed';
}

export interface Interview {
  id: string;
  candidateId: string;
  scheduledAt: string;
  duration: number;
  questions: string[];
  status: 'scheduled' | 'ongoing' | 'completed';
  recordingUrl?: string;
  notes?: string;
}