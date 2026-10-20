import { isBusinessDatabaseEnvironmentAllowed } from '@/lib/business/compatibility'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getSupabasePublishableKey, getSupabaseUrl } from './config'

export function createClient() {
  if (!isBusinessDatabaseEnvironmentAllowed(process.env)) throw new Error('Supabase environment is not approved for this application environment')
  const cookieStore = cookies()

  return createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server Components cannot set cookies. Middleware refreshes auth cookies.
        }
      },
    },
  })
}

