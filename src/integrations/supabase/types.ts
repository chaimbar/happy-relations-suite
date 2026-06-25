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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assignments: {
        Row: {
          cost_estimated: number | null
          created_at: string
          created_by: string | null
          date: string
          employee_id: string
          id: string
          notes: string | null
          shift_type: string
          site_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cost_estimated?: number | null
          created_at?: string
          created_by?: string | null
          date: string
          employee_id: string
          id?: string
          notes?: string | null
          shift_type?: string
          site_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cost_estimated?: number | null
          created_at?: string
          created_by?: string | null
          date?: string
          employee_id?: string
          id?: string
          notes?: string | null
          shift_type?: string
          site_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "site_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          metadata: Json | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      check_ins: {
        Row: {
          checked_in_at: string
          created_at: string
          employee_id: string
          id: string
          latitude: number | null
          longitude: number | null
          site_id: string | null
        }
        Insert: {
          checked_in_at?: string
          created_at?: string
          employee_id: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          site_id?: string | null
        }
        Update: {
          checked_in_at?: string
          created_at?: string
          employee_id?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          site_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "site_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string
          created_by: string | null
          daily_cost_estimated: number
          employment_type: string | null
          full_name: string
          id: string
          id_number: string | null
          job_title: string | null
          managed_by: string | null
          monthly_cost_actual: number | null
          notes: string | null
          phone: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["employee_status"]
          timewatch_employee_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          daily_cost_estimated?: number
          employment_type?: string | null
          full_name: string
          id?: string
          id_number?: string | null
          job_title?: string | null
          managed_by?: string | null
          monthly_cost_actual?: number | null
          notes?: string | null
          phone?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          timewatch_employee_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          daily_cost_estimated?: number
          employment_type?: string | null
          full_name?: string
          id?: string
          id_number?: string | null
          job_title?: string | null
          managed_by?: string | null
          monthly_cost_actual?: number | null
          notes?: string | null
          phone?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          timewatch_employee_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      materials: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          quantity: number
          site_id: string
          total_price: number
          unit_price: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          quantity?: number
          site_id: string
          total_price?: number
          unit_price?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          quantity?: number
          site_id?: string
          total_price?: number
          unit_price?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "site_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          reference: string | null
          site_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number
          client_id: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          reference?: string | null
          site_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          reference?: string | null
          site_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_balance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "site_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_scenarios: {
        Row: {
          applied_buffer_pct: number
          client_id: string | null
          created_at: string
          desired_margin_pct: number
          estimated_labor_cost: number
          estimated_materials_cost: number
          id: string
          input_mode: string
          inputs: Json | null
          name: string
          suggested_price: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          applied_buffer_pct?: number
          client_id?: string | null
          created_at?: string
          desired_margin_pct?: number
          estimated_labor_cost?: number
          estimated_materials_cost?: number
          id?: string
          input_mode: string
          inputs?: Json | null
          name: string
          suggested_price?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          applied_buffer_pct?: number
          client_id?: string | null
          created_at?: string
          desired_margin_pct?: number
          estimated_labor_cost?: number
          estimated_materials_cost?: number
          id?: string
          input_mode?: string
          inputs?: Json | null
          name?: string
          suggested_price?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_scenarios_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_balance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_scenarios_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
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
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_actual?: number
          created_at?: string
          employee_id: string
          id?: string
          is_paid?: boolean
          month: string
          notes?: string | null
          site_id?: string | null
          updated_at?: string
          user_id?: string | null
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
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salary_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_records_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "site_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_records_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_stages: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          notes: string | null
          payment_amount: number | null
          site_id: string
          sort_order: number | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          notes?: string | null
          payment_amount?: number | null
          site_id: string
          sort_order?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          notes?: string | null
          payment_amount?: number | null
          site_id?: string
          sort_order?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_stages_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "site_profitability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_stages_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          address: string | null
          client_id: string
          contract_price: number
          created_at: string
          created_by: string | null
          end_date: string | null
          has_drywall: boolean
          id: string
          materials_cost: number
          name: string
          notes: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["site_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          client_id: string
          contract_price?: number
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          has_drywall?: boolean
          id?: string
          materials_cost?: number
          name: string
          notes?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["site_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          client_id?: string
          contract_price?: number
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          has_drywall?: boolean
          id?: string
          materials_cost?: number
          name?: string
          notes?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["site_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_balance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
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
        Relationships: []
      }
    }
    Views: {
      client_balance: {
        Row: {
          balance_due: number | null
          full_name: string | null
          id: string | null
          total_invoiced: number | null
          total_paid: number | null
          total_sites: number | null
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
          status: string | null
        }
        Insert: {
          client_id?: string | null
          contract_price?: number | null
          cost_variance?: never
          id?: string | null
          labor_cost_actual?: never
          labor_cost_estimated?: never
          materials_cost?: number | null
          name?: string | null
          profit_actual?: never
          profit_estimated?: never
          status?: never
        }
        Update: {
          client_id?: string | null
          contract_price?: number | null
          cost_variance?: never
          id?: string | null
          labor_cost_actual?: never
          labor_cost_estimated?: never
          materials_cost?: number | null
          name?: string | null
          profit_actual?: never
          profit_estimated?: never
          status?: never
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_balance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_all_users_for_admin: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }[]
      }
      get_employee_checkin_info: {
        Args: { emp_id: string }
        Returns: {
          employee_name: string
          employee_status: string
          site_id: string
          site_name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      submit_checkin: {
        Args: { emp_id: string; lat: number; long: number }
        Returns: {
          checked_in_at: string
          employee_name: string
          site_name: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "team_manager" | "employee"
      employee_status: "active" | "inactive"
      site_status: "active" | "completed" | "on_hold" | "paused" | "cancelled"
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
      site_status: ["active", "completed", "on_hold", "paused", "cancelled"],
    },
  },
} as const
