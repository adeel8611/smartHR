export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          approved_by: string | null
          check_in: string | null
          check_out: string | null
          created_at: string | null
          date: string
          id: string
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          status: string | null
          user_id: string
          work_location: string | null
        }
        Insert: {
          approved_by?: string | null
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          date?: string
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          status?: string | null
          user_id: string
          work_location?: string | null
        }
        Update: {
          approved_by?: string | null
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          date?: string
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          status?: string | null
          user_id?: string
          work_location?: string | null
        }
        Relationships: []
      }
      employee_onboarding: {
        Row: {
          actual_joining_date: string | null
          created_at: string
          created_by: string | null
          employee_id: string
          expected_joining_date: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          actual_joining_date?: string | null
          created_at?: string
          created_by?: string | null
          employee_id: string
          expected_joining_date: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          actual_joining_date?: string | null
          created_at?: string
          created_by?: string | null
          employee_id?: string
          expected_joining_date?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_onboarding_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      employee_onboarding_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          due_date: string
          employee_onboarding_id: string
          id: string
          status: string
          task_id: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          due_date: string
          employee_onboarding_id: string
          id?: string
          status?: string
          task_id: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          due_date?: string
          employee_onboarding_id?: string
          id?: string
          status?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_onboarding_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "employee_onboarding_tasks_employee_onboarding_id_fkey"
            columns: ["employee_onboarding_id"]
            isOneToOne: false
            referencedRelation: "employee_onboarding"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_onboarding_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "onboarding_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          id: string
          interview_id: string
          screenshot_url: string | null
          timestamp: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          id?: string
          interview_id: string
          screenshot_url?: string | null
          timestamp?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          id?: string
          interview_id?: string
          screenshot_url?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_alerts_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_questions: {
        Row: {
          answer_text: string | null
          answer_video_url: string | null
          created_at: string | null
          id: string
          interview_id: string
          question: string
          question_order: number
          time_limit_seconds: number | null
        }
        Insert: {
          answer_text?: string | null
          answer_video_url?: string | null
          created_at?: string | null
          id?: string
          interview_id: string
          question: string
          question_order: number
          time_limit_seconds?: number | null
        }
        Update: {
          answer_text?: string | null
          answer_video_url?: string | null
          created_at?: string | null
          id?: string
          interview_id?: string
          question?: string
          question_order?: number
          time_limit_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_questions_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          ai_resume_score: number | null
          candidate_id: string
          created_at: string | null
          created_by: string | null
          duration_minutes: number | null
          id: string
          notes: string | null
          position: string
          position_id: string | null
          recording_url: string | null
          resume_id: string | null
          scheduled_at: string
          score: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          ai_resume_score?: number | null
          candidate_id: string
          created_at?: string | null
          created_by?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          position: string
          position_id?: string | null
          recording_url?: string | null
          resume_id?: string | null
          scheduled_at: string
          score?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_resume_score?: number | null
          candidate_id?: string
          created_at?: string | null
          created_by?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          position?: string
          position_id?: string | null
          recording_url?: string | null
          resume_id?: string | null
          scheduled_at?: string
          score?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interviews_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_balances: {
        Row: {
          annual_days_total: number
          annual_days_used: number
          created_at: string
          employee_id: string
          id: string
          personal_days_total: number
          personal_days_used: number
          sick_days_total: number
          sick_days_used: number
          updated_at: string
          year: number
        }
        Insert: {
          annual_days_total?: number
          annual_days_used?: number
          created_at?: string
          employee_id: string
          id?: string
          personal_days_total?: number
          personal_days_used?: number
          sick_days_total?: number
          sick_days_used?: number
          updated_at?: string
          year?: number
        }
        Update: {
          annual_days_total?: number
          annual_days_used?: number
          created_at?: string
          employee_id?: string
          id?: string
          personal_days_total?: number
          personal_days_used?: number
          sick_days_total?: number
          sick_days_used?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          reason: string
          rejection_reason: string | null
          start_date: string
          status: string
          total_days: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id: string
          end_date: string
          id?: string
          leave_type: string
          reason: string
          rejection_reason?: string | null
          start_date: string
          status?: string
          total_days: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string
          rejection_reason?: string | null
          start_date?: string
          status?: string
          total_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      meeting_participants: {
        Row: {
          id: string
          meeting_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          id?: string
          meeting_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          id?: string
          meeting_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_participants_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          meeting_url: string | null
          minutes: string | null
          platform: string | null
          scheduled_at: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          meeting_url?: string | null
          minutes?: string | null
          platform?: string | null
          scheduled_at: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          meeting_url?: string | null
          minutes?: string | null
          platform?: string | null
          scheduled_at?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          recipient_id: string
          sender_id: string
          sent_at: string | null
          status: string | null
          subject: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          recipient_id: string
          sender_id: string
          sent_at?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          recipient_id?: string
          sender_id?: string
          sent_at?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: []
      }
      onboarding_stages: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          stage_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          stage_order: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          stage_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      onboarding_tasks: {
        Row: {
          created_at: string
          description: string | null
          due_days_offset: number
          file_url: string | null
          id: string
          notify_employee: boolean
          stage_id: string
          task_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_days_offset?: number
          file_url?: string | null
          id?: string
          notify_employee?: boolean
          stage_id: string
          task_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_days_offset?: number
          file_url?: string | null
          id?: string
          notify_employee?: boolean
          stage_id?: string
          task_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_tasks_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "onboarding_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          created_at: string
          created_by: string | null
          department: string | null
          description: string | null
          experience_level: string | null
          id: string
          job_requirements: Json | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          experience_level?: string | null
          id?: string
          job_requirements?: Json | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          experience_level?: string | null
          id?: string
          job_requirements?: Json | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          department: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          position: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          full_name: string
          id?: string
          phone?: string | null
          position?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          position?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      question_templates: {
        Row: {
          created_at: string
          id: string
          position_id: string
          question: string
          question_order: number
          question_type: string | null
          time_limit_seconds: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          position_id: string
          question: string
          question_order: number
          question_type?: string | null
          time_limit_seconds?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          position_id?: string
          question?: string
          question_order?: number
          question_type?: string | null
          time_limit_seconds?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_templates_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      resumes: {
        Row: {
          ai_analysis: Json | null
          ai_score: number | null
          candidate_id: string
          content_type: string | null
          created_at: string
          extracted_text: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          position_id: string | null
          updated_at: string
          uploaded_at: string
        }
        Insert: {
          ai_analysis?: Json | null
          ai_score?: number | null
          candidate_id: string
          content_type?: string | null
          created_at?: string
          extracted_text?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          position_id?: string | null
          updated_at?: string
          uploaded_at?: string
        }
        Update: {
          ai_analysis?: Json | null
          ai_score?: number | null
          candidate_id?: string
          content_type?: string | null
          created_at?: string
          extracted_text?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          position_id?: string | null
          updated_at?: string
          uploaded_at?: string
        }
        Relationships: []
      }
      work_location_settings: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          can_work_remotely: boolean
          created_at: string
          default_location: string
          employee_id: string
          id: string
          remote_days_per_week: number | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          can_work_remotely?: boolean
          created_at?: string
          default_location?: string
          employee_id: string
          id?: string
          remote_days_per_week?: number | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          can_work_remotely?: boolean
          created_at?: string
          default_location?: string
          employee_id?: string
          id?: string
          remote_days_per_week?: number | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_working_hours: {
        Args: { check_in_time: string; check_out_time: string }
        Returns: number
      }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      user_role: "admin" | "staff" | "candidate"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["admin", "staff", "candidate"],
    },
  },
} as const
