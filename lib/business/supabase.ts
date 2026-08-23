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
}

