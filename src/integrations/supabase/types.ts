export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assignments: {
        Row: {
          cost_estimated: number | null
          created_at: string
          date: string
          employee_id: string
          id: string
          notes: string | null
          shift_type: Database["public"]["Enums"]["shift_type"]
          site_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cost_estimated?: number | null
          created_at?: string
          date: string
          employee_id: string
          id?: string
          notes?: string | null
          shift_type?: Database["public"]["Enums"]["shift_type"]
          site_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cost_estimated?: number | null
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          notes?: string | null
          shift_type?: Database["public"]["Enums"]["shift_type"]
          site_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          { foreignKeyName: "assignments_employee_id_fkey"; columns: ["employee_id"]; isOneToOne: false; referencedRelation: "employees"; referencedColumns: ["id"] },
          { foreignKeyName: "assignments_site_id_fkey"; columns: ["site_id"]; isOneToOne: false; referencedRelation: "sites"; referencedColumns: ["id"] },
          { foreignKeyName: "assignments_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      check_ins: {
        Row: {
          checked_in_at: string
          employee_id: string
          id: string
          latitude: number | null
          longitude: number | null
          site_id: string | null
          user_id: string | null
        }
        Insert: {
          checked_in_at?: string
          employee_id: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          site_id?: string | null
          user_id?: string | null
        }
        Update: {
          checked_in_at?: string
          employee_id?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          site_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          { foreignKeyName: "clients_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
        ]
      }
      employees: {
        Row: {
          created_at: string
          daily_cost_estimated: number | null
          employment_type: string
          full_name: string
          id: string
          id_number: string | null
          job_title: string | null
          monthly_cost_actual: number | null
          notes: string | null
          phone: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["employee_status"]
          timewatch_employee_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_cost_estimated?: number | null
          employment_type?: string
          full_name: string
          id?: string
          id_number?: string | null
          job_title?: string | null
          monthly_cost_actual?: number | null
          notes?: string | null
          phone?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          timewatch_employee_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_cost_estimated?: number | null
          employment_type?: string
          full_name?: string
          id?: string
          id_number?: string | null
          job_title?: string | null
          monthly_cost_actual?: number | null
          notes?: string | null
          phone?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          timewatch_employee_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          purchase_date: string | null
          quantity: number | null
          site_id: string
          total_price: number
          unit: string | null
          unit_price: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          purchase_date?: string | null
          quantity?: number | null
          site_id: string
          total_price: number
          unit?: string | null
          unit_price?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          purchase_date?: string | null
          quantity?: number | null
          site_id?: string
          total_price?: number
          unit?: string | null
          unit_price?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          { foreignKeyName: "materials_site_id_fkey"; columns: ["site_id"]; isOneToOne: false; referencedRelation: "sites"; referencedColumns: ["id"] },
          { foreignKeyName: "materials_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
        ]
      }
      notification_queue: {
        Row: {
          attempts: number
          body: string
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          last_error: string | null
          recipient_email: string | null
          recipient_phone: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          subject: string | null
        }
        Insert: {
          attempts?: number
          body: string
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          last_error?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          subject?: string | null
        }
        Update: {
          attempts?: number
          body?: string
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          last_error?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          subject?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          id: string
          notes: string | null
          payment_date: string
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          reference: string | null
          site_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_date: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          reference?: string | null
          site_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          reference?: string | null
          site_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          { foreignKeyName: "payments_client_id_fkey"; columns: ["client_id"]; isOneToOne: false; referencedRelation: "clients"; referencedColumns: ["id"] },
          { foreignKeyName: "payments_site_id_fkey"; columns: ["site_id"]; isOneToOne: false; referencedRelation: "sites"; referencedColumns: ["id"] },
          { foreignKeyName: "payments_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          managed_by: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          managed_by?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          managed_by?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "profiles_id_fkey"; columns: ["id"]; isOneToOne: true; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "profiles_managed_by_fkey"; columns: ["managed_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      salary_records: {
        Row: {
          amount_actual: number
          created_at: string
          employee_id: string
          id: string
          is_paid: boolean
          month: string
          notes: string | null
          site_id: string | null
          timewatch_sync: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_actual: number
          created_at?: string
          employee_id: string
          id?: string
          is_paid?: boolean
          month: string
          notes?: string | null
          site_id?: string | null
          timewatch_sync?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_actual?: number
          created_at?: string
          employee_id?: string
          id?: string
          is_paid?: boolean
          month?: string
          notes?: string | null
          site_id?: string | null
          timewatch_sync?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          { foreignKeyName: "salary_records_employee_id_fkey"; columns: ["employee_id"]; isOneToOne: false; referencedRelation: "employees"; referencedColumns: ["id"] },
          { foreignKeyName: "salary_records_site_id_fkey"; columns: ["site_id"]; isOneToOne: false; referencedRelation: "sites"; referencedColumns: ["id"] },
          { foreignKeyName: "salary_records_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
        ]
      }
      site_stages: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          payment_amount: number | null
          site_id: string
          sort_order: number | null
          status: Database["public"]["Enums"]["stage_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          payment_amount?: number | null
          site_id: string
          sort_order?: number | null
          status?: Database["public"]["Enums"]["stage_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          payment_amount?: number | null
          site_id?: string
          sort_order?: number | null
          status?: Database["public"]["Enums"]["stage_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          { foreignKeyName: "site_stages_site_id_fkey"; columns: ["site_id"]; isOneToOne: false; referencedRelation: "sites"; referencedColumns: ["id"] },
          { foreignKeyName: "site_stages_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
        ]
      }
      sites: {
        Row: {
          address: string | null
          client_id: string
          contract_price: number | null
          created_at: string
          end_date: string | null
          id: string
          latitude: number | null
          longitude: number | null
          materials_cost: number | null
          name: string
          notes: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["site_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          client_id: string
          contract_price?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          materials_cost?: number | null
          name: string
          notes?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["site_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          client_id?: string
          contract_price?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          materials_cost?: number | null
          name?: string
          notes?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["site_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          { foreignKeyName: "sites_client_id_fkey"; columns: ["client_id"]; isOneToOne: false; referencedRelation: "clients"; referencedColumns: ["id"] },
          { foreignKeyName: "sites_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          { foreignKeyName: "user_roles_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
        ]
      }
    }
    Views: {
      client_balance: {
        Row: {
          balance_due: number | null
          email: string | null
          full_name: string | null
          id: string | null
          phone: string | null
          total_invoiced: number | null
          total_paid: number | null
          total_sites: number | null
        }
        Relationships: []
      }
      salary_site_allocation: {
        Row: {
          allocated_amount: number | null
          amount_actual: number | null
          days_in_month: number | null
          days_on_site: number | null
          employee_id: string | null
          month: string | null
          salary_record_id: string | null
          site_id: string | null
        }
        Relationships: []
      }
      site_profitability: {
        Row: {
          client_id: string | null
          contract_price: number | null
          cost_variance: number | null
          id: string | null
          labor_cost_actual: number | null
          labor_cost_estimated: number | null
          materials_cost: number | null
          name: string | null
          profit_actual: number | null
          profit_estimated: number | null
          status: Database["public"]["Enums"]["site_status"] | null
        }
        Relationships: []
      }
      today_assignments: {
        Row: {
          cost_estimated: number | null
          date: string | null
          employee_name: string | null
          employee_phone: string | null
          id: string | null
          shift_type: Database["public"]["Enums"]["shift_type"] | null
          site_address: string | null
          site_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "team_manager" | "employee"
      employee_status: "active" | "inactive"
      notification_channel: "email" | "whatsapp" | "both"
      notification_status: "pending" | "sent" | "failed" | "skipped"
      payment_method: "bank_transfer" | "check" | "cash" | "credit_card" | "other"
      shift_type: "full" | "morning" | "afternoon"
      site_status: "active" | "completed" | "paused" | "cancelled"
      stage_status: "pending" | "in_progress" | "completed"
      user_role: "admin" | "manager" | "employee"
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
      app_role: ["admin", "team_manager", "employee"],
      employee_status: ["active", "inactive"],
      notification_channel: ["email", "whatsapp", "both"],
      notification_status: ["pending", "sent", "failed", "skipped"],
      payment_method: ["bank_transfer", "check", "cash", "credit_card", "other"],
      shift_type: ["full", "morning", "afternoon"],
      site_status: ["active", "completed", "paused", "cancelled"],
      stage_status: ["pending", "in_progress", "completed"],
      user_role: ["admin", "manager", "employee"],
    },
  },
} as const
