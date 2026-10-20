import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error('Brak VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

/** Public profile columns — `phone` is not readable by clients (own profile: rpc('my_profile')). */
export const PUBLIC_PROFILE_COLUMNS =
  'id, username, display_name, city, avatar_url, bio, rating_avg, rating_count, is_admin, phone_verified_at, created_at, updated_at'
