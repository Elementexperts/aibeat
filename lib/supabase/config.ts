export function getSupabaseUrl(env?: NodeJS.ProcessEnv): string {
  // Next.js only inlines direct public-variable references into browser bundles.
  const value = env ? env.NEXT_PUBLIC_SUPABASE_URL : process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!value) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
  return value
}

export function getSupabasePublishableKey(env?: NodeJS.ProcessEnv): string {
  const value = env ? env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY : process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!value) throw new Error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required')
  return value
}
