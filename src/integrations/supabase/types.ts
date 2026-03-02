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
      api_keys: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          rate_limit: number
          scopes: string[]
          tenant_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          rate_limit?: number
          scopes?: string[]
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          rate_limit?: number
          scopes?: string[]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_requests: {
        Row: {
          amount: number
          created_at: string
          details: Json | null
          entity_id: string
          entity_type: string
          id: string
          request_type: string
          requested_by: string | null
          requested_by_name: string | null
          review_comment: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewed_by_name: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          details?: Json | null
          entity_id: string
          entity_type?: string
          id?: string
          request_type: string
          requested_by?: string | null
          requested_by_name?: string | null
          review_comment?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewed_by_name?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          details?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          request_type?: string
          requested_by?: string | null
          requested_by_name?: string | null
          review_comment?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewed_by_name?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_tenant_id_fkey"
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
      auctions: {
        Row: {
          auction_date: string | null
          buyer_name: string | null
          buyer_phone: string | null
          created_at: string
          created_by: string | null
          id: string
          loan_id: string
          notes: string | null
          notice_sent_at: string | null
          reserve_price: number
          sale_price: number | null
          status: string
          surplus_deficit: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          auction_date?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          loan_id: string
          notes?: string | null
          notice_sent_at?: string | null
          reserve_price?: number
          sale_price?: number | null
          status?: string
          surplus_deficit?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          auction_date?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          loan_id?: string
          notes?: string | null
          notice_sent_at?: string | null
          reserve_price?: number
          sale_price?: number | null
          status?: string
          surplus_deficit?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auctions_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auctions_tenant_id_fkey"
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
      balance_transfers: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string
          documents: Json | null
          from_lender: string
          id: string
          new_loan_id: string | null
          notes: string | null
          original_amount: number
          status: string
          tenant_id: string
          transfer_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id: string
          documents?: Json | null
          from_lender: string
          id?: string
          new_loan_id?: string | null
          notes?: string | null
          original_amount?: number
          status?: string
          tenant_id: string
          transfer_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string
          documents?: Json | null
          from_lender?: string
          id?: string
          new_loan_id?: string | null
          notes?: string | null
          original_amount?: number
          status?: string
          tenant_id?: string
          transfer_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "balance_transfers_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balance_transfers_new_loan_id_fkey"
            columns: ["new_loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balance_transfers_tenant_id_fkey"
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
      cash_register: {
        Row: {
          branch_id: string | null
          closing_balance: number
          created_at: string
          discrepancy: number
          id: string
          notes: string | null
          opening_balance: number
          physical_count: number | null
          register_date: string
          tenant_id: string
          total_inflows: number
          total_outflows: number
          updated_at: string
          verified_by: string | null
        }
        Insert: {
          branch_id?: string | null
          closing_balance?: number
          created_at?: string
          discrepancy?: number
          id?: string
          notes?: string | null
          opening_balance?: number
          physical_count?: number | null
          register_date?: string
          tenant_id: string
          total_inflows?: number
          total_outflows?: number
          updated_at?: string
          verified_by?: string | null
        }
        Update: {
          branch_id?: string | null
          closing_balance?: number
          created_at?: string
          discrepancy?: number
          id?: string
          notes?: string | null
          opening_balance?: number
          physical_count?: number | null
          register_date?: string
          tenant_id?: string
          total_inflows?: number
          total_outflows?: number
          updated_at?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_register_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_register_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_of_accounts: {
        Row: {
          account_type: string
          code: string
          created_at: string
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          parent_id: string | null
          product_type: string | null
          tenant_id: string
        }
        Insert: {
          account_type?: string
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          parent_id?: string | null
          product_type?: string | null
          tenant_id: string
        }
        Update: {
          account_type?: string
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          parent_id?: string | null
          product_type?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_of_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_interactions: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string
          disposition: string | null
          id: string
          interaction_type: string
          loan_id: string
          next_followup: string | null
          notes: string | null
          ptp_amount: number | null
          ptp_date: string | null
          task_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id: string
          disposition?: string | null
          id?: string
          interaction_type?: string
          loan_id: string
          next_followup?: string | null
          notes?: string | null
          ptp_amount?: number | null
          ptp_date?: string | null
          task_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string
          disposition?: string | null
          id?: string
          interaction_type?: string
          loan_id?: string
          next_followup?: string | null
          notes?: string | null
          ptp_amount?: number | null
          ptp_date?: string | null
          task_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_interactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_interactions_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_interactions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "collection_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_interactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          customer_id: string
          disposition: string | null
          dpd: number
          id: string
          loan_id: string
          next_followup: string | null
          notes: string | null
          ptp_amount: number | null
          ptp_date: string | null
          status: string
          task_type: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          customer_id: string
          disposition?: string | null
          dpd?: number
          id?: string
          loan_id: string
          next_followup?: string | null
          notes?: string | null
          ptp_amount?: number | null
          ptp_date?: string | null
          status?: string
          task_type?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          customer_id?: string
          disposition?: string | null
          dpd?: number
          id?: string
          loan_id?: string
          next_followup?: string | null
          notes?: string | null
          ptp_amount?: number | null
          ptp_date?: string | null
          status?: string
          task_type?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_tasks_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_tasks_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_runs: {
        Row: {
          charges_accrued: number
          completed_at: string | null
          error_details: Json | null
          errors: number
          id: string
          loans_updated: number
          overdue_marked: number
          run_type: string
          started_at: string
          status: string
          summary: Json | null
          tenant_id: string
          triggered_by: string | null
        }
        Insert: {
          charges_accrued?: number
          completed_at?: string | null
          error_details?: Json | null
          errors?: number
          id?: string
          loans_updated?: number
          overdue_marked?: number
          run_type?: string
          started_at?: string
          status?: string
          summary?: Json | null
          tenant_id: string
          triggered_by?: string | null
        }
        Update: {
          charges_accrued?: number
          completed_at?: string | null
          error_details?: Json | null
          errors?: number
          id?: string
          loans_updated?: number
          overdue_marked?: number
          run_type?: string
          started_at?: string
          status?: string
          summary?: Json | null
          tenant_id?: string
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cron_runs_tenant_id_fkey"
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
      forfeiture_sales: {
        Row: {
          buyer_name: string | null
          buyer_phone: string | null
          created_at: string
          created_by: string | null
          forfeiture_id: string
          id: string
          loan_id: string
          principal: number
          profit_loss: number
          sale_price: number
          sold_at: string
          tenant_id: string
        }
        Insert: {
          buyer_name?: string | null
          buyer_phone?: string | null
          created_at?: string
          created_by?: string | null
          forfeiture_id: string
          id?: string
          loan_id: string
          principal?: number
          profit_loss?: number
          sale_price?: number
          sold_at?: string
          tenant_id: string
        }
        Update: {
          buyer_name?: string | null
          buyer_phone?: string | null
          created_at?: string
          created_by?: string | null
          forfeiture_id?: string
          id?: string
          loan_id?: string
          principal?: number
          profit_loss?: number
          sale_price?: number
          sold_at?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forfeiture_sales_forfeiture_id_fkey"
            columns: ["forfeiture_id"]
            isOneToOne: false
            referencedRelation: "forfeitures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forfeiture_sales_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forfeiture_sales_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      forfeitures: {
        Row: {
          created_at: string
          created_by: string | null
          forfeiture_date: string | null
          id: string
          loan_id: string
          notes: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          forfeiture_date?: string | null
          id?: string
          loan_id: string
          notes?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          forfeiture_date?: string | null
          id?: string
          loan_id?: string
          notes?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forfeitures_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forfeitures_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      grievances: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          created_by: string | null
          customer_id: string | null
          description: string
          escalation_level: string
          id: string
          priority: string
          resolution_notes: string | null
          resolved_at: string | null
          sla_ack_at: string | null
          sla_resolve_at: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          description: string
          escalation_level?: string
          id?: string
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          sla_ack_at?: string | null
          sla_resolve_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          description?: string
          escalation_level?: string
          id?: string
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          sla_ack_at?: string | null
          sla_resolve_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grievances_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grievances_tenant_id_fkey"
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
          approval_status: string | null
          branch_id: string | null
          buyback_expiry_date: string | null
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
          ltv_ratio: number | null
          maturity_date: string | null
          metal_composition: string | null
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
          total_gold_value: number | null
          total_pledge_value: number
          total_silver_value: number | null
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          amount?: number
          approval_status?: string | null
          branch_id?: string | null
          buyback_expiry_date?: string | null
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
          ltv_ratio?: number | null
          maturity_date?: string | null
          metal_composition?: string | null
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
          total_gold_value?: number | null
          total_pledge_value?: number
          total_silver_value?: number | null
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          amount?: number
          approval_status?: string | null
          branch_id?: string | null
          buyback_expiry_date?: string | null
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
          ltv_ratio?: number | null
          maturity_date?: string | null
          metal_composition?: string | null
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
          total_gold_value?: number | null
          total_pledge_value?: number
          total_silver_value?: number | null
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
      margin_renewals: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          loan_id: string
          margin_amount: number
          new_expiry: string
          new_scheme_id: string | null
          notes: string | null
          old_expiry: string | null
          payment_mode: string
          payment_reference: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          loan_id: string
          margin_amount?: number
          new_expiry: string
          new_scheme_id?: string | null
          notes?: string | null
          old_expiry?: string | null
          payment_mode?: string
          payment_reference?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          loan_id?: string
          margin_amount?: number
          new_expiry?: string
          new_scheme_id?: string | null
          notes?: string | null
          old_expiry?: string | null
          payment_mode?: string
          payment_reference?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "margin_renewals_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "margin_renewals_new_scheme_id_fkey"
            columns: ["new_scheme_id"]
            isOneToOne: false
            referencedRelation: "loan_schemes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "margin_renewals_tenant_id_fkey"
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
      metal_types: {
        Row: {
          code: string
          default_ltv_cap: number | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          rate_unit: string | null
          symbol: string | null
        }
        Insert: {
          code: string
          default_ltv_cap?: number | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          rate_unit?: string | null
          symbol?: string | null
        }
        Update: {
          code?: string
          default_ltv_cap?: number | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          rate_unit?: string | null
          symbol?: string | null
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          channel: string
          created_at: string
          created_by: string | null
          customer_id: string | null
          id: string
          loan_id: string | null
          message: string | null
          sent_at: string | null
          status: string
          template: string | null
          tenant_id: string
        }
        Insert: {
          channel?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          id?: string
          loan_id?: string | null
          message?: string | null
          sent_at?: string | null
          status?: string
          template?: string | null
          tenant_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          id?: string
          loan_id?: string | null
          message?: string | null
          sent_at?: string | null
          status?: string
          template?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_log_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          category: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          tenant_id: string
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          category?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          tenant_id: string
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          category?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          tenant_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      npa_classifications: {
        Row: {
          classification: string
          classified_at: string
          created_at: string
          dpd: number
          id: string
          loan_id: string
          previous_classification: string | null
          provision_amount: number
          provision_rate: number
          tenant_id: string
        }
        Insert: {
          classification?: string
          classified_at?: string
          created_at?: string
          dpd?: number
          id?: string
          loan_id: string
          previous_classification?: string | null
          provision_amount?: number
          provision_rate?: number
          tenant_id: string
        }
        Update: {
          classification?: string
          classified_at?: string
          created_at?: string
          dpd?: number
          id?: string
          loan_id?: string
          previous_classification?: string | null
          provision_amount?: number
          provision_rate?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "npa_classifications_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "npa_classifications_tenant_id_fkey"
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
          is_released: boolean
          item_id: string | null
          item_name: string
          loan_id: string
          metal_type: string
          net_weight: number
          packet_id: string | null
          photo_url: string | null
          purity_id: string | null
          purity_name: string | null
          purity_percentage: number
          rate_at_creation: number | null
          rate_per_gram: number
          released_at: string | null
          tenant_id: string
          value: number
        }
        Insert: {
          created_at?: string
          deduction?: number
          description?: string | null
          gross_weight?: number
          id?: string
          is_released?: boolean
          item_id?: string | null
          item_name: string
          loan_id: string
          metal_type?: string
          net_weight?: number
          packet_id?: string | null
          photo_url?: string | null
          purity_id?: string | null
          purity_name?: string | null
          purity_percentage?: number
          rate_at_creation?: number | null
          rate_per_gram?: number
          released_at?: string | null
          tenant_id: string
          value?: number
        }
        Update: {
          created_at?: string
          deduction?: number
          description?: string | null
          gross_weight?: number
          id?: string
          is_released?: boolean
          item_id?: string | null
          item_name?: string
          loan_id?: string
          metal_type?: string
          net_weight?: number
          packet_id?: string | null
          photo_url?: string | null
          purity_id?: string | null
          purity_name?: string | null
          purity_percentage?: number
          rate_at_creation?: number | null
          rate_per_gram?: number
          released_at?: string | null
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
            foreignKeyName: "pledge_items_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "vault_packets"
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
      re_loans: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          new_loan_id: string
          notes: string | null
          old_loan_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          new_loan_id: string
          notes?: string | null
          old_loan_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          new_loan_id?: string
          notes?: string | null
          old_loan_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "re_loans_new_loan_id_fkey"
            columns: ["new_loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "re_loans_old_loan_id_fkey"
            columns: ["old_loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "re_loans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      redemptions: {
        Row: {
          created_at: string
          created_by: string | null
          discount: number
          id: string
          items_released: Json | null
          loan_id: string
          notes: string | null
          other_charges: number
          partial_release: boolean
          payment_mode: string
          payment_reference: string | null
          penalty: number
          principal: number
          redemption_number: string
          tenant_id: string
          total: number
          unpaid_charges: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          discount?: number
          id?: string
          items_released?: Json | null
          loan_id: string
          notes?: string | null
          other_charges?: number
          partial_release?: boolean
          payment_mode?: string
          payment_reference?: string | null
          penalty?: number
          principal?: number
          redemption_number: string
          tenant_id: string
          total?: number
          unpaid_charges?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          discount?: number
          id?: string
          items_released?: Json | null
          loan_id?: string
          notes?: string | null
          other_charges?: number
          partial_release?: boolean
          payment_mode?: string
          payment_reference?: string | null
          penalty?: number
          principal?: number
          redemption_number?: string
          tenant_id?: string
          total?: number
          unpaid_charges?: number
        }
        Relationships: [
          {
            foreignKeyName: "redemptions_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      repledge_payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_mode: string
          payment_type: string
          reference: string | null
          repledge_id: string
          tenant_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_mode?: string
          payment_type?: string
          reference?: string | null
          repledge_id: string
          tenant_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_mode?: string
          payment_type?: string
          reference?: string | null
          repledge_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "repledge_payments_repledge_id_fkey"
            columns: ["repledge_id"]
            isOneToOne: false
            referencedRelation: "repledges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repledge_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      repledges: {
        Row: {
          amount: number
          bank_name: string
          bank_partner_id: string | null
          created_at: string
          created_by: string | null
          id: string
          maturity_date: string | null
          notes: string | null
          packet_id: string
          rate: number
          start_date: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          bank_name: string
          bank_partner_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          maturity_date?: string | null
          notes?: string | null
          packet_id: string
          rate?: number
          start_date?: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_name?: string
          bank_partner_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          maturity_date?: string | null
          notes?: string | null
          packet_id?: string
          rate?: number
          start_date?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "repledges_bank_partner_id_fkey"
            columns: ["bank_partner_id"]
            isOneToOne: false
            referencedRelation: "bank_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repledges_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "vault_packets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repledges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_reports: {
        Row: {
          created_at: string
          created_by: string | null
          filters: Json | null
          format: string
          frequency: string
          id: string
          is_active: boolean
          last_run_at: string | null
          recipients: string[]
          report_type: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          filters?: Json | null
          format?: string
          frequency?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          recipients?: string[]
          report_type: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          filters?: Json | null
          format?: string
          frequency?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          recipients?: string[]
          report_type?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_reports_tenant_id_fkey"
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
          default_product: string | null
          enable_silver: boolean | null
          enabled_products: string | null
          id: string
          is_active: boolean
          name: string
          plan: string
          settings_json: Json | null
        }
        Insert: {
          created_at?: string
          default_product?: string | null
          enable_silver?: boolean | null
          enabled_products?: string | null
          id?: string
          is_active?: boolean
          name: string
          plan?: string
          settings_json?: Json | null
        }
        Update: {
          created_at?: string
          default_product?: string | null
          enable_silver?: boolean | null
          enabled_products?: string | null
          id?: string
          is_active?: boolean
          name?: string
          plan?: string
          settings_json?: Json | null
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
      vault_packet_loans: {
        Row: {
          created_at: string
          id: string
          loan_id: string
          packet_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          loan_id: string
          packet_id: string
        }
        Update: {
          created_at?: string
          id?: string
          loan_id?: string
          packet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_packet_loans_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_packet_loans_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "vault_packets"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_packets: {
        Row: {
          branch_id: string | null
          created_at: string
          created_by: string | null
          gold_weight: number
          id: string
          loans_count: number
          notes: string | null
          packet_number: string
          silver_weight: number
          slot_id: string | null
          status: string
          tenant_id: string
          total_principal: number
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          gold_weight?: number
          id?: string
          loans_count?: number
          notes?: string | null
          packet_number: string
          silver_weight?: number
          slot_id?: string | null
          status?: string
          tenant_id: string
          total_principal?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          gold_weight?: number
          id?: string
          loans_count?: number
          notes?: string | null
          packet_number?: string
          silver_weight?: number
          slot_id?: string | null
          status?: string
          tenant_id?: string
          total_principal?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_packets_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_packets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_slots: {
        Row: {
          branch_id: string | null
          created_at: string
          id: string
          is_occupied: boolean
          packet_id: string | null
          slot_name: string
          slot_size: string
          tenant_id: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          id?: string
          is_occupied?: boolean
          packet_id?: string | null
          slot_name: string
          slot_size?: string
          tenant_id: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          id?: string
          is_occupied?: boolean
          packet_id?: string | null
          slot_name?: string
          slot_size?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_slots_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_slots_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "vault_packets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_slots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      voucher_lines: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          credit_account: string
          debit_account: string
          entity_id: string | null
          entity_type: string | null
          id: string
          loan_id: string | null
          narration: string | null
          tenant_id: string
          voucher_date: string
          voucher_number: string | null
          voucher_type: string
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by?: string | null
          credit_account: string
          debit_account: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          loan_id?: string | null
          narration?: string | null
          tenant_id: string
          voucher_date?: string
          voucher_number?: string | null
          voucher_type: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          credit_account?: string
          debit_account?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          loan_id?: string | null
          narration?: string | null
          tenant_id?: string
          voucher_date?: string
          voucher_number?: string | null
          voucher_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "voucher_lines_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_lines_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      voucher_series: {
        Row: {
          created_at: string | null
          current_number: number | null
          financial_year: string | null
          id: string
          prefix: string
          product_type: string | null
          tenant_id: string
          type: string
        }
        Insert: {
          created_at?: string | null
          current_number?: number | null
          financial_year?: string | null
          id?: string
          prefix: string
          product_type?: string | null
          tenant_id: string
          type: string
        }
        Update: {
          created_at?: string | null
          current_number?: number | null
          financial_year?: string | null
          id?: string
          prefix?: string
          product_type?: string | null
          tenant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "voucher_series_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          created_at: string | null
          created_by: string | null
          date: string | null
          id: string
          narration: string | null
          product_type: string | null
          reference_id: string | null
          reference_type: string | null
          tenant_id: string
          type: string | null
          voucher_no: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          id?: string
          narration?: string | null
          product_type?: string | null
          reference_id?: string | null
          reference_type?: string | null
          tenant_id: string
          type?: string | null
          voucher_no?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          id?: string
          narration?: string | null
          product_type?: string | null
          reference_id?: string | null
          reference_type?: string | null
          tenant_id?: string
          type?: string | null
          voucher_no?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vouchers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_conversations: {
        Row: {
          assigned_to: string | null
          bot_enabled: boolean
          branch_id: string | null
          created_at: string
          customer_id: string | null
          id: string
          last_message: string | null
          last_message_at: string | null
          name: string | null
          phone: string
          tenant_id: string
          unread_count: number
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          bot_enabled?: boolean
          branch_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          name?: string | null
          phone: string
          tenant_id: string
          unread_count?: number
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          bot_enabled?: boolean
          branch_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          name?: string | null
          phone?: string
          tenant_id?: string
          unread_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wa_conversations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_conversations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_messages: {
        Row: {
          body: string | null
          conversation_id: string
          created_at: string
          direction: string
          id: string
          is_bot: boolean
          media_url: string | null
          message_type: string
          sender: string | null
          status: string
          tenant_id: string
          wa_message_id: string | null
        }
        Insert: {
          body?: string | null
          conversation_id: string
          created_at?: string
          direction?: string
          id?: string
          is_bot?: boolean
          media_url?: string | null
          message_type?: string
          sender?: string | null
          status?: string
          tenant_id: string
          wa_message_id?: string | null
        }
        Update: {
          body?: string | null
          conversation_id?: string
          created_at?: string
          direction?: string
          id?: string
          is_bot?: boolean
          media_url?: string | null
          message_type?: string
          sender?: string | null
          status?: string
          tenant_id?: string
          wa_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wa_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "wa_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_sessions: {
        Row: {
          branch_id: string | null
          created_at: string
          id: string
          phone: string
          qr_code: string | null
          session_name: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          id?: string
          phone: string
          qr_code?: string | null
          session_name: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          id?: string
          phone?: string
          qr_code?: string | null
          session_name?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wa_sessions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_templates: {
        Row: {
          body: string
          category: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          product_type: string | null
          tenant_id: string
          updated_at: string
          variables: string[]
        }
        Insert: {
          body: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          product_type?: string | null
          tenant_id: string
          updated_at?: string
          variables?: string[]
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          product_type?: string | null
          tenant_id?: string
          updated_at?: string
          variables?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "wa_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
      get_enabled_products: { Args: never; Returns: string }
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
      app_role: "super_admin" | "tenant_admin" | "manager" | "staff" | "viewer"
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
      app_role: ["super_admin", "tenant_admin", "manager", "staff", "viewer"],
    },
  },
} as const
