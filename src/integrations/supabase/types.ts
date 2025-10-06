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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      portfolio: {
        Row: {
          added_at: string | null
          average_price: number
          id: string
          quantity: number
          sector: string | null
          stock_name: string
          stock_symbol: string
          total_invested: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          added_at?: string | null
          average_price: number
          id?: string
          quantity: number
          sector?: string | null
          stock_name: string
          stock_symbol: string
          total_invested: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          added_at?: string | null
          average_price?: number
          id?: string
          quantity?: number
          sector?: string | null
          stock_name?: string
          stock_symbol?: string
          total_invested?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      stock_candles: {
        Row: {
          close: number
          created_at: string | null
          high: number
          id: string
          interval: string
          low: number
          open: number
          stock_id: string | null
          timestamp: string
          volume: number
        }
        Insert: {
          close: number
          created_at?: string | null
          high: number
          id?: string
          interval: string
          low: number
          open: number
          stock_id?: string | null
          timestamp: string
          volume: number
        }
        Update: {
          close?: number
          created_at?: string | null
          high?: number
          id?: string
          interval?: string
          low?: number
          open?: number
          stock_id?: string | null
          timestamp?: string
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_candles_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_news: {
        Row: {
          content: string
          created_at: string | null
          id: string
          published_at: string
          sentiment: string | null
          source: string | null
          stock_id: string | null
          title: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          published_at: string
          sentiment?: string | null
          source?: string | null
          stock_id?: string | null
          title: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          published_at?: string
          sentiment?: string | null
          source?: string | null
          stock_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_news_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_predictions: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          id: string
          prediction_data: Json
          prediction_type: string
          stock_id: string | null
          valid_until: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          prediction_data: Json
          prediction_type: string
          stock_id?: string | null
          valid_until?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          prediction_data?: Json
          prediction_type?: string
          stock_id?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_predictions_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_prices: {
        Row: {
          id: string
          price: number
          stock_id: string
          timestamp: string | null
          volume: number | null
        }
        Insert: {
          id?: string
          price: number
          stock_id: string
          timestamp?: string | null
          volume?: number | null
        }
        Update: {
          id?: string
          price?: number
          stock_id?: string
          timestamp?: string | null
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_prices_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      stocks: {
        Row: {
          change_percent: number | null
          close_price: number | null
          created_at: string | null
          current_price: number | null
          exchange: string
          high_price: number | null
          id: string
          is_nifty_50: boolean | null
          is_sensex_30: boolean | null
          last_updated: string | null
          low_price: number | null
          market_cap: number | null
          market_cap_category: string | null
          name: string
          open_price: number | null
          pe_ratio: number | null
          prev_close: number | null
          sector: string | null
          symbol: string
          volume: number | null
          week_52_high: number | null
          week_52_low: number | null
        }
        Insert: {
          change_percent?: number | null
          close_price?: number | null
          created_at?: string | null
          current_price?: number | null
          exchange: string
          high_price?: number | null
          id?: string
          is_nifty_50?: boolean | null
          is_sensex_30?: boolean | null
          last_updated?: string | null
          low_price?: number | null
          market_cap?: number | null
          market_cap_category?: string | null
          name: string
          open_price?: number | null
          pe_ratio?: number | null
          prev_close?: number | null
          sector?: string | null
          symbol: string
          volume?: number | null
          week_52_high?: number | null
          week_52_low?: number | null
        }
        Update: {
          change_percent?: number | null
          close_price?: number | null
          created_at?: string | null
          current_price?: number | null
          exchange?: string
          high_price?: number | null
          id?: string
          is_nifty_50?: boolean | null
          is_sensex_30?: boolean | null
          last_updated?: string | null
          low_price?: number | null
          market_cap?: number | null
          market_cap_category?: string | null
          name?: string
          open_price?: number | null
          pe_ratio?: number | null
          prev_close?: number | null
          sector?: string | null
          symbol?: string
          volume?: number | null
          week_52_high?: number | null
          week_52_low?: number | null
        }
        Relationships: []
      }
      watchlists: {
        Row: {
          added_at: string | null
          id: string
          stock_id: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          id?: string
          stock_id: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          id?: string
          stock_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlists_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watchlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
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
    Enums: {},
  },
} as const
