<<<<<<< ours
import type { SupabaseClient } from '@supabase/supabase-js'

export class SupabaseBusinessDatabase {
  constructor(private readonly client: SupabaseClient) {}

  async select<T>(table: string, query: (client: SupabaseClient) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
    validateTable(table)
    const { data, error } = await query(this.client)
    if (error) throw new Error(`Supabase ${table} select failed`)
    return data ?? []
  }

  async insert<T>(table: string, rows: Record<string, unknown>[]): Promise<T[]> {
    validateTable(table)
    const { data, error } = await this.client.from(table).insert(rows).select()
    if (error) throw new Error(`Supabase ${table} insert failed`)
    return (data ?? []) as T[]
  }

  async update<T>(table: string, patch: Record<string, unknown>, match: Record<string, unknown>): Promise<T[]> {
    validateTable(table)
    let query = this.client.from(table).update(patch)
    for (const [key, value] of Object.entries(match)) query = query.eq(key, value)
    const { data, error } = await query.select()
    if (error) throw new Error(`Supabase ${table} update failed`)
    return (data ?? []) as T[]
  }
}

function validateTable(table: string) {
  if (!/^[a-z_]+$/.test(table)) throw new Error('Invalid table name')
=======
export interface SupabaseServerConfig {
  url: string
  serviceRoleKey: string
}

export class SupabaseConfigurationError extends Error {
  constructor(message = 'Supabase server configuration is missing') {
    super(message)
    this.name = 'SupabaseConfigurationError'
  }
}

export function getSupabaseServerConfig(env: NodeJS.ProcessEnv = process.env): SupabaseServerConfig {
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) throw new SupabaseConfigurationError()
  return { url: url.replace(/\/$/, ''), serviceRoleKey }
}

export class SupabaseBusinessDatabase {
  constructor(private readonly config = getSupabaseServerConfig()) {}

  async select<T>(table: string, query = ''): Promise<T[]> {
    const response = await this.request(table, { method: 'GET', query })
    return response as T[]
  }

  async insert<T>(table: string, rows: unknown[]): Promise<T[]> {
    const response = await this.request(table, {
      method: 'POST',
      body: JSON.stringify(rows),
      headers: { Prefer: 'return=representation' },
    })
    return response as T[]
  }

  async update<T>(table: string, query: string, patch: Record<string, unknown>): Promise<T[]> {
    const response = await this.request(table, {
      method: 'PATCH',
      query,
      body: JSON.stringify(patch),
      headers: { Prefer: 'return=representation' },
    })
    return response as T[]
  }

  private async request(table: string, init: { method: string; query?: string; body?: string; headers?: Record<string, string> }): Promise<unknown> {
    if (!/^[a-z_]+$/.test(table)) throw new Error('Invalid table name')
    const query = init.query ? `?${init.query.replace(/^\?/, '')}` : ''
    const response = await fetch(`${this.config.url}/rest/v1/${table}${query}`, {
      method: init.method,
      body: init.body,
      headers: {
        apikey: this.config.serviceRoleKey,
        Authorization: `Bearer ${this.config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        ...init.headers,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Supabase request failed: ${response.status}`)
    }

    if (response.status === 204) return []
    return response.json()
  }
>>>>>>> theirs
}

