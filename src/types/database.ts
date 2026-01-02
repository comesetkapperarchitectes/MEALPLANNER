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
      settings: {
        Row: {
          id: number
          family_size: number
        }
        Insert: {
          id?: number
          family_size?: number
        }
        Update: {
          id?: number
          family_size?: number
        }
      }
      recipes: {
        Row: {
          id: number
          name: string
          source_book: string | null
          source_page: number | null
          image_path: string | null
          prep_time: number | null
          cook_time: number | null
          base_servings: number
          category: string
          seasons: string[]
          tags: string[]
          instructions: string | null
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          source_book?: string | null
          source_page?: number | null
          image_path?: string | null
          prep_time?: number | null
          cook_time?: number | null
          base_servings?: number
          category: string
          seasons?: string[]
          tags?: string[]
          instructions?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          source_book?: string | null
          source_page?: number | null
          image_path?: string | null
          prep_time?: number | null
          cook_time?: number | null
          base_servings?: number
          category?: string
          seasons?: string[]
          tags?: string[]
          instructions?: string | null
          created_at?: string
        }
      }
      ingredients: {
        Row: {
          id: number
          name: string
          unit: string
          category: string | null
          is_staple: boolean
        }
        Insert: {
          id?: number
          name: string
          unit: string
          category?: string | null
          is_staple?: boolean
        }
        Update: {
          id?: number
          name?: string
          unit?: string
          category?: string | null
          is_staple?: boolean
        }
      }
      recipe_ingredients: {
        Row: {
          id: number
          recipe_id: number
          ingredient_id: number
          quantity: number
        }
        Insert: {
          id?: number
          recipe_id: number
          ingredient_id: number
          quantity: number
        }
        Update: {
          id?: number
          recipe_id?: number
          ingredient_id?: number
          quantity?: number
        }
      }
      stock: {
        Row: {
          id: number
          ingredient_id: number
          quantity: number
          expiry_date: string | null
        }
        Insert: {
          id?: number
          ingredient_id: number
          quantity: number
          expiry_date?: string | null
        }
        Update: {
          id?: number
          ingredient_id?: number
          quantity?: number
          expiry_date?: string | null
        }
      }
      meal_plan: {
        Row: {
          id: number
          date: string
          meal_type: string
          recipe_id: number | null
          servings: number
          is_prepared: boolean
        }
        Insert: {
          id?: number
          date: string
          meal_type: string
          recipe_id?: number | null
          servings?: number
          is_prepared?: boolean
        }
        Update: {
          id?: number
          date?: string
          meal_type?: string
          recipe_id?: number | null
          servings?: number
          is_prepared?: boolean
        }
      }
      shopping_lists: {
        Row: {
          id: number
          week_start: string
          status: string
          created_at: string
          purchased_at: string | null
        }
        Insert: {
          id?: number
          week_start: string
          status?: string
          created_at?: string
          purchased_at?: string | null
        }
        Update: {
          id?: number
          week_start?: string
          status?: string
          created_at?: string
          purchased_at?: string | null
        }
      }
      shopping_list_items: {
        Row: {
          id: number
          list_id: number
          ingredient_id: number
          quantity_needed: number
          checked: boolean
        }
        Insert: {
          id?: number
          list_id: number
          ingredient_id: number
          quantity_needed: number
          checked?: boolean
        }
        Update: {
          id?: number
          list_id?: number
          ingredient_id?: number
          quantity_needed?: number
          checked?: boolean
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
