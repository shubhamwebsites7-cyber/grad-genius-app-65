export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password_hash: string | null
          full_name: string
          avatar_url: string | null
          country_code: string
          timezone: string
          is_email_verified: boolean
          auth_provider: string
          auth_provider_id: string | null
          created_at: string
          updated_at: string
          last_login_at: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          email: string
          password_hash?: string | null
          full_name: string
          avatar_url?: string | null
          country_code?: string
          timezone?: string
          is_email_verified?: boolean
          auth_provider?: string
          auth_provider_id?: string | null
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string | null
          full_name?: string
          avatar_url?: string | null
          country_code?: string
          timezone?: string
          is_email_verified?: boolean
          auth_provider?: string
          auth_provider_id?: string | null
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
          is_active?: boolean
        }
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          description: string | null
          duration_months: number
          features: Json | null
          is_popular: boolean
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          duration_months: number
          features?: Json | null
          is_popular?: boolean
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          duration_months?: number
          features?: Json | null
          is_popular?: boolean
          is_active?: boolean
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          amount: number
          currency: string
          payment_method: string | null
          payment_status: string
          external_payment_id: string | null
          phone_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          amount: number
          currency: string
          payment_method?: string | null
          payment_status?: string
          external_payment_id?: string | null
          phone_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          amount?: number
          currency?: string
          payment_method?: string | null
          payment_status?: string
          external_payment_id?: string | null
          phone_number?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          status: string
          starts_at: string
          expires_at: string
          auto_renew: boolean
          payment_method: string | null
          external_subscription_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          status?: string
          starts_at: string
          expires_at: string
          auto_renew?: boolean
          payment_method?: string | null
          external_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          status?: string
          starts_at?: string
          expires_at?: string
          auto_renew?: boolean
          payment_method?: string | null
          external_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: 'admin' | 'moderator' | 'user'
        }
        Insert: {
          id?: string
          user_id: string
          role: 'admin' | 'moderator' | 'user'
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'admin' | 'moderator' | 'user'
        }
      }
      exam_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          color: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon?: string | null
          color?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string | null
          color?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      exams: {
        Row: {
          id: string
          name: string
          full_name: string | null
          category_id: string | null
          description: string | null
          exam_type: string
          total_marks: number | null
          duration_minutes: number | null
          passing_marks: number | null
          difficulty_level: string
          is_active: boolean
          enrollment_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          full_name?: string | null
          category_id?: string | null
          description?: string | null
          exam_type: string
          total_marks?: number | null
          duration_minutes?: number | null
          passing_marks?: number | null
          difficulty_level?: string
          is_active?: boolean
          enrollment_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          full_name?: string | null
          category_id?: string | null
          description?: string | null
          exam_type?: string
          total_marks?: number | null
          duration_minutes?: number | null
          passing_marks?: number | null
          difficulty_level?: string
          is_active?: boolean
          enrollment_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      exam_subjects: {
        Row: {
          id: string
          exam_id: string
          subject_id: string
          marks: number | null
          display_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          subject_id: string
          marks?: number | null
          display_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          exam_id?: string
          subject_id?: string
          marks?: number | null
          display_order?: number
          is_active?: boolean
          created_at?: string
        }
      }
      exam_topics: {
        Row: {
          id: string
          exam_id: string
          subject_id: string
          topic_id: string
          marks: number | null
          display_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          subject_id: string
          topic_id: string
          marks?: number | null
          display_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          exam_id?: string
          subject_id?: string
          topic_id?: string
          marks?: number | null
          display_order?: number
          is_active?: boolean
          created_at?: string
        }
      }
      subjects: {
        Row: {
          id: string
          exam_id: string
          name: string
          description: string | null
          total_marks: number | null
          weightage: number | null
          display_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          exam_id: string
          name: string
          description?: string | null
          total_marks?: number | null
          weightage?: number | null
          display_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          exam_id?: string
          name?: string
          description?: string | null
          total_marks?: number | null
          weightage?: number | null
          display_order?: number
          is_active?: boolean
          created_at?: string
        }
      }
      topics: {
        Row: {
          id: string
          subject_id: string
          name: string
          description: string | null
          marks: number | null
          difficulty: string
          estimated_time_minutes: number | null
          display_order: number
          prerequisites: string[] | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          subject_id: string
          name: string
          description?: string | null
          marks?: number | null
          difficulty?: string
          estimated_time_minutes?: number | null
          display_order?: number
          prerequisites?: string[] | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          subject_id?: string
          name?: string
          description?: string | null
          marks?: number | null
          difficulty?: string
          estimated_time_minutes?: number | null
          display_order?: number
          prerequisites?: string[] | null
          is_active?: boolean
          created_at?: string
        }
      }
      topic_resources: {
        Row: {
          id: string
          topic_id: string
          title: string
          description: string | null
          resource_type: string
          url: string
          thumbnail_url: string | null
          duration_minutes: number | null
          file_size_mb: number | null
          is_premium: boolean
          is_user_contributed: boolean
          contributed_by_user_id: string | null
          admin_approved: boolean
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          topic_id: string
          title: string
          description?: string | null
          resource_type: string
          url: string
          thumbnail_url?: string | null
          duration_minutes?: number | null
          file_size_mb?: number | null
          is_premium?: boolean
          is_user_contributed?: boolean
          contributed_by_user_id?: string | null
          admin_approved?: boolean
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          topic_id?: string
          title?: string
          description?: string | null
          resource_type?: string
          url?: string
          thumbnail_url?: string | null
          duration_minutes?: number | null
          file_size_mb?: number | null
          is_premium?: boolean
          is_user_contributed?: boolean
          contributed_by_user_id?: string | null
          admin_approved?: boolean
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
      }
      user_exam_progress: {
        Row: {
          id: string
          user_id: string
          exam_id: string
          completed_topics: number
          total_topics: number
          progress_percentage: number
          total_time_spent_minutes: number
          last_accessed_at: string | null
          created_at: string
          updated_at: string
          completed_topics_ids: string[]
        }
        Insert: {
          id?: string
          user_id: string
          exam_id: string
          completed_topics?: number
          total_topics?: number
          progress_percentage?: number
          total_time_spent_minutes?: number
          last_accessed_at?: string | null
          created_at?: string
          updated_at?: string
          completed_topics_ids?: string[]
        }
        Update: {
          id?: string
          user_id?: string
          exam_id?: string
          completed_topics?: number
          total_topics?: number
          progress_percentage?: number
          total_time_spent_minutes?: number
          last_accessed_at?: string | null
          created_at?: string
          updated_at?: string
          completed_topics_ids?: string[]
        }
      }
      user_exam_enrollments: {
        Row: {
          id: string
          user_id: string
          exam_id: string
          enrolled_at: string
          target_exam_date: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          exam_id: string
          enrolled_at?: string
          target_exam_date?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          exam_id?: string
          enrolled_at?: string
          target_exam_date?: string | null
          is_active?: boolean
        }
      }
      plan_pricing: {
        Row: {
          id: string
          plan_id: string
          country_code: string
          currency: string
          price: number
          original_price: number | null
          discount_percentage: number | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          plan_id: string
          country_code: string
          currency: string
          price: number
          original_price?: number | null
          discount_percentage?: number | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          plan_id?: string
          country_code?: string
          currency?: string
          price?: number
          original_price?: number | null
          discount_percentage?: number | null
          is_active?: boolean
          created_at?: string
        }
      }
      app_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json
          description: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: Json
          description?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          description?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      resource_ratings: {
        Row: {
          id: string
          resource_id: string
          user_id: string
          rating: number
          review_text: string | null
          is_helpful_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          resource_id: string
          user_id: string
          rating: number
          review_text?: string | null
          is_helpful_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          resource_id?: string
          user_id?: string
          rating?: number
          review_text?: string | null
          is_helpful_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_resource_bookmarks: {
        Row: {
          id: string
          user_id: string
          resource_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          resource_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          resource_id?: string
          created_at?: string
        }
      }
      user_feedback: {
        Row: {
          id: string
          user_id: string
          helpfulness: string
          ease_of_use: string
          design_speed: string
          recommendation: string
          pricing_preference: string
          improvement_suggestion: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          helpfulness: string
          ease_of_use: string
          design_speed: string
          recommendation: string
          pricing_preference: string
          improvement_suggestion?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          helpfulness?: string
          ease_of_use?: string
          design_speed?: string
          recommendation?: string
          pricing_preference?: string
          improvement_suggestion?: string | null
          created_at?: string
        }
      }
      exam_requests: {
        Row: {
          id: string
          user_id: string
          exam_name: string
          exam_type: string
          reason: string | null
          status: string
          admin_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exam_name: string
          exam_type: string
          reason?: string | null
          status?: string
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          exam_name?: string
          exam_type?: string
          reason?: string | null
          status?: string
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      topic_difficulty_ratings: {
        Row: {
          id: string
          topic_id: string
          user_id: string
          difficulty_rating: 'Easy' | 'Medium' | 'Hard'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          topic_id: string
          user_id: string
          difficulty_rating: 'Easy' | 'Medium' | 'Hard'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          topic_id?: string
          user_id?: string
          difficulty_rating?: 'Easy' | 'Medium' | 'Hard'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      has_role: {
        Args: { _user_id: string; _role: 'admin' | 'moderator' | 'user' }
        Returns: boolean
      }
      get_topic_calculated_difficulty: {
        Args: { p_topic_id: string }
        Returns: string
      }
    }
  }
}
