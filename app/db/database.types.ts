export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      colorings: {
        Row: {
          age_group: string
          created_at: string
          favorites_count: number
          id: string
          image_url: string
          prompt: string
          style: string
          tags: string[]
          user_id: string
        }
        Insert: {
          age_group: string
          created_at?: string
          favorites_count?: number
          id?: string
          image_url: string
          prompt: string
          style: string
          tags?: string[]
          user_id: string
        }
        Update: {
          age_group?: string
          created_at?: string
          favorites_count?: number
          id?: string
          image_url?: string
          prompt?: string
          style?: string
          tags?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "colorings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          coloring_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          coloring_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          coloring_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_coloring_id_fkey"
            columns: ["coloring_id"]
            isOneToOne: false
            referencedRelation: "colorings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_coloring_id_fkey"
            columns: ["coloring_id"]
            isOneToOne: false
            referencedRelation: "public_gallery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_coloring_id_fkey"
            columns: ["coloring_id"]
            isOneToOne: false
            referencedRelation: "user_library_view"
            referencedColumns: ["coloring_id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          generations_today: number
          id: string
          last_generation_date: string | null
        }
        Insert: {
          created_at?: string
          email: string
          generations_today?: number
          id: string
          last_generation_date?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          generations_today?: number
          id?: string
          last_generation_date?: string | null
        }
        Relationships: []
      }
      user_library: {
        Row: {
          added_at: string
          coloring_id: string
          is_favorite: boolean
          user_id: string
        }
        Insert: {
          added_at?: string
          coloring_id: string
          is_favorite?: boolean
          user_id: string
        }
        Update: {
          added_at?: string
          coloring_id?: string
          is_favorite?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_library_coloring_id_fkey"
            columns: ["coloring_id"]
            isOneToOne: false
            referencedRelation: "colorings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_library_coloring_id_fkey"
            columns: ["coloring_id"]
            isOneToOne: false
            referencedRelation: "public_gallery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_library_coloring_id_fkey"
            columns: ["coloring_id"]
            isOneToOne: false
            referencedRelation: "user_library_view"
            referencedColumns: ["coloring_id"]
          },
          {
            foreignKeyName: "user_library_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_gallery: {
        Row: {
          age_group: string | null
          created_at: string | null
          favorites_count: number | null
          id: string | null
          image_url: string | null
          prompt: string | null
          style: string | null
          tags: string[] | null
        }
        Insert: {
          age_group?: string | null
          created_at?: string | null
          favorites_count?: number | null
          id?: string | null
          image_url?: string | null
          prompt?: string | null
          style?: string | null
          tags?: string[] | null
        }
        Update: {
          age_group?: string | null
          created_at?: string | null
          favorites_count?: number | null
          id?: string | null
          image_url?: string | null
          prompt?: string | null
          style?: string | null
          tags?: string[] | null
        }
        Relationships: []
      }
      user_library_view: {
        Row: {
          added_at: string | null
          age_group: string | null
          coloring_id: string | null
          created_at: string | null
          favorites_count: number | null
          image_url: string | null
          is_global_favorite: boolean | null
          library_favorite: boolean | null
          prompt: string | null
          style: string | null
          tags: string[] | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_library_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_and_update_daily_limit: {
        Args: { p_count?: number; p_user_id: string }
        Returns: boolean
      }
      get_remaining_generations: {
        Args: { p_user_id: string }
        Returns: number
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

