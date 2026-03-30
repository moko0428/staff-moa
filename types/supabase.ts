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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_reviews: {
        Row: {
          content: string
          created_at: string
          is_featured: boolean
          rating: number
          review_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          is_featured?: boolean
          rating: number
          review_id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          is_featured?: boolean
          rating?: number
          review_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_reviews_user_id_profiles_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      attendance_reviews: {
        Row: {
          comment: string
          created_at: string
          member_id: string
          penalty_items: Json | null
          post_id: number
          review_id: string
          reviewed_by: string
          score: number
          updated_at: string
        }
        Insert: {
          comment: string
          created_at?: string
          member_id: string
          penalty_items?: Json | null
          post_id: number
          review_id?: string
          reviewed_by: string
          score: number
          updated_at?: string
        }
        Update: {
          comment?: string
          created_at?: string
          member_id?: string
          penalty_items?: Json | null
          post_id?: number
          review_id?: string
          reviewed_by?: string
          score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_reviews_member_id_profiles_user_id_fk"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "attendance_reviews_post_id_posts_post_id_fk"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "attendance_reviews_reviewed_by_profiles_user_id_fk"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      favorites_keywords: {
        Row: {
          created_at: string
          keyword: string
          user_id: string
        }
        Insert: {
          created_at?: string
          keyword: string
          user_id: string
        }
        Update: {
          created_at?: string
          keyword?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_keywords_user_id_profiles_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      favorites_posts: {
        Row: {
          created_at: string
          post_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_posts_post_id_posts_post_id_fk"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "favorites_posts_user_id_profiles_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      followers: {
        Row: {
          created_at: string
          follower_id: string | null
          following_id: string | null
        }
        Insert: {
          created_at?: string
          follower_id?: string | null
          following_id?: string | null
        }
        Update: {
          created_at?: string
          follower_id?: string | null
          following_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "followers_follower_id_profiles_user_id_fk"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "followers_following_id_profiles_user_id_fk"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      landing_popups: {
        Row: {
          content: string
          created_at: string
          image_url: string | null
          is_active: boolean
          link_text: string | null
          link_url: string | null
          popup_id: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          image_url?: string | null
          is_active?: boolean
          link_text?: string | null
          link_url?: string | null
          popup_id?: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          image_url?: string | null
          is_active?: boolean
          link_text?: string | null
          link_url?: string | null
          popup_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      manager_follows: {
        Row: {
          created_at: string
          follower_id: string
          manager_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          manager_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          manager_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_follows_follower_id_profiles_user_id_fk"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "manager_follows_manager_id_profiles_user_id_fk"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      manager_worker_management: {
        Row: {
          created_at: string
          id: string
          is_blacklisted: boolean
          is_favorite: boolean
          manager_id: string
          notes: string | null
          rating: number | null
          updated_at: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_blacklisted?: boolean
          is_favorite?: boolean
          manager_id: string
          notes?: string | null
          rating?: number | null
          updated_at?: string
          worker_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_blacklisted?: boolean
          is_favorite?: boolean
          manager_id?: string
          notes?: string | null
          rating?: number | null
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_worker_management_manager_id_profiles_user_id_fk"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "manager_worker_management_worker_id_profiles_user_id_fk"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      member_schedules: {
        Row: {
          arrived_at: string | null
          assigned_role: string | null
          checked_in_at: string | null
          checked_out_at: string | null
          checkin_status: string
          created_at: string
          manager_memo: string | null
          member_id: string
          member_schedule_id: string
          message: string | null
          movement_status: string | null
          post_id: number
          staff_status: string
          status: Database["public"]["Enums"]["member_schedule_status"]
          updated_at: string
        }
        Insert: {
          arrived_at?: string | null
          assigned_role?: string | null
          checked_in_at?: string | null
          checked_out_at?: string | null
          checkin_status?: string
          created_at?: string
          manager_memo?: string | null
          member_id: string
          member_schedule_id?: string
          message?: string | null
          movement_status?: string | null
          post_id: number
          staff_status?: string
          status?: Database["public"]["Enums"]["member_schedule_status"]
          updated_at?: string
        }
        Update: {
          arrived_at?: string | null
          assigned_role?: string | null
          checked_in_at?: string | null
          checked_out_at?: string | null
          checkin_status?: string
          created_at?: string
          manager_memo?: string | null
          member_id?: string
          member_schedule_id?: string
          message?: string | null
          movement_status?: string | null
          post_id?: number
          staff_status?: string
          status?: Database["public"]["Enums"]["member_schedule_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_schedules_member_id_profiles_user_id_fk"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "member_schedules_post_id_posts_post_id_fk"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["post_id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          is_read: boolean
          link: string | null
          message: string
          notification_id: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          is_read?: boolean
          link?: string | null
          message: string
          notification_id?: string
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          is_read?: boolean
          link?: string | null
          message?: string
          notification_id?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_profiles_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      personal_schedules: {
        Row: {
          created_at: string
          date: string
          description: string | null
          end_time: string
          location: string | null
          manager_contact_type: string | null
          manager_name: string | null
          manager_phone: string | null
          pay_amount: number | null
          pay_type: Database["public"]["Enums"]["pay_type"] | null
          personal_schedule_id: string
          start_time: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          description?: string | null
          end_time: string
          location?: string | null
          manager_contact_type?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          pay_amount?: number | null
          pay_type?: Database["public"]["Enums"]["pay_type"] | null
          personal_schedule_id?: string
          start_time: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          end_time?: string
          location?: string | null
          manager_contact_type?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          pay_amount?: number | null
          pay_type?: Database["public"]["Enums"]["pay_type"] | null
          personal_schedule_id?: string
          start_time?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_schedules_user_id_profiles_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      post_reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          detail: string | null
          post_id: number
          reason: Database["public"]["Enums"]["report_reason"]
          report_id: number
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          detail?: string | null
          post_id: number
          reason: Database["public"]["Enums"]["report_reason"]
          report_id?: never
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          detail?: string | null
          post_id?: number
          reason?: Database["public"]["Enums"]["report_reason"]
          report_id?: never
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "post_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "post_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "post_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          created_at: string
          description: string
          equipments: string | null
          event_positions: string[]
          external_link: string | null
          form_type: string | null
          keywords: string[] | null
          location: string
          manager_contact_type: string
          manager_name: string
          manager_phone: string
          manual_staff: Json
          notes: string | null
          pay_amount: number
          pay_type: Database["public"]["Enums"]["pay_type"]
          post_id: number
          preferences: string | null
          qualifications: string | null
          recruit_count: number
          status: Database["public"]["Enums"]["post_status"]
          tax_withholding: boolean
          title: string
          updated_at: string
          work_date: string
          work_slots: Json
          work_time_end: string
          work_time_start: string
        }
        Insert: {
          author_id: string
          created_at?: string
          description: string
          equipments?: string | null
          event_positions?: string[]
          external_link?: string | null
          form_type?: string | null
          keywords?: string[] | null
          location: string
          manager_contact_type?: string
          manager_name: string
          manager_phone: string
          manual_staff?: Json
          notes?: string | null
          pay_amount: number
          pay_type?: Database["public"]["Enums"]["pay_type"]
          post_id?: never
          preferences?: string | null
          qualifications?: string | null
          recruit_count: number
          status?: Database["public"]["Enums"]["post_status"]
          tax_withholding?: boolean
          title: string
          updated_at?: string
          work_date: string
          work_slots?: Json
          work_time_end: string
          work_time_start: string
        }
        Update: {
          author_id?: string
          created_at?: string
          description?: string
          equipments?: string | null
          event_positions?: string[]
          external_link?: string | null
          form_type?: string | null
          keywords?: string[] | null
          location?: string
          manager_contact_type?: string
          manager_name?: string
          manager_phone?: string
          manual_staff?: Json
          notes?: string | null
          pay_amount?: number
          pay_type?: Database["public"]["Enums"]["pay_type"]
          post_id?: never
          preferences?: string | null
          qualifications?: string | null
          recruit_count?: number
          status?: Database["public"]["Enums"]["post_status"]
          tax_withholding?: boolean
          title?: string
          updated_at?: string
          work_date?: string
          work_slots?: Json
          work_time_end?: string
          work_time_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_profiles_user_id_fk"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          attendance_score: number
          avatar: string | null
          banned_at: string | null
          banned_by_admin_id: string | null
          banned_reason: string | null
          banned_until: string | null
          bio: string | null
          birth_date: string | null
          business_number: string | null
          company_certificate: string | null
          company_name: string | null
          company_verify_status:
            | Database["public"]["Enums"]["company_verify_status"]
            | null
          cover_image: string | null
          created_at: string
          documents: Json | null
          email: string | null
          experiences: Json | null
          favorites: Json | null
          features: string | null
          gender: Database["public"]["Enums"]["gender"] | null
          height: number | null
          is_banned: boolean
          kakao_id: string | null
          last_ban_update_at: string | null
          mbti: string | null
          name: string | null
          personality: string | null
          phone: string | null
          profile_visibility: Json | null
          recent_photos: Json | null
          role: Database["public"]["Enums"]["user_role"]
          stats: Json | null
          updated_at: string
          user_id: string
          views: Json | null
          weight: number | null
        }
        Insert: {
          attendance_score?: number
          avatar?: string | null
          banned_at?: string | null
          banned_by_admin_id?: string | null
          banned_reason?: string | null
          banned_until?: string | null
          bio?: string | null
          birth_date?: string | null
          business_number?: string | null
          company_certificate?: string | null
          company_name?: string | null
          company_verify_status?:
            | Database["public"]["Enums"]["company_verify_status"]
            | null
          cover_image?: string | null
          created_at?: string
          documents?: Json | null
          email?: string | null
          experiences?: Json | null
          favorites?: Json | null
          features?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          height?: number | null
          is_banned?: boolean
          kakao_id?: string | null
          last_ban_update_at?: string | null
          mbti?: string | null
          name?: string | null
          personality?: string | null
          phone?: string | null
          profile_visibility?: Json | null
          recent_photos?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          stats?: Json | null
          updated_at?: string
          user_id: string
          views?: Json | null
          weight?: number | null
        }
        Update: {
          attendance_score?: number
          avatar?: string | null
          banned_at?: string | null
          banned_by_admin_id?: string | null
          banned_reason?: string | null
          banned_until?: string | null
          bio?: string | null
          birth_date?: string | null
          business_number?: string | null
          company_certificate?: string | null
          company_name?: string | null
          company_verify_status?:
            | Database["public"]["Enums"]["company_verify_status"]
            | null
          cover_image?: string | null
          created_at?: string
          documents?: Json | null
          email?: string | null
          experiences?: Json | null
          favorites?: Json | null
          features?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          height?: number | null
          is_banned?: boolean
          kakao_id?: string | null
          last_ban_update_at?: string | null
          mbti?: string | null
          name?: string | null
          personality?: string | null
          phone?: string | null
          profile_visibility?: Json | null
          recent_photos?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          stats?: Json | null
          updated_at?: string
          user_id?: string
          views?: Json | null
          weight?: number | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "push_subscriptions_user_id_profiles_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reported_user_id: string
          reporter_id: string
          resolved_at: string | null
          resolved_by_admin_id: string | null
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reported_user_id: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by_admin_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by_admin_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_user_id_profiles_user_id_fk"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reports_reporter_id_profiles_user_id_fk"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reports_resolved_by_admin_id_profiles_user_id_fk"
            columns: ["resolved_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      company_verify_status: "pending" | "approved" | "rejected"
      gender: "남성" | "여성" | "미정"
      manager_schedule_status: "upcoming" | "ongoing" | "completed"
      member_schedule_status: "pending" | "accepted" | "rejected"
      notification_type:
        | "application_accepted"
        | "application_rejected"
        | "new_application"
        | "schedule_reminder"
        | "system"
        | "event_briefing"
      pay_type: "hourly" | "daily" | "weekly" | "monthly"
      post_status: "recruiting" | "completed" | "urgent"
      report_reason:
        | "fraud_investment"
        | "obscene"
        | "child_abuse"
        | "hate_violence"
        | "illegal_product"
        | "privacy_violation"
        | "abnormal_usage"
        | "scam_impersonation"
        | "defamation_copyright"
        | "illegal_filming"
        | "false_advertisement"
        | "spam"
        | "other"
      report_status:
        | "pending"
        | "reviewed"
        | "resolved_ban"
        | "resolved_no_action"
      user_role:
        | "member"
        | "manager"
        | "pending_manager"
        | "rejected_manager"
        | "admin"
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
      company_verify_status: ["pending", "approved", "rejected"],
      gender: ["남성", "여성", "미정"],
      manager_schedule_status: ["upcoming", "ongoing", "completed"],
      member_schedule_status: ["pending", "accepted", "rejected"],
      notification_type: [
        "application_accepted",
        "application_rejected",
        "new_application",
        "schedule_reminder",
        "system",
        "event_briefing",
      ],
      pay_type: ["hourly", "daily", "weekly", "monthly"],
      post_status: ["recruiting", "completed", "urgent"],
      report_reason: [
        "fraud_investment",
        "obscene",
        "child_abuse",
        "hate_violence",
        "illegal_product",
        "privacy_violation",
        "abnormal_usage",
        "scam_impersonation",
        "defamation_copyright",
        "illegal_filming",
        "false_advertisement",
        "spam",
        "other",
      ],
      report_status: [
        "pending",
        "reviewed",
        "resolved_ban",
        "resolved_no_action",
      ],
      user_role: [
        "member",
        "manager",
        "pending_manager",
        "rejected_manager",
        "admin",
      ],
    },
  },
} as const
