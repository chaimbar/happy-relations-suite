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
          id: string
          created_at: string
          updated_at: string
          employee_id: string
          site_id: string
          date: string
          shift_type: Database["public"]["Enums"]["shift_type"]
          cost_estimated: number | null
          notes: string | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          employee_id: string
          site_id: string
          date: string
          shift_type?: Database["public"]["Enums"]["shift_type"]
          cost_estimated?: number | null
          notes?: string | null
          user_id: string
        }
        Update: {
          id?: string
          employee_id?: string
          site_id?: string
          date?: string
          shift_type?: Database["public"]["Enums"]["shift_type"]
          cost_estimated?: number | null
          notes?: string | null
          updated_at?: string
          user_id?: string
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
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          full_name: string
          phone: string | null
          email: string | null
          notes: string | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          full_name: string
          phone?: string | null
          email?: string | null
          notes?: string | null
          user_id: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string | null
          email?: string | null
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          full_name: string
          phone: string | null
          id_number: string | null
          status: Database["public"]["Enums"]["employee_status"]
          daily_cost_estimated: number | null
          timewatch_employee_id: string | null
          notes: string | null
          user_id: string
          job_title: string | null
          employment_type: string
          start_date: string | null
          monthly_cost_actual: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          full_name: string
          phone?: string | null
          id_number?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          daily_cost_estimated?: number | null
          timewatch_employee_id?: string | null
          notes?: string | null
          user_id: string
          job_title?: string | null
          employment_type?: string
          start_date?: string | null
          monthly_cost_actual?: number | null
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string | null
          id_number?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          daily_cost_estimated?: number | null
          timewatch_employee_id?: string | null
          notes?: string | null
          updated_at?: string
          user_id?: string
          job_title?: string | null
          employment_type?: string
          start_date?: string | null
          monthly_cost_actual?: number | null
        }
        Relationships: []
      }
      materials: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          site_id: string
          name: string
          quantity: number | null
          unit: string | null
          unit_price: number | null
          total_price: number
          purchase_date: string | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          site_id: string
          name: string
          quantity?: number | null
          unit?: string | null
          unit_price?: number | null
          total_price: number
          purchase_date?: string | null
          user_id: string
        }
        Update: {
          id?: string
          site_id?: string
          name?: string
          quantity?: number | null
          unit?: string | null
          unit_price?: number | null
          total_price?: number
          purchase_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
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
          id: string
          created_at: string
          updated_at: string
          client_id: string
          site_id: string
          amount: number
          payment_date: string
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          reference: string | null
          notes: string | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          client_id: string
          site_id: string
          amount: number
          payment_date: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          reference?: string | null
          notes?: string | null
          user_id: string
        }
        Update: {
          id?: string
          client_id?: string
          site_id?: string
          amount?: number
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          reference?: string | null
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
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
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          full_name: string | null
          phone: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          phone?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      salary_records: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          employee_id: string
          site_id: string | null
          month: string
          amount_actual: number
          timewatch_sync: boolean | null
          notes: string | null
          user_id: string
          is_paid: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          employee_id: string
          site_id?: string | null
          month: string
          amount_actual: number
          timewatch_sync?: boolean | null
          notes?: string | null
          user_id: string
          is_paid?: boolean
        }
        Update: {
          id?: string
          employee_id?: string
          site_id?: string | null
          month?: string
          amount_actual?: number
          timewatch_sync?: boolean | null
          notes?: string | null
          updated_at?: string
          user_id?: string
          is_paid?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "salary_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      site_stages: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          site_id: string
          name: string
          payment_amount: number | null
          status: Database["public"]["Enums"]["stage_status"]
          completed_at: string | null
          notes: string | null
          sort_order: number | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          site_id: string
          name: string
          payment_amount?: number | null
          status?: Database["public"]["Enums"]["stage_status"]
          completed_at?: string | null
          notes?: string | null
          sort_order?: number | null
          user_id: string
        }
        Update: {
          id?: string
          site_id?: string
          name?: string
          payment_amount?: number | null
          status?: Database["public"]["Enums"]["stage_status"]
          completed_at?: string | null
          notes?: string | null
          sort_order?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
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
          id: string
          created_at: string
          updated_at: string
          name: string
          client_id: string
          address: string | null
          start_date: string | null
          end_date: string | null
          contract_price: number | null
          status: Database["public"]["Enums"]["site_status"]
          materials_cost: number | null
          notes: string | null
          user_id: string
          latitude: number | null
          longitude: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          client_id: string
          address?: string | null
          start_date?: string | null
          end_date?: string | null
          contract_price?: number | null
          status?: Database["public"]["Enums"]["site_status"]
          materials_cost?: number | null
          notes?: string | null
          user_id: string
          latitude?: number | null
          longitude?: number | null
        }
        Update: {
          id?: string
          name?: string
          client_id?: string
          address?: string | null
          start_date?: string | null
          end_date?: string | null
          contract_price?: number | null
          status?: Database["public"]["Enums"]["site_status"]
          materials_cost?: number | null
          notes?: string | null
          updated_at?: string
          user_id?: string
          latitude?: number | null
          longitude?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          created_at: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
          id: string
          full_name: string
          phone: string | null
          email: string | null
          total_invoiced: number
          total_paid: number
          balance_due: number
          total_sites: number
        }
        Relationships: []
      }
      site_profitability: {
        Row: {
          id: string
          name: string
          client_id: string
          contract_price: number | null
          materials_cost: number | null
          status: string
          labor_cost_estimated: number
          labor_cost_actual: number
          profit_estimated: number
          profit_actual: number
          cost_variance: number
        }
        Relationships: []
      }
      today_assignments: {
        Row: {
          id: string
          date: string
          shift_type: string
          cost_estimated: number | null
          employee_name: string
          employee_phone: string | null
          site_name: string
          site_address: string | null
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
      payment_method: ["bank_transfer", "check", "cash", "credit_card", "other"],
      shift_type: ["full", "morning", "afternoon"],
      site_status: ["active", "completed", "paused", "cancelled"],
      stage_status: ["pending", "in_progress", "completed"],
      user_role: ["admin", "manager", "employee"],
    },
  },
} as const
