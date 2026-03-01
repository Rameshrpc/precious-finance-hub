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
      agents: {
        Row: {
          branch_id: string | null
          commission_rate: number
          created_at: string
          id: string
          is_active: boolean
          name: string
          phone: string
          tenant_id: string
        }
        Insert: {
          branch_id?: string | null
          commission_rate?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          phone: string
          tenant_id: string
        }
        Update: {
          branch_id?: string | null
          commission_rate?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      areas: {
        Row: {
          city: string
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          tenant_id: string
        }
        Insert: {
          city?: string
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          tenant_id: string
        }
        Update: {
          city?: string
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "areas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string
          entity_type: string
          id: string
          performed_by: string | null
          performed_by_name: string | null
          tenant_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          performed_by?: string | null
          performed_by_name?: string | null
          tenant_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          performed_by?: string | null
          performed_by_name?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_partners: {
        Row: {
          account_number: string | null
          contact_person: string | null
          created_at: string
          credit_limit: number
          id: string
          ifsc: string | null
          is_active: boolean
          name: string
          phone: string | null
          rate: number
          tenant_id: string
        }
        Insert: {
          account_number?: string | null
          contact_person?: string | null
          created_at?: string
          credit_limit?: number
          id?: string
          ifsc?: string | null
          is_active?: boolean
          name: string
          phone?: string | null
          rate?: number
          tenant_id: string
        }
        Update: {
          account_number?: string | null
          contact_person?: string | null
          created_at?: string
          credit_limit?: number
          id?: string
          ifsc?: string | null
          is_active?: boolean
          name?: string
          phone?: string | null
          rate?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_partners_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          phone: string | null
          tenant_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          tenant_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          aadhaar: string | null
          aadhaar_verified: boolean
          address: string | null
          area: string | null
          branch_id: string | null
          category: string
          city: string | null
          code: string
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          nominee_name: string | null
          nominee_phone: string | null
          nominee_relation: string | null
          pan: string | null
          phone: string
          photo_url: string | null
          pincode: string | null
          status: string
          tenant_id: string
          updated_at: string
          whatsapp_phone: string | null
          whatsapp_same_as_phone: boolean
        }
        Insert: {
          aadhaar?: string | null
          aadhaar_verified?: boolean
          address?: string | null
          area?: string | null
          branch_id?: string | null
          category?: string
          city?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          nominee_name?: string | null
          nominee_phone?: string | null
          nominee_relation?: string | null
          pan?: string | null
          phone: string
          photo_url?: string | null
          pincode?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          whatsapp_phone?: string | null
          whatsapp_same_as_phone?: boolean
        }
        Update: {
          aadhaar?: string | null
          aadhaar_verified?: boolean
          address?: string | null
          area?: string | null
          branch_id?: string | null
          category?: string
          city?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          nominee_name?: string | null
          nominee_phone?: string | null
          nominee_relation?: string | null
          pan?: string | null
          phone?: string
          photo_url?: string | null
          pincode?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          whatsapp_phone?: string | null
          whatsapp_same_as_phone?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "customers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          branch_id: string | null
          created_at: string
          holiday_date: string
          holiday_type: string
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          holiday_date: string
          holiday_type?: string
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          holiday_date?: string
          holiday_type?: string
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "holidays_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holidays_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      interest_records: {
        Row: {
          amount: number
          created_at: string
          days: number
          due_date: string
          id: string
          loan_id: string
          notes: string | null
          paid: number
          payment_date: string | null
          payment_mode: string | null
          penalty: number
          period_end: string
          period_start: string
          principal: number
          rate: number
          receipt_number: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          days?: number
          due_date: string
          id?: string
          loan_id: string
          notes?: string | null
          paid?: number
          payment_date?: string | null
          payment_mode?: string | null
          penalty?: number
          period_end: string
          period_start: string
          principal?: number
          rate?: number
          receipt_number?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          days?: number
          due_date?: string
          id?: string
          loan_id?: string
          notes?: string | null
          paid?: number
          payment_date?: string | null
          payment_mode?: string | null
          penalty?: number
          period_end?: string
          period_start?: string
          principal?: number
          rate?: number
          receipt_number?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interest_records_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interest_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      item_groups: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          metal_type: string
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          metal_type?: string
          name: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          metal_type?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_groups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          item_group_id: string
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          item_group_id: string
          name: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          item_group_id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_item_group_id_fkey"
            columns: ["item_group_id"]
            isOneToOne: false
            referencedRelation: "item_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_applications: {
        Row: {
          amount_requested: number
          application_number: string
          assigned_to: string | null
          branch_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          documents: Json
          estimated_gold_weight: number | null
          id: string
          notes: string | null
          product_type: string
          purpose: string | null
          stage: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount_requested?: number
          application_number: string
          assigned_to?: string | null
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          documents?: Json
          estimated_gold_weight?: number | null
          id?: string
          notes?: string | null
          product_type: string
          purpose?: string | null
          stage?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount_requested?: number
          application_number?: string
          assigned_to?: string | null
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          documents?: Json
          estimated_gold_weight?: number | null
          id?: string
          notes?: string | null
          product_type?: string
          purpose?: string | null
          stage?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_applications_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_applications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_applications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_schemes: {
        Row: {
          allowed_metals: string[]
          charge_label: string
          created_at: string
          gold_ltv_cap: number
          grace_period_days: number
          id: string
          interest_type: string
          is_active: boolean
          name: string
          overdue_rate: number
          product_type: string
          rate: number
          silver_ltv_cap: number
          tenant_id: string
          tenure_months: number
          updated_at: string
        }
        Insert: {
          allowed_metals?: string[]
          charge_label?: string
          created_at?: string
          gold_ltv_cap?: number
          grace_period_days?: number
          id?: string
          interest_type?: string
          is_active?: boolean
          name: string
          overdue_rate?: number
          product_type: string
          rate: number
          silver_ltv_cap?: number
          tenant_id: string
          tenure_months?: number
          updated_at?: string
        }
        Update: {
          allowed_metals?: string[]
          charge_label?: string
          created_at?: string
          gold_ltv_cap?: number
          grace_period_days?: number
          id?: string
          interest_type?: string
          is_active?: boolean
          name?: string
          overdue_rate?: number
          product_type?: string
          rate?: number
          silver_ltv_cap?: number
          tenant_id?: string
          tenure_months?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_schemes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          agent_id: string | null
          amount: number
          branch_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          disbursement_account: string | null
          disbursement_bank_name: string | null
          disbursement_cheque_no: string | null
          disbursement_ifsc: string | null
          disbursement_mode: string
          disbursement_upi_id: string | null
          gold_ltv: number
          gold_value: number
          id: string
          loan_application_id: string | null
          loan_number: string
          maturity_date: string | null
          notes: string | null
          overall_ltv: number
          product_type: string
          purpose: string | null
          rate: number
          scheme_id: string | null
          silver_ltv: number
          silver_value: number
          status: string
          tenant_id: string
          tenure_months: number
          total_pledge_value: number
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          amount?: number
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          disbursement_account?: string | null
          disbursement_bank_name?: string | null
          disbursement_cheque_no?: string | null
          disbursement_ifsc?: string | null
          disbursement_mode?: string
          disbursement_upi_id?: string | null
          gold_ltv?: number
          gold_value?: number
          id?: string
          loan_application_id?: string | null
          loan_number: string
          maturity_date?: string | null
          notes?: string | null
          overall_ltv?: number
          product_type: string
          purpose?: string | null
          rate?: number
          scheme_id?: string | null
          silver_ltv?: number
          silver_value?: number
          status?: string
          tenant_id: string
          tenure_months?: number
          total_pledge_value?: number
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          amount?: number
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          disbursement_account?: string | null
          disbursement_bank_name?: string | null
          disbursement_cheque_no?: string | null
          disbursement_ifsc?: string | null
          disbursement_mode?: string
          disbursement_upi_id?: string | null
          gold_ltv?: number
          gold_value?: number
          id?: string
          loan_application_id?: string | null
          loan_number?: string
          maturity_date?: string | null
          notes?: string | null
          overall_ltv?: number
          product_type?: string
          purpose?: string | null
          rate?: number
          scheme_id?: string | null
          silver_ltv?: number
          silver_value?: number
          status?: string
          tenant_id?: string
          tenure_months?: number
          total_pledge_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_loan_application_id_fkey"
            columns: ["loan_application_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "loan_schemes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      market_rates: {
        Row: {
          created_at: string
          gold_22k: number
          gold_24k: number
          id: string
          rate_date: string
          silver_per_kg: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          gold_22k?: number
          gold_24k?: number
          id?: string
          rate_date?: string
          silver_per_kg?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          gold_22k?: number
          gold_24k?: number
          id?: string
          rate_date?: string
          silver_per_kg?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_rates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pledge_items: {
        Row: {
          created_at: string
          deduction: number
          description: string | null
          gross_weight: number
          id: string
          item_id: string | null
          item_name: string
          loan_id: string
          metal_type: string
          net_weight: number
          photo_url: string | null
          purity_id: string | null
          purity_name: string | null
          purity_percentage: number
          rate_per_gram: number
          tenant_id: string
          value: number
        }
        Insert: {
          created_at?: string
          deduction?: number
          description?: string | null
          gross_weight?: number
          id?: string
          item_id?: string | null
          item_name: string
          loan_id: string
          metal_type?: string
          net_weight?: number
          photo_url?: string | null
          purity_id?: string | null
          purity_name?: string | null
          purity_percentage?: number
          rate_per_gram?: number
          tenant_id: string
          value?: number
        }
        Update: {
          created_at?: string
          deduction?: number
          description?: string | null
          gross_weight?: number
          id?: string
          item_id?: string | null
          item_name?: string
          loan_id?: string
          metal_type?: string
          net_weight?: number
          photo_url?: string | null
          purity_id?: string | null
          purity_name?: string | null
          purity_percentage?: number
          rate_per_gram?: number
          tenant_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "pledge_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pledge_items_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pledge_items_purity_id_fkey"
            columns: ["purity_id"]
            isOneToOne: false
            referencedRelation: "purities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pledge_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          branch_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          tenant_id: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          tenant_id?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      purities: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          metal_type: string
          name: string
          percentage: number
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          metal_type?: string
          name: string
          percentage: number
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          metal_type?: string
          name?: string
          percentage?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          plan: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          plan?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          plan?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
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
      [_ in never]: never
    }
    Functions: {
      generate_application_number: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      generate_customer_code: {
        Args: { p_branch_id: string; p_tenant_id: string }
        Returns: string
      }
      generate_next_number: {
        Args: { p_prefix: string; p_tenant_id: string }
        Returns: string
      }
      get_user_tenant_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "tenant_admin" | "manager" | "staff"
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
      app_role: ["super_admin", "tenant_admin", "manager", "staff"],
    },
  },
} as const
