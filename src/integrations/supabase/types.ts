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
      destination_places: {
        Row: {
          created_at: string
          destination_id: string
          id: string
          latitude: number
          longitude: number
          name: string
          note: string | null
          stop_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          destination_id: string
          id?: string
          latitude: number
          longitude: number
          name: string
          note?: string | null
          stop_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          destination_id?: string
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          note?: string | null
          stop_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "destination_places_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      destinations: {
        Row: {
          category: string
          created_at: string
          description_en: string | null
          description_hi: string | null
          description_te: string | null
          id: string
          is_active: boolean
          latitude: number | null
          location_en: string
          location_hi: string | null
          location_te: string | null
          longitude: number | null
          name_en: string
          name_hi: string | null
          name_te: string | null
          slug: string
          sort_order: number
          tags: string[]
          trending: boolean
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description_en?: string | null
          description_hi?: string | null
          description_te?: string | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          location_en: string
          location_hi?: string | null
          location_te?: string | null
          longitude?: number | null
          name_en: string
          name_hi?: string | null
          name_te?: string | null
          slug: string
          sort_order?: number
          tags?: string[]
          trending?: boolean
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description_en?: string | null
          description_hi?: string | null
          description_te?: string | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          location_en?: string
          location_hi?: string | null
          location_te?: string | null
          longitude?: number | null
          name_en?: string
          name_hi?: string | null
          name_te?: string | null
          slug?: string
          sort_order?: number
          tags?: string[]
          trending?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      experiences: {
        Row: {
          category: string
          created_at: string
          description_en: string | null
          description_hi: string | null
          description_te: string | null
          difficulty_en: string | null
          difficulty_hi: string | null
          difficulty_te: string | null
          duration_en: string | null
          duration_hi: string | null
          duration_te: string | null
          gradient: string
          icon: string
          id: string
          is_active: boolean
          slug: string
          sort_order: number
          title_en: string
          title_hi: string | null
          title_te: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description_en?: string | null
          description_hi?: string | null
          description_te?: string | null
          difficulty_en?: string | null
          difficulty_hi?: string | null
          difficulty_te?: string | null
          duration_en?: string | null
          duration_hi?: string | null
          duration_te?: string | null
          gradient?: string
          icon?: string
          id?: string
          is_active?: boolean
          slug: string
          sort_order?: number
          title_en: string
          title_hi?: string | null
          title_te?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description_en?: string | null
          description_hi?: string | null
          description_te?: string | null
          difficulty_en?: string | null
          difficulty_hi?: string | null
          difficulty_te?: string | null
          duration_en?: string | null
          duration_hi?: string | null
          duration_te?: string | null
          gradient?: string
          icon?: string
          id?: string
          is_active?: boolean
          slug?: string
          sort_order?: number
          title_en?: string
          title_hi?: string | null
          title_te?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value_en: string
          value_hi: string | null
          value_te: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value_en: string
          value_hi?: string | null
          value_te?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value_en?: string
          value_hi?: string | null
          value_te?: string | null
        }
        Relationships: []
      }
      trips: {
        Row: {
          budget: string
          created_at: string
          destination: string
          end_date: string
          id: string
          interests: string[] | null
          special_requests: string | null
          start_date: string
          travelers: number
          user_id: string
        }
        Insert: {
          budget: string
          created_at?: string
          destination: string
          end_date: string
          id?: string
          interests?: string[] | null
          special_requests?: string | null
          start_date: string
          travelers?: number
          user_id: string
        }
        Update: {
          budget?: string
          created_at?: string
          destination?: string
          end_date?: string
          id?: string
          interests?: string[] | null
          special_requests?: string | null
          start_date?: string
          travelers?: number
          user_id?: string
        }
        Relationships: []
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
