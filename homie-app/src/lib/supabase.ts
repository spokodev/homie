import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// Get environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Secure storage adapter for Supabase Auth
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key);
  },
};

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Type definitions for database tables
export interface Database {
  public: {
    Tables: {
      households: {
        Row: {
          id: string;
          name: string;
          icon: string;
          created_at: string;
          settings: any;
        };
        Insert: Omit<Database['public']['Tables']['households']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['households']['Insert']>;
      };
      members: {
        Row: {
          id: string;
          household_id: string;
          user_id: string | null;
          name: string;
          avatar: string;
          type: 'human' | 'pet';
          role: 'admin' | 'member';
          points: number;
          level: number;
          streak_days: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['members']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['members']['Insert']>;
      };
      tasks: {
        Row: {
          id: string;
          household_id: string;
          title: string;
          description: string | null;
          room_id: string | null;
          assignee_id: string | null;
          created_by: string;
          points: number;
          status: 'pending' | 'in_progress' | 'completed';
          due_date: string | null;
          estimated_minutes: number | null;
          actual_minutes: number | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>;
      };
      rooms: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          icon: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['rooms']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['rooms']['Insert']>;
      };
      room_notes: {
        Row: {
          id: string;
          room_id: string;
          member_id: string;
          content: string;
          color: string;
          image_url: string | null;
          is_pinned: boolean;
          expires_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['room_notes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['room_notes']['Insert']>;
      };
      cleaning_captains: {
        Row: {
          id: string;
          household_id: string;
          member_id: string;
          week_start: string;
          week_end: string;
          status: 'upcoming' | 'current' | 'completed';
          average_rating: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['cleaning_captains']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['cleaning_captains']['Insert']>;
      };
      captain_ratings: {
        Row: {
          id: string;
          captain_week_id: string;
          rated_by: string;
          stars: number;
          feedback: string | null;
          private_note: string | null;
          positive_tags: string[];
          improvement_tags: string[];
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['captain_ratings']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['captain_ratings']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          household_id: string;
          member_id: string;
          content: string;
          type: 'text' | 'image' | 'system';
          image_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
      badges: {
        Row: {
          id: string;
          name: string;
          description: string;
          icon: string;
          tier: 'free' | 'premium';
          requirements: any;
        };
        Insert: Database['public']['Tables']['badges']['Row'];
        Update: Partial<Database['public']['Tables']['badges']['Insert']>;
      };
      member_badges: {
        Row: {
          id: string;
          member_id: string;
          badge_id: string;
          earned_at: string;
        };
        Insert: Omit<Database['public']['Tables']['member_badges']['Row'], 'id' | 'earned_at'>;
        Update: Partial<Database['public']['Tables']['member_badges']['Insert']>;
      };
    };
  };
}

// Helper functions for common operations
export const auth = {
  signUp: async (email: string, password: string, metadata?: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getSession: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'homie://reset-password',
    });
    return { data, error };
  },
};