export type Database = {
  public: {
    Tables: {
      user_settings: {
        Row: {
          id: string
          user_id: string
          theme: 'light' | 'dark' | 'grey'
          timezone: string
          date_format: string
          time_format: '12h' | '24h'
          email_reminders_enabled: boolean
          email_frequency: 'daily' | 'weekly' | 'never'
          email_time: string
          email_day_of_week: number
          show_images_inline: boolean
          auto_save_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: 'light' | 'dark' | 'grey'
          timezone?: string
          date_format?: string
          time_format?: '12h' | '24h'
          email_reminders_enabled?: boolean
          email_frequency?: 'daily' | 'weekly' | 'never'
          email_time?: string
          email_day_of_week?: number
          show_images_inline?: boolean
          auto_save_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: 'light' | 'dark' | 'grey'
          timezone?: string
          date_format?: string
          time_format?: '12h' | '24h'
          email_reminders_enabled?: boolean
          email_frequency?: 'daily' | 'weekly' | 'never'
          email_time?: string
          email_day_of_week?: number
          show_images_inline?: boolean
          auto_save_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      entries: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          mood: string | null
          weather: string | null
          location: string | null
          word_count: number
          reading_time: number
          template_id: string | null
          created_at: string
          last_edited_at: string
          entry_date: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          mood?: string | null
          weather?: string | null
          location?: string | null
          word_count?: number
          reading_time?: number
          template_id?: string | null
          created_at?: string
          last_edited_at?: string
          entry_date?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          mood?: string | null
          weather?: string | null
          location?: string | null
          word_count?: number
          reading_time?: number
          template_id?: string | null
          created_at?: string
          last_edited_at?: string
          entry_date?: string
        }
      }
      entry_templates: {
        Row: {
          id: string
          user_id: string | null
          name: string
          description: string | null
          content_template: string
          icon: string | null
          is_system_template: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          description?: string | null
          content_template: string
          icon?: string | null
          is_system_template?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          description?: string | null
          content_template?: string
          icon?: string | null
          is_system_template?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      images: {
        Row: {
          id: string
          entry_id: string
          user_id: string
          storage_path: string
          file_name: string
          file_size_bytes: number
          mime_type: string
          compressed: boolean
          width: number | null
          height: number | null
          alt_text: string | null
          caption: string | null
          display_order: number
          uploaded_at: string
        }
        Insert: {
          id?: string
          entry_id: string
          user_id: string
          storage_path: string
          file_name: string
          file_size_bytes: number
          mime_type: string
          compressed?: boolean
          width?: number | null
          height?: number | null
          alt_text?: string | null
          caption?: string | null
          display_order?: number
          uploaded_at?: string
        }
        Update: {
          id?: string
          entry_id?: string
          user_id?: string
          storage_path?: string
          file_name?: string
          file_size_bytes?: number
          mime_type?: string
          compressed?: boolean
          width?: number | null
          height?: number | null
          alt_text?: string | null
          caption?: string | null
          display_order?: number
          uploaded_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          created_at?: string
        }
      }
      entry_tags: {
        Row: {
          entry_id: string
          tag_id: string
        }
        Insert: {
          entry_id: string
          tag_id: string
        }
        Update: {
          entry_id?: string
          tag_id?: string
        }
      }
      streaks: {
        Row: {
          id: string
          user_id: string
          current_streak: number
          longest_streak: number
          total_entries: number
          last_entry_date: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          current_streak?: number
          longest_streak?: number
          total_entries?: number
          last_entry_date?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          current_streak?: number
          longest_streak?: number
          total_entries?: number
          last_entry_date?: string | null
          updated_at?: string
        }
      }
      email_queue: {
        Row: {
          id: string
          user_id: string
          email_type: 'daily_reminder' | 'weekly_summary'
          scheduled_for: string
          sent_at: string | null
          status: 'pending' | 'sent' | 'failed'
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_type: 'daily_reminder' | 'weekly_summary'
          scheduled_for: string
          sent_at?: string | null
          status?: 'pending' | 'sent' | 'failed'
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_type?: 'daily_reminder' | 'weekly_summary'
          scheduled_for?: string
          sent_at?: string | null
          status?: 'pending' | 'sent' | 'failed'
          error_message?: string | null
          created_at?: string
        }
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
  }
}
