import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not configured. Using local-only mode.')
}

// Note: Database types will be validated when Supabase project is configured
// For now, use flexible typing to allow development without strict schema
export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

// Helper to check if Supabase is available
export const isSupabaseConfigured = () => !!supabase
