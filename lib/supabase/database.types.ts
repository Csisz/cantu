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
      learning_progress: {
        Row: {
          created_at: string
          last_opened_at: string
          percent_complete: number
          recall_score: number | null
          session_id: string
          stage: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          last_opened_at?: string
          percent_complete?: number
          recall_score?: number | null
          session_id: string
          stage?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          last_opened_at?: string
          percent_complete?: number
          recall_score?: number | null
          session_id?: string
          stage?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_progress_session_owner_fkey"
            columns: ["session_id", "user_id"]
            isOneToOne: false
            referencedRelation: "learning_sessions"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      learning_results: {
        Row: {
          created_at: string
          generator_version: string | null
          id: string
          result_json: Json
          schema_version: string
          session_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          generator_version?: string | null
          id?: string
          result_json: Json
          schema_version: string
          session_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          generator_version?: string | null
          id?: string
          result_json?: Json
          schema_version?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "learning_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_sessions: {
        Row: {
          content_kind: string | null
          created_at: string
          explanation_language: string
          id: string
          input_type: string
          save_source: boolean
          source_char_count: number | null
          source_deleted_at: string | null
          source_duration_ms: number | null
          source_fingerprint: string | null
          source_language: string
          source_retention_status: string
          source_status: string
          updated_at: string
          user_id: string
          verified_source_text: string | null
        }
        Insert: {
          content_kind?: string | null
          created_at?: string
          explanation_language?: string
          id?: string
          input_type: string
          save_source?: boolean
          source_char_count?: number | null
          source_deleted_at?: string | null
          source_duration_ms?: number | null
          source_fingerprint?: string | null
          source_language?: string
          source_retention_status?: string
          source_status?: string
          updated_at?: string
          user_id: string
          verified_source_text?: string | null
        }
        Update: {
          content_kind?: string | null
          created_at?: string
          explanation_language?: string
          id?: string
          input_type?: string
          save_source?: boolean
          source_char_count?: number | null
          source_deleted_at?: string | null
          source_duration_ms?: number | null
          source_fingerprint?: string | null
          source_language?: string
          source_retention_status?: string
          source_status?: string
          updated_at?: string
          user_id?: string
          verified_source_text?: string | null
        }
        Relationships: []
      }
      lessons: {
        Row: {
          created_at: string
          explanation_language: string
          generator_version: string
          id: string
          lesson_json: Json
          lyrics_hash: string | null
          schema_version: string
          song_id: string
          source_language: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          explanation_language?: string
          generator_version: string
          id?: string
          lesson_json?: Json
          lyrics_hash?: string | null
          schema_version: string
          song_id: string
          source_language?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          explanation_language?: string
          generator_version?: string
          id?: string
          lesson_json?: Json
          lyrics_hash?: string | null
          schema_version?: string
          song_id?: string
          source_language?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      lyrics_versions: {
        Row: {
          content_hash: string
          created_at: string
          id: string
          language: string
          provider: string
          provider_lyrics_id: string
          rights_json: Json
          song_id: string
          timing_available: boolean
        }
        Insert: {
          content_hash: string
          created_at?: string
          id?: string
          language?: string
          provider: string
          provider_lyrics_id: string
          rights_json?: Json
          song_id: string
          timing_available?: boolean
        }
        Update: {
          content_hash?: string
          created_at?: string
          id?: string
          language?: string
          provider?: string
          provider_lyrics_id?: string
          rights_json?: Json
          song_id?: string
          timing_available?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "lyrics_versions_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      private_usage_events: {
        Row: {
          created_at: string
          id: number
          operation: string
          request_nonce: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          operation: string
          request_nonce: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: never
          operation?: string
          request_nonce?: string
          user_id?: string
        }
        Relationships: []
      }
      processing_attempts: {
        Row: {
          confidence: number | null
          created_at: string
          error_code: string | null
          id: string
          latency_ms: number | null
          provider: string | null
          session_id: string
          stage: string
          status: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          error_code?: string | null
          id?: string
          latency_ms?: number | null
          provider?: string | null
          session_id: string
          stage: string
          status?: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          error_code?: string | null
          id?: string
          latency_ms?: number | null
          provider?: string | null
          session_id?: string
          stage?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "processing_attempts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "learning_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      recognition_attempts: {
        Row: {
          candidate_song_json: Json | null
          confidence: number | null
          confirmed_song_id: string | null
          created_at: string
          error_code: string | null
          id: string
          input_type: string
          latency_ms: number | null
          provider: string | null
          rejected_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          candidate_song_json?: Json | null
          confidence?: number | null
          confirmed_song_id?: string | null
          created_at?: string
          error_code?: string | null
          id?: string
          input_type: string
          latency_ms?: number | null
          provider?: string | null
          rejected_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          candidate_song_json?: Json | null
          confidence?: number | null
          confirmed_song_id?: string | null
          created_at?: string
          error_code?: string | null
          id?: string
          input_type?: string
          latency_ms?: number | null
          provider?: string | null
          rejected_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recognition_attempts_confirmed_song_id_fkey"
            columns: ["confirmed_song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      songs: {
        Row: {
          album: string | null
          apple_music_id: string | null
          artist: string
          artwork_url: string | null
          created_at: string
          id: string
          isrc: string | null
          musicbrainz_id: string | null
          source_language: string
          spotify_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          album?: string | null
          apple_music_id?: string | null
          artist: string
          artwork_url?: string | null
          created_at?: string
          id?: string
          isrc?: string | null
          musicbrainz_id?: string | null
          source_language?: string
          spotify_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          album?: string | null
          apple_music_id?: string | null
          artist?: string
          artwork_url?: string | null
          created_at?: string
          id?: string
          isrc?: string | null
          musicbrainz_id?: string | null
          source_language?: string
          spotify_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_phrase_review: {
        Row: {
          created_at: string
          difficulty: number
          interval_days: number
          lapse_count: number
          last_rating: string | null
          last_reviewed_at: string | null
          next_review_at: string
          phrase_id: string
          review_count: number
          state: string
          success_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          difficulty?: number
          interval_days?: number
          lapse_count?: number
          last_rating?: string | null
          last_reviewed_at?: string | null
          next_review_at?: string
          phrase_id: string
          review_count?: number
          state?: string
          success_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          difficulty?: number
          interval_days?: number
          lapse_count?: number
          last_rating?: string | null
          last_reviewed_at?: string | null
          next_review_at?: string
          phrase_id?: string
          review_count?: number
          state?: string
          success_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_phrase_review_phrase_owner_fkey"
            columns: ["phrase_id", "user_id"]
            isOneToOne: false
            referencedRelation: "user_phrasebook"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      user_phrasebook: {
        Row: {
          created_at: string
          id: string
          italian_chunk: string
          last_reviewed_at: string | null
          meaning_hu: string
          note_hu: string | null
          register: string | null
          source_session_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          italian_chunk: string
          last_reviewed_at?: string | null
          meaning_hu: string
          note_hu?: string | null
          register?: string | null
          source_session_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          italian_chunk?: string
          last_reviewed_at?: string | null
          meaning_hu?: string
          note_hu?: string | null
          register?: string | null
          source_session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_phrasebook_source_owner_fkey"
            columns: ["source_session_id", "user_id"]
            isOneToOne: false
            referencedRelation: "learning_sessions"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      user_song_progress: {
        Row: {
          created_at: string
          last_opened_at: string | null
          lesson_id: string | null
          percent_complete: number
          quiz_score: number | null
          song_id: string
          stage: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          last_opened_at?: string | null
          lesson_id?: string | null
          percent_complete?: number
          quiz_score?: number | null
          song_id: string
          stage?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          last_opened_at?: string | null
          lesson_id?: string | null
          percent_complete?: number
          quiz_score?: number | null
          song_id?: string
          stage?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_song_progress_lesson_id_song_id_fkey"
            columns: ["lesson_id", "song_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id", "song_id"]
          },
          {
            foreignKeyName: "user_song_progress_user_id_song_id_fkey"
            columns: ["user_id", "song_id"]
            isOneToOne: true
            referencedRelation: "user_songs"
            referencedColumns: ["user_id", "song_id"]
          },
        ]
      }
      user_songs: {
        Row: {
          saved_at: string
          song_id: string
          user_id: string
        }
        Insert: {
          saved_at?: string
          song_id: string
          user_id: string
        }
        Update: {
          saved_at?: string
          song_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_songs_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clear_learning_session_source: {
        Args: { target_session_id: string }
        Returns: boolean
      }
      complete_learning_analysis: {
        Args: {
          p_attempt_id: string
          p_generator_version: string
          p_latency_ms: number
          p_result_json: Json
          p_schema_version: string
          p_session_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      complete_pronunciation_feedback: {
        Args: {
          p_attempt_id: string
          p_error_code?: string
          p_latency_ms: number
          p_session_id: string
          p_status: string
        }
        Returns: boolean
      }
      complete_transcription_attempt: {
        Args: {
          p_attempt_id: string
          p_error_code?: string
          p_latency_ms: number
          p_session_id: string
          p_status: string
        }
        Returns: boolean
      }
      consume_private_usage: {
        Args: {
          p_limit: number
          p_operation: string
          p_request_nonce: string
          p_user_id: string
        }
        Returns: boolean
      }
      fail_learning_analysis: {
        Args: {
          p_attempt_id: string
          p_error_code: string
          p_latency_ms: number
          p_session_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      start_learning_analysis: {
        Args: {
          p_generator_version: string
          p_input_type: string
          p_provider: string
          p_schema_version: string
          p_session_id: string
          p_source_char_count: number
          p_source_fingerprint: string
          p_source_status: string
          p_user_id: string
        }
        Returns: {
          cached_result: Json
          learning_session_id: string
          processing_attempt_id: string
        }[]
      }
      start_pronunciation_feedback: {
        Args: { p_provider: string; p_session_id: string }
        Returns: string
      }
      start_transcription_session: {
        Args: {
          p_input_type: string
          p_provider: string
          p_source_duration_ms: number
        }
        Returns: {
          learning_session_id: string
          processing_attempt_id: string
        }[]
      }
      verify_transcript_candidate: {
        Args: { p_session_id: string; p_source_status: string }
        Returns: boolean
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

