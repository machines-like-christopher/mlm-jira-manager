export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      bookings: {
        Row: {
          created_at: string | null
          date: string | null
          hours: number | null
          id: string
          task_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          hours?: number | null
          id?: string
          task_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          hours?: number | null
          id?: string
          task_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      planning_assignments: {
        Row: {
          created_at: string | null
          id: string
          planned_assignee_id: string | null
          task_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          planned_assignee_id?: string | null
          task_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          planned_assignee_id?: string | null
          task_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string | null
          default_view: string | null
          id: string
          jira_credentials: Json | null
          theme_preference: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          default_view?: string | null
          id?: string
          jira_credentials?: Json | null
          theme_preference?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          default_view?: string | null
          id?: string
          jira_credentials?: Json | null
          theme_preference?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
