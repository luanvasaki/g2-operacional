import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sgosccetrioczfkytjyn.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnb3NjY2V0cmlvY3pma3l0anluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMjE3NTQsImV4cCI6MjEwNjc5Nzc1NH0.gitfy_X8bmg6p9dWA4YuOC65TvwcCjn8YWUSf6ZHnzA'

// Checks if Supabase URL and Key are properly defined and not placeholders
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('placeholder') &&
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY'
)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
