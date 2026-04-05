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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      blackout_dates: {
        Row: {
          created_at: string
          ends_on: string
          id: string
          is_active: boolean
          notes: string | null
          reason: string
          scope: Database["public"]["Enums"]["blackout_scope"]
          starts_on: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_on: string
          id?: string
          is_active?: boolean
          notes?: string | null
          reason: string
          scope?: Database["public"]["Enums"]["blackout_scope"]
          starts_on: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_on?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          reason?: string
          scope?: Database["public"]["Enums"]["blackout_scope"]
          starts_on?: string
          updated_at?: string
        }
        Relationships: []
      }
      calendar_entries: {
        Row: {
          all_day: boolean
          color_token: string | null
          created_at: string
          customer_id: string | null
          ends_at: string | null
          entry_type: Database["public"]["Enums"]["calendar_entry_type"]
          id: string
          inquiry_id: string | null
          is_private: boolean
          location_text: string | null
          notes: string | null
          order_id: string | null
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          all_day?: boolean
          color_token?: string | null
          created_at?: string
          customer_id?: string | null
          ends_at?: string | null
          entry_type: Database["public"]["Enums"]["calendar_entry_type"]
          id?: string
          inquiry_id?: string | null
          is_private?: boolean
          location_text?: string | null
          notes?: string | null
          order_id?: string | null
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          all_day?: boolean
          color_token?: string | null
          created_at?: string
          customer_id?: string | null
          ends_at?: string | null
          entry_type?: Database["public"]["Enums"]["calendar_entry_type"]
          id?: string
          inquiry_id?: string | null
          is_private?: boolean
          location_text?: string | null
          notes?: string | null
          order_id?: string | null
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_entries_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_entries_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_entries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      content_blocks: {
        Row: {
          block_key: string
          block_type: Database["public"]["Enums"]["content_block_type"]
          body: string | null
          created_at: string
          display_order: number
          eyebrow: string | null
          heading: string | null
          id: string
          is_active: boolean
          items_json: Json
          label: string | null
          page_key: string
          section_key: string
          settings_json: Json
          updated_at: string
        }
        Insert: {
          block_key: string
          block_type: Database["public"]["Enums"]["content_block_type"]
          body?: string | null
          created_at?: string
          display_order?: number
          eyebrow?: string | null
          heading?: string | null
          id?: string
          is_active?: boolean
          items_json?: Json
          label?: string | null
          page_key: string
          section_key: string
          settings_json?: Json
          updated_at?: string
        }
        Update: {
          block_key?: string
          block_type?: Database["public"]["Enums"]["content_block_type"]
          body?: string | null
          created_at?: string
          display_order?: number
          eyebrow?: string | null
          heading?: string | null
          id?: string
          is_active?: boolean
          items_json?: Json
          label?: string | null
          page_key?: string
          section_key?: string
          settings_json?: Json
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          default_fulfillment_method:
            | Database["public"]["Enums"]["fulfillment_method"]
            | null
          email: string | null
          full_name: string
          id: string
          instagram_handle: string | null
          last_inquiry_at: string | null
          last_order_at: string | null
          lead_source: string | null
          notes: string | null
          phone: string | null
          preferred_contact: Database["public"]["Enums"]["contact_preference"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_fulfillment_method?:
            | Database["public"]["Enums"]["fulfillment_method"]
            | null
          email?: string | null
          full_name: string
          id?: string
          instagram_handle?: string | null
          last_inquiry_at?: string | null
          last_order_at?: string | null
          lead_source?: string | null
          notes?: string | null
          phone?: string | null
          preferred_contact?: Database["public"]["Enums"]["contact_preference"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_fulfillment_method?:
            | Database["public"]["Enums"]["fulfillment_method"]
            | null
          email?: string | null
          full_name?: string
          id?: string
          instagram_handle?: string | null
          last_inquiry_at?: string | null
          last_order_at?: string | null
          lead_source?: string | null
          notes?: string | null
          phone?: string | null
          preferred_contact?: Database["public"]["Enums"]["contact_preference"]
          updated_at?: string
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          answer: string
          category_key: string
          created_at: string
          display_order: number
          id: string
          is_published: boolean
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category_key: string
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category_key?: string
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      gallery_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          additional_notes: string | null
          archived_at: string | null
          budget_max: number | null
          budget_min: number | null
          color_palette: string | null
          created_at: string
          customer_email: string
          customer_id: string | null
          customer_name: string
          customer_phone: string
          delivery_window: string | null
          dietary_notes: string | null
          estimated_max: number | null
          estimated_min: number | null
          event_date: string
          event_time: string | null
          event_type: string
          fulfillment_method: Database["public"]["Enums"]["fulfillment_method"]
          guest_count: number | null
          how_did_you_hear: string | null
          id: string
          inspiration_text: string | null
          instagram_handle: string | null
          internal_summary: string | null
          metadata: Json
          preferred_contact: Database["public"]["Enums"]["contact_preference"]
          reviewed_at: string | null
          serving_target: number | null
          source_channel: Database["public"]["Enums"]["inquiry_source"]
          status: Database["public"]["Enums"]["inquiry_status"]
          submitted_at: string
          updated_at: string
          venue_address: string | null
          venue_name: string | null
        }
        Insert: {
          additional_notes?: string | null
          archived_at?: string | null
          budget_max?: number | null
          budget_min?: number | null
          color_palette?: string | null
          created_at?: string
          customer_email: string
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          delivery_window?: string | null
          dietary_notes?: string | null
          estimated_max?: number | null
          estimated_min?: number | null
          event_date: string
          event_time?: string | null
          event_type: string
          fulfillment_method?: Database["public"]["Enums"]["fulfillment_method"]
          guest_count?: number | null
          how_did_you_hear?: string | null
          id?: string
          inspiration_text?: string | null
          instagram_handle?: string | null
          internal_summary?: string | null
          metadata?: Json
          preferred_contact?: Database["public"]["Enums"]["contact_preference"]
          reviewed_at?: string | null
          serving_target?: number | null
          source_channel?: Database["public"]["Enums"]["inquiry_source"]
          status?: Database["public"]["Enums"]["inquiry_status"]
          submitted_at?: string
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
        }
        Update: {
          additional_notes?: string | null
          archived_at?: string | null
          budget_max?: number | null
          budget_min?: number | null
          color_palette?: string | null
          created_at?: string
          customer_email?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_window?: string | null
          dietary_notes?: string | null
          estimated_max?: number | null
          estimated_min?: number | null
          event_date?: string
          event_time?: string | null
          event_type?: string
          fulfillment_method?: Database["public"]["Enums"]["fulfillment_method"]
          guest_count?: number | null
          how_did_you_hear?: string | null
          id?: string
          inspiration_text?: string | null
          instagram_handle?: string | null
          internal_summary?: string | null
          metadata?: Json
          preferred_contact?: Database["public"]["Enums"]["contact_preference"]
          reviewed_at?: string | null
          serving_target?: number | null
          source_channel?: Database["public"]["Enums"]["inquiry_source"]
          status?: Database["public"]["Enums"]["inquiry_status"]
          submitted_at?: string
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiry_assets: {
        Row: {
          asset_type: Database["public"]["Enums"]["inquiry_asset_type"]
          asset_url: string | null
          created_at: string
          external_url: string | null
          id: string
          inquiry_id: string
          inquiry_item_id: string | null
          label: string | null
          media_asset_id: string | null
          metadata: Json
          sort_order: number
          text_content: string | null
          updated_at: string
        }
        Insert: {
          asset_type: Database["public"]["Enums"]["inquiry_asset_type"]
          asset_url?: string | null
          created_at?: string
          external_url?: string | null
          id?: string
          inquiry_id: string
          inquiry_item_id?: string | null
          label?: string | null
          media_asset_id?: string | null
          metadata?: Json
          sort_order?: number
          text_content?: string | null
          updated_at?: string
        }
        Update: {
          asset_type?: Database["public"]["Enums"]["inquiry_asset_type"]
          asset_url?: string | null
          created_at?: string
          external_url?: string | null
          id?: string
          inquiry_id?: string
          inquiry_item_id?: string | null
          label?: string | null
          media_asset_id?: string | null
          metadata?: Json
          sort_order?: number
          text_content?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_assets_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiry_assets_inquiry_item_id_fkey"
            columns: ["inquiry_item_id"]
            isOneToOne: false
            referencedRelation: "inquiry_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiry_assets_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiry_items: {
        Row: {
          color_palette: string | null
          cookie_count: number | null
          created_at: string
          cupcake_count: number | null
          design_notes: string | null
          detail_json: Json
          estimated_max: number | null
          estimated_min: number | null
          flavor_notes: string | null
          icing_style: Database["public"]["Enums"]["icing_style"] | null
          id: string
          inquiry_id: string
          inspiration_notes: string | null
          kit_count: number | null
          macaron_count: number | null
          product_id: string | null
          product_label: string
          product_type: Database["public"]["Enums"]["product_type"]
          quantity: number
          servings: number | null
          shape: Database["public"]["Enums"]["product_shape"] | null
          size_label: string | null
          sort_order: number
          tiers: number | null
          topper_text: string | null
          updated_at: string
          wedding_servings: number | null
        }
        Insert: {
          color_palette?: string | null
          cookie_count?: number | null
          created_at?: string
          cupcake_count?: number | null
          design_notes?: string | null
          detail_json?: Json
          estimated_max?: number | null
          estimated_min?: number | null
          flavor_notes?: string | null
          icing_style?: Database["public"]["Enums"]["icing_style"] | null
          id?: string
          inquiry_id: string
          inspiration_notes?: string | null
          kit_count?: number | null
          macaron_count?: number | null
          product_id?: string | null
          product_label: string
          product_type: Database["public"]["Enums"]["product_type"]
          quantity?: number
          servings?: number | null
          shape?: Database["public"]["Enums"]["product_shape"] | null
          size_label?: string | null
          sort_order?: number
          tiers?: number | null
          topper_text?: string | null
          updated_at?: string
          wedding_servings?: number | null
        }
        Update: {
          color_palette?: string | null
          cookie_count?: number | null
          created_at?: string
          cupcake_count?: number | null
          design_notes?: string | null
          detail_json?: Json
          estimated_max?: number | null
          estimated_min?: number | null
          flavor_notes?: string | null
          icing_style?: Database["public"]["Enums"]["icing_style"] | null
          id?: string
          inquiry_id?: string
          inspiration_notes?: string | null
          kit_count?: number | null
          macaron_count?: number | null
          product_id?: string | null
          product_label?: string
          product_type?: Database["public"]["Enums"]["product_type"]
          quantity?: number
          servings?: number | null
          shape?: Database["public"]["Enums"]["product_shape"] | null
          size_label?: string | null
          sort_order?: number
          tiers?: number | null
          topper_text?: string | null
          updated_at?: string
          wedding_servings?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_items_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiry_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiry_notes: {
        Row: {
          author_profile_id: string | null
          created_at: string
          id: string
          inquiry_id: string
          is_pinned: boolean
          note_body: string
          note_type: Database["public"]["Enums"]["internal_note_type"]
          updated_at: string
        }
        Insert: {
          author_profile_id?: string | null
          created_at?: string
          id?: string
          inquiry_id: string
          is_pinned?: boolean
          note_body: string
          note_type?: Database["public"]["Enums"]["internal_note_type"]
          updated_at?: string
        }
        Update: {
          author_profile_id?: string | null
          created_at?: string
          id?: string
          inquiry_id?: string
          is_pinned?: boolean
          note_body?: string
          note_type?: Database["public"]["Enums"]["internal_note_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_notes_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiry_notes_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          alt_text: string | null
          asset_kind: Database["public"]["Enums"]["media_asset_kind"]
          bucket: string
          caption: string | null
          checksum: string | null
          created_at: string
          file_size_bytes: number | null
          focal_point: Json
          height: number | null
          id: string
          metadata: Json
          mime_type: string | null
          original_filename: string | null
          public_url: string | null
          source_kind: Database["public"]["Enums"]["media_source_kind"]
          storage_path: string
          updated_at: string
          uploaded_by_profile_id: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          asset_kind?: Database["public"]["Enums"]["media_asset_kind"]
          bucket?: string
          caption?: string | null
          checksum?: string | null
          created_at?: string
          file_size_bytes?: number | null
          focal_point?: Json
          height?: number | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          original_filename?: string | null
          public_url?: string | null
          source_kind?: Database["public"]["Enums"]["media_source_kind"]
          storage_path: string
          updated_at?: string
          uploaded_by_profile_id?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          asset_kind?: Database["public"]["Enums"]["media_asset_kind"]
          bucket?: string
          caption?: string | null
          checksum?: string | null
          created_at?: string
          file_size_bytes?: number | null
          focal_point?: Json
          height?: number | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          original_filename?: string | null
          public_url?: string | null
          source_kind?: Database["public"]["Enums"]["media_source_kind"]
          storage_path?: string
          updated_at?: string
          uploaded_by_profile_id?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_uploaded_by_profile_id_fkey"
            columns: ["uploaded_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assignments: {
        Row: {
          assignment_type: Database["public"]["Enums"]["media_assignment_type"]
          created_at: string
          display_order: number
          id: string
          media_asset_id: string
          metadata: Json
          page_key: string | null
          section_key: string | null
          slot_key: string
          target_id: string | null
          updated_at: string
        }
        Insert: {
          assignment_type: Database["public"]["Enums"]["media_assignment_type"]
          created_at?: string
          display_order?: number
          id?: string
          media_asset_id: string
          metadata?: Json
          page_key?: string | null
          section_key?: string | null
          slot_key?: string
          target_id?: string | null
          updated_at?: string
        }
        Update: {
          assignment_type?: Database["public"]["Enums"]["media_assignment_type"]
          created_at?: string
          display_order?: number
          id?: string
          media_asset_id?: string
          metadata?: Json
          page_key?: string | null
          section_key?: string | null
          slot_key?: string
          target_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_assignments_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_events: {
        Row: {
          category_key: string
          created_at: string
          default_channels: Json
          description: string | null
          event_key: string
          id: string
          is_active: boolean
          template_key: string | null
          updated_at: string
        }
        Insert: {
          category_key: string
          created_at?: string
          default_channels?: Json
          description?: string | null
          event_key: string
          id?: string
          is_active?: boolean
          template_key?: string | null
          updated_at?: string
        }
        Update: {
          category_key?: string
          created_at?: string
          default_channels?: Json
          description?: string | null
          event_key?: string
          id?: string
          is_active?: boolean
          template_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          attempted_at: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          customer_id: string | null
          error_message: string | null
          id: string
          inquiry_id: string | null
          notification_event_id: string | null
          order_id: string | null
          payload: Json
          recipient: string
          response_json: Json
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_delivery_status"]
          subject: string | null
          updated_at: string
        }
        Insert: {
          attempted_at?: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          customer_id?: string | null
          error_message?: string | null
          id?: string
          inquiry_id?: string | null
          notification_event_id?: string | null
          order_id?: string | null
          payload?: Json
          recipient: string
          response_json?: Json
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_delivery_status"]
          subject?: string | null
          updated_at?: string
        }
        Update: {
          attempted_at?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          customer_id?: string | null
          error_message?: string | null
          id?: string
          inquiry_id?: string | null
          notification_event_id?: string | null
          order_id?: string | null
          payload?: Json
          recipient?: string
          response_json?: Json
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_delivery_status"]
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_notification_event_id_fkey"
            columns: ["notification_event_id"]
            isOneToOne: false
            referencedRelation: "notification_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          color_palette: string | null
          cookie_count: number | null
          created_at: string
          cupcake_count: number | null
          design_notes: string | null
          detail_json: Json
          flavor_notes: string | null
          icing_style: Database["public"]["Enums"]["icing_style"] | null
          id: string
          inquiry_item_id: string | null
          kit_count: number | null
          kitchen_notes: string | null
          line_total: number | null
          macaron_count: number | null
          order_id: string
          product_id: string | null
          product_label: string
          product_type: Database["public"]["Enums"]["product_type"]
          quantity: number
          servings: number | null
          shape: Database["public"]["Enums"]["product_shape"] | null
          size_label: string | null
          sort_order: number
          tiers: number | null
          topper_text: string | null
          unit_price: number | null
          updated_at: string
          wedding_servings: number | null
        }
        Insert: {
          color_palette?: string | null
          cookie_count?: number | null
          created_at?: string
          cupcake_count?: number | null
          design_notes?: string | null
          detail_json?: Json
          flavor_notes?: string | null
          icing_style?: Database["public"]["Enums"]["icing_style"] | null
          id?: string
          inquiry_item_id?: string | null
          kit_count?: number | null
          kitchen_notes?: string | null
          line_total?: number | null
          macaron_count?: number | null
          order_id: string
          product_id?: string | null
          product_label: string
          product_type: Database["public"]["Enums"]["product_type"]
          quantity?: number
          servings?: number | null
          shape?: Database["public"]["Enums"]["product_shape"] | null
          size_label?: string | null
          sort_order?: number
          tiers?: number | null
          topper_text?: string | null
          unit_price?: number | null
          updated_at?: string
          wedding_servings?: number | null
        }
        Update: {
          color_palette?: string | null
          cookie_count?: number | null
          created_at?: string
          cupcake_count?: number | null
          design_notes?: string | null
          detail_json?: Json
          flavor_notes?: string | null
          icing_style?: Database["public"]["Enums"]["icing_style"] | null
          id?: string
          inquiry_item_id?: string | null
          kit_count?: number | null
          kitchen_notes?: string | null
          line_total?: number | null
          macaron_count?: number | null
          order_id?: string
          product_id?: string | null
          product_label?: string
          product_type?: Database["public"]["Enums"]["product_type"]
          quantity?: number
          servings?: number | null
          shape?: Database["public"]["Enums"]["product_shape"] | null
          size_label?: string | null
          sort_order?: number
          tiers?: number | null
          topper_text?: string | null
          unit_price?: number | null
          updated_at?: string
          wedding_servings?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_inquiry_item_id_fkey"
            columns: ["inquiry_item_id"]
            isOneToOne: false
            referencedRelation: "inquiry_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_notes: {
        Row: {
          author_profile_id: string | null
          created_at: string
          id: string
          is_pinned: boolean
          note_body: string
          note_type: Database["public"]["Enums"]["internal_note_type"]
          order_id: string
          updated_at: string
        }
        Insert: {
          author_profile_id?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean
          note_body: string
          note_type?: Database["public"]["Enums"]["internal_note_type"]
          order_id: string
          updated_at?: string
        }
        Update: {
          author_profile_id?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean
          note_body?: string
          note_type?: Database["public"]["Enums"]["internal_note_type"]
          order_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_notes_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          balance_due_amount: number
          cancelled_at: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          customer_id: string
          delivery_address: string | null
          delivery_fee: number
          deposit_due_amount: number
          deposit_due_at: string | null
          discount_amount: number
          due_at: string | null
          event_date: string
          event_type: string
          final_due_at: string | null
          fulfilled_at: string | null
          fulfillment_method: Database["public"]["Enums"]["fulfillment_method"]
          fulfillment_window: string | null
          id: string
          inquiry_id: string | null
          internal_summary: string | null
          metadata: Json
          payment_status: Database["public"]["Enums"]["payment_status"]
          production_notes: string | null
          quoted_at: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal_amount: number
          tax_amount: number
          total_amount: number
          updated_at: string
          venue_address: string | null
          venue_name: string | null
        }
        Insert: {
          balance_due_amount?: number
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          customer_id: string
          delivery_address?: string | null
          delivery_fee?: number
          deposit_due_amount?: number
          deposit_due_at?: string | null
          discount_amount?: number
          due_at?: string | null
          event_date: string
          event_type: string
          final_due_at?: string | null
          fulfilled_at?: string | null
          fulfillment_method?: Database["public"]["Enums"]["fulfillment_method"]
          fulfillment_window?: string | null
          id?: string
          inquiry_id?: string | null
          internal_summary?: string | null
          metadata?: Json
          payment_status?: Database["public"]["Enums"]["payment_status"]
          production_notes?: string | null
          quoted_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_amount?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
        }
        Update: {
          balance_due_amount?: number
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          customer_id?: string
          delivery_address?: string | null
          delivery_fee?: number
          deposit_due_amount?: number
          deposit_due_at?: string | null
          discount_amount?: number
          due_at?: string | null
          event_date?: string
          event_type?: string
          final_due_at?: string | null
          fulfilled_at?: string | null
          fulfillment_method?: Database["public"]["Enums"]["fulfillment_method"]
          fulfillment_window?: string | null
          id?: string
          inquiry_id?: string | null
          internal_summary?: string | null
          metadata?: Json
          payment_status?: Database["public"]["Enums"]["payment_status"]
          production_notes?: string | null
          quoted_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_amount?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: true
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency_code: string
          customer_id: string | null
          due_at: string | null
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          order_id: string
          paid_at: string | null
          payment_type: Database["public"]["Enums"]["payment_type"]
          provider_intent_id: string | null
          provider_name: string | null
          reference_code: string | null
          status: Database["public"]["Enums"]["payment_record_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency_code?: string
          customer_id?: string | null
          due_at?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          order_id: string
          paid_at?: string | null
          payment_type?: Database["public"]["Enums"]["payment_type"]
          provider_intent_id?: string | null
          provider_name?: string | null
          reference_code?: string | null
          status?: Database["public"]["Enums"]["payment_record_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency_code?: string
          customer_id?: string | null
          due_at?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          order_id?: string
          paid_at?: string | null
          payment_type?: Database["public"]["Enums"]["payment_type"]
          provider_intent_id?: string | null
          provider_name?: string | null
          reference_code?: string | null
          status?: Database["public"]["Enums"]["payment_record_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rules: {
        Row: {
          adjustment_max: number | null
          adjustment_min: number | null
          adjustment_mode: Database["public"]["Enums"]["pricing_adjustment_mode"]
          created_at: string
          criteria: Json
          description: string | null
          ends_on: string | null
          id: string
          is_active: boolean
          priority: number
          product_id: string | null
          rule_name: string
          rule_scope: Database["public"]["Enums"]["pricing_rule_scope"]
          rule_type: Database["public"]["Enums"]["pricing_rule_type"]
          starts_on: string | null
          updated_at: string
        }
        Insert: {
          adjustment_max?: number | null
          adjustment_min?: number | null
          adjustment_mode: Database["public"]["Enums"]["pricing_adjustment_mode"]
          created_at?: string
          criteria?: Json
          description?: string | null
          ends_on?: string | null
          id?: string
          is_active?: boolean
          priority?: number
          product_id?: string | null
          rule_name: string
          rule_scope?: Database["public"]["Enums"]["pricing_rule_scope"]
          rule_type: Database["public"]["Enums"]["pricing_rule_type"]
          starts_on?: string | null
          updated_at?: string
        }
        Update: {
          adjustment_max?: number | null
          adjustment_min?: number | null
          adjustment_mode?: Database["public"]["Enums"]["pricing_adjustment_mode"]
          created_at?: string
          criteria?: Json
          description?: string | null
          ends_on?: string | null
          id?: string
          is_active?: boolean
          priority?: number
          product_id?: string | null
          rule_name?: string
          rule_scope?: Database["public"]["Enums"]["pricing_rule_scope"]
          rule_type?: Database["public"]["Enums"]["pricing_rule_type"]
          starts_on?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_rules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_prices: {
        Row: {
          created_at: string
          currency_code: string
          effective_from: string
          effective_to: string | null
          id: string
          is_active: boolean
          label: string
          maximum_amount: number | null
          minimum_amount: number
          notes: string | null
          price_kind: Database["public"]["Enums"]["product_price_kind"]
          product_id: string
          quantity_step: number | null
          unit_label: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_code?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean
          label: string
          maximum_amount?: number | null
          minimum_amount: number
          notes?: string | null
          price_kind: Database["public"]["Enums"]["product_price_kind"]
          product_id: string
          quantity_step?: number | null
          unit_label?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_code?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean
          label?: string
          maximum_amount?: number | null
          minimum_amount?: number
          notes?: string | null
          price_kind?: Database["public"]["Enums"]["product_price_kind"]
          product_id?: string
          quantity_step?: number | null
          unit_label?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          long_description: string | null
          name: string
          product_type: Database["public"]["Enums"]["product_type"]
          requires_consultation: boolean
          short_description: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          long_description?: string | null
          name: string
          product_type: Database["public"]["Enums"]["product_type"]
          requires_consultation?: boolean
          short_description?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          long_description?: string | null
          name?: string
          product_type?: Database["public"]["Enums"]["product_type"]
          requires_consultation?: boolean
          short_description?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          last_sign_in_at: string | null
          phone: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          last_sign_in_at?: string | null
          phone?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_sign_in_at?: string | null
          phone?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          category_key: string
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          label: string
          setting_key: string
          updated_at: string
          value_json: Json
        }
        Insert: {
          category_key: string
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          label: string
          setting_key: string
          updated_at?: string
          value_json: Json
        }
        Update: {
          category_key?: string
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          label?: string
          setting_key?: string
          updated_at?: string
          value_json?: Json
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          attribution_name: string
          attribution_role: string | null
          created_at: string
          customer_id: string | null
          display_order: number
          id: string
          is_featured: boolean
          is_published: boolean
          quote: string
          source_label: string | null
          updated_at: string
        }
        Insert: {
          attribution_name: string
          attribution_role?: string | null
          created_at?: string
          customer_id?: string | null
          display_order?: number
          id?: string
          is_featured?: boolean
          is_published?: boolean
          quote: string
          source_label?: string | null
          updated_at?: string
        }
        Update: {
          attribution_name?: string
          attribution_role?: string | null
          created_at?: string
          customer_id?: string | null
          display_order?: number
          id?: string
          is_featured?: boolean
          is_published?: boolean
          quote?: string
          source_label?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["admin_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
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
      current_admin_role: {
        Args: never
        Returns: Database["public"]["Enums"]["admin_role"]
      }
      is_admin: { Args: never; Returns: boolean }
      is_owner: { Args: never; Returns: boolean }
    }
    Enums: {
      admin_role: "owner" | "manager"
      blackout_scope: "all" | "pickup" | "delivery"
      calendar_entry_type:
        | "consultation"
        | "tasting"
        | "pickup"
        | "delivery"
        | "order-deadline"
        | "task"
        | "personal"
        | "holiday"
        | "blackout"
      contact_preference: "email" | "text" | "phone"
      content_block_type:
        | "hero"
        | "rich-text"
        | "feature-list"
        | "cta"
        | "gallery-grid"
        | "faq-group"
        | "testimonial-group"
        | "pricing-summary"
        | "page-meta"
      fulfillment_method: "pickup" | "delivery"
      icing_style: "buttercream" | "fondant" | "textured" | "painted" | "mixed"
      inquiry_asset_type: "image-upload" | "reference-link" | "reference-text"
      inquiry_source:
        | "web"
        | "manual"
        | "email"
        | "phone"
        | "instagram"
        | "referral"
      inquiry_status:
        | "new"
        | "reviewing"
        | "quoted"
        | "approved"
        | "declined"
        | "archived"
      internal_note_type: "internal" | "system"
      media_asset_kind: "image" | "document" | "video"
      media_assignment_type:
        | "page"
        | "content-block"
        | "product"
        | "gallery-category"
        | "faq-item"
        | "testimonial"
      media_source_kind: "upload" | "external"
      notification_channel: "email" | "sms" | "internal"
      notification_delivery_status: "pending" | "sent" | "failed" | "skipped"
      order_status:
        | "draft"
        | "quoted"
        | "confirmed"
        | "in-production"
        | "fulfilled"
        | "completed"
        | "cancelled"
      payment_method: "cash" | "card" | "invoice" | "bank-transfer" | "other"
      payment_record_status:
        | "pending"
        | "paid"
        | "failed"
        | "refunded"
        | "voided"
      payment_status: "unpaid" | "deposit-paid" | "paid" | "refunded"
      payment_type: "deposit" | "balance" | "full" | "adjustment" | "refund"
      pricing_adjustment_mode:
        | "fixed"
        | "per-unit"
        | "percentage"
        | "range-override"
      pricing_rule_scope: "product" | "order" | "delivery" | "seasonal"
      pricing_rule_type:
        | "base"
        | "per-serving"
        | "per-unit"
        | "complexity"
        | "tier-count"
        | "shape"
        | "rush"
        | "delivery"
        | "discount"
        | "surcharge"
      product_price_kind:
        | "base"
        | "starting"
        | "per-serving"
        | "per-unit"
        | "package"
        | "delivery-add-on"
      product_shape:
        | "round"
        | "heart"
        | "sheet"
        | "tiered"
        | "mini"
        | "assorted"
      product_type:
        | "custom-cake"
        | "wedding-cake"
        | "cupcakes"
        | "sugar-cookies"
        | "macarons"
        | "diy-kit"
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
      admin_role: ["owner", "manager"],
      blackout_scope: ["all", "pickup", "delivery"],
      calendar_entry_type: [
        "consultation",
        "tasting",
        "pickup",
        "delivery",
        "order-deadline",
        "task",
        "personal",
        "holiday",
        "blackout",
      ],
      contact_preference: ["email", "text", "phone"],
      content_block_type: [
        "hero",
        "rich-text",
        "feature-list",
        "cta",
        "gallery-grid",
        "faq-group",
        "testimonial-group",
        "pricing-summary",
        "page-meta",
      ],
      fulfillment_method: ["pickup", "delivery"],
      icing_style: ["buttercream", "fondant", "textured", "painted", "mixed"],
      inquiry_asset_type: ["image-upload", "reference-link", "reference-text"],
      inquiry_source: [
        "web",
        "manual",
        "email",
        "phone",
        "instagram",
        "referral",
      ],
      inquiry_status: [
        "new",
        "reviewing",
        "quoted",
        "approved",
        "declined",
        "archived",
      ],
      internal_note_type: ["internal", "system"],
      media_asset_kind: ["image", "document", "video"],
      media_assignment_type: [
        "page",
        "content-block",
        "product",
        "gallery-category",
        "faq-item",
        "testimonial",
      ],
      media_source_kind: ["upload", "external"],
      notification_channel: ["email", "sms", "internal"],
      notification_delivery_status: ["pending", "sent", "failed", "skipped"],
      order_status: [
        "draft",
        "quoted",
        "confirmed",
        "in-production",
        "fulfilled",
        "completed",
        "cancelled",
      ],
      payment_method: ["cash", "card", "invoice", "bank-transfer", "other"],
      payment_record_status: [
        "pending",
        "paid",
        "failed",
        "refunded",
        "voided",
      ],
      payment_status: ["unpaid", "deposit-paid", "paid", "refunded"],
      payment_type: ["deposit", "balance", "full", "adjustment", "refund"],
      pricing_adjustment_mode: [
        "fixed",
        "per-unit",
        "percentage",
        "range-override",
      ],
      pricing_rule_scope: ["product", "order", "delivery", "seasonal"],
      pricing_rule_type: [
        "base",
        "per-serving",
        "per-unit",
        "complexity",
        "tier-count",
        "shape",
        "rush",
        "delivery",
        "discount",
        "surcharge",
      ],
      product_price_kind: [
        "base",
        "starting",
        "per-serving",
        "per-unit",
        "package",
        "delivery-add-on",
      ],
      product_shape: ["round", "heart", "sheet", "tiered", "mini", "assorted"],
      product_type: [
        "custom-cake",
        "wedding-cake",
        "cupcakes",
        "sugar-cookies",
        "macarons",
        "diy-kit",
      ],
    },
  },
} as const
