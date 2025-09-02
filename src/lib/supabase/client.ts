import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for database
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          username: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      trackers: {
        Row: {
          id: string
          user_id: string | null
          name: string
          description: string | null
          prompt: string
          config: any
          schedule: string | null
          sources: any | null
          is_public: boolean | null
          followers_count: number | null
          last_run_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          description?: string | null
          prompt: string
          config?: any
          schedule?: string | null
          sources?: any | null
          is_public?: boolean | null
          followers_count?: number | null
          last_run_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          description?: string | null
          prompt?: string
          config?: any
          schedule?: string | null
          sources?: any | null
          is_public?: boolean | null
          followers_count?: number | null
          last_run_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tracker_runs: {
        Row: {
          id: string
          tracker_id: string | null
          status: string
          error: string | null
          metadata: any | null
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          tracker_id?: string | null
          status: string
          error?: string | null
          metadata?: any | null
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          tracker_id?: string | null
          status?: string
          error?: string | null
          metadata?: any | null
          started_at?: string
          completed_at?: string | null
        }
      }
      tracker_results: {
        Row: {
          id: string
          run_id: string | null
          tracker_id: string | null
          title: string
          description: string | null
          content: string | null
          url: string | null
          images: string[] | null
          videos: string[] | null
          source: string | null
          score: number | null
          metadata: any | null
          created_at: string
        }
        Insert: {
          id?: string
          run_id?: string | null
          tracker_id?: string | null
          title: string
          description?: string | null
          content?: string | null
          url?: string | null
          images?: string[] | null
          videos?: string[] | null
          source?: string | null
          score?: number | null
          metadata?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          run_id?: string | null
          tracker_id?: string | null
          title?: string
          description?: string | null
          content?: string | null
          url?: string | null
          images?: string[] | null
          videos?: string[] | null
          source?: string | null
          score?: number | null
          metadata?: any | null
          created_at?: string
        }
      }
    }
  }
}
