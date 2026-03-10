export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      backup_orders: {
        Row: {
          id: string;
          phone: string | null;
          weight: number | null;
          imageUrl: string | null;
          notes: string | null;
          date: string | null;
          status: string | null;
          image_url: string | null;
          user_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          phone?: string | null;
          weight?: number | null;
          imageUrl?: string | null;
          notes?: string | null;
          date?: string | null;
          status?: string | null;
          image_url?: string | null;
          user_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          phone?: string | null;
          weight?: number | null;
          imageUrl?: string | null;
          notes?: string | null;
          date?: string | null;
          status?: string | null;
          image_url?: string | null;
          user_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      backup_prices: {
        Row: {
          karat: number | null;
          buy: number | null;
          sell: number | null;
          updated_at: string | null;
          created_at: string | null;
          id: string;
        };
        Insert: {
          karat?: number | null;
          buy?: number | null;
          sell?: number | null;
          updated_at?: string | null;
          created_at?: string | null;
          id?: string;
        };
        Update: {
          karat?: number | null;
          buy?: number | null;
          sell?: number | null;
          updated_at?: string | null;
          created_at?: string | null;
          id?: string;
        };
        Relationships: [];
      };
      backup_products: {
        Row: {
          id: string;
          name: string | null;
          category: string | null;
          weight: number | null;
          priceEstimate: number | null;
          imageUrl: string | null;
          description: string | null;
          karat: number | null;
          image_url: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          name?: string | null;
          category?: string | null;
          weight?: number | null;
          priceEstimate?: number | null;
          imageUrl?: string | null;
          description?: string | null;
          karat?: number | null;
          image_url?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string | null;
          category?: string | null;
          weight?: number | null;
          priceEstimate?: number | null;
          imageUrl?: string | null;
          description?: string | null;
          karat?: number | null;
          image_url?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          phone: string;
          weight: number;
          imageUrl: string;
          notes: string | null;
          date: string;
          status: string | null;
          user_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          phone: string;
          weight: number;
          imageUrl: string;
          notes?: string | null;
          date: string;
          status?: string | null;
          user_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          phone?: string;
          weight?: number;
          imageUrl?: string;
          notes?: string | null;
          date?: string;
          status?: string | null;
          user_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      price_history: {
        Row: {
          id: string;
          karat: number;
          source_price_per_oz: number;
          price_per_gram: number;
          buy: number;
          sell: number;
          currency: string;
          source: string | null;
          raw_payload: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          karat: number;
          source_price_per_oz: number;
          price_per_gram: number;
          buy: number;
          sell: number;
          currency?: string;
          source?: string | null;
          raw_payload?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          karat?: number;
          source_price_per_oz?: number;
          price_per_gram?: number;
          buy?: number;
          sell?: number;
          currency?: string;
          source?: string | null;
          raw_payload?: Json | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      prices: {
        Row: {
          karat: number;
          buy: number | null;
          sell: number | null;
          updated_at: string | null;
          created_at: string | null;
        };
        Insert: {
          karat: number;
          buy?: number | null;
          sell?: number | null;
          updated_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          karat?: number;
          buy?: number | null;
          sell?: number | null;
          updated_at?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          category: string;
          weight: number;
          priceEstimate: number;
          imageUrl: string;
          description: string | null;
          karat: number;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          weight: number;
          priceEstimate: number;
          imageUrl: string;
          description?: string | null;
          karat: number;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          weight?: number;
          priceEstimate?: number;
          imageUrl?: string;
          description?: string | null;
          karat?: number;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          role: string | null;
          full_name: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          role?: string | null;
          full_name?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          role?: string | null;
          full_name?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      app_settings: {
        Row: {
          id: number;
          exchange_rate: number | null;
          calc_method: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          exchange_rate?: number | null;
          calc_method?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          exchange_rate?: number | null;
          calc_method?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      design_inspirations: {
        Row: {
          id: string;
          title: string;
          piece_type: string;
          image_url: string;
          storage_path: string;
          sort_order: number | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          piece_type: string;
          image_url: string;
          storage_path: string;
          sort_order?: number | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          piece_type?: string;
          image_url?: string;
          storage_path?: string;
          sort_order?: number | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          key: string;
          value: Json;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          key: string;
          value: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          key?: string;
          value?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_auth_uid: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
      is_admin: {
        Args: { user_uuid: string };
        Returns: boolean | null;
      };
      set_user_role: {
        Args: { target_user_id: string; new_role: string };
        Returns: undefined;
      };
      verify_admin_password: {
        Args: { input_password: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
