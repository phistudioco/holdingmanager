/**
 * Helper functions for Supabase operations on new tables
 * that may not have full type support yet
 */

import { createUntypedClient } from './client'

type AnyRecord = Record<string, unknown>

/**
 * Insert data into a table without strict type checking
 */
export async function insertIntoTable(
  tableName: string,
  data: AnyRecord | AnyRecord[]
) {
  const supabase = createUntypedClient()
  return supabase.from(tableName).insert(data).select()
}

/**
 * Update data in a table without strict type checking
 */
export async function updateTable(
  tableName: string,
  data: AnyRecord,
  filters: { column: string; value: unknown }[]
) {
  const supabase = createUntypedClient()
  let query = supabase.from(tableName).update(data)
  for (const filter of filters) {
    query = query.eq(filter.column, filter.value)
  }
  return query
}

/**
 * Select from a table without strict type checking
 */
export async function selectFromTable<T = AnyRecord>(
  tableName: string,
  columns: string = '*',
  filters: { column: string; value: unknown }[] = [],
  options: { order?: { column: string; ascending: boolean }; limit?: number; single?: boolean } = {}
) {
  const supabase = createUntypedClient()
  let query = supabase.from(tableName).select(columns)

  for (const filter of filters) {
    query = query.eq(filter.column, filter.value)
  }

  if (options.order) {
    query = query.order(options.order.column, { ascending: options.order.ascending })
  }

  if (options.limit) {
    query = query.limit(options.limit)
  }

  if (options.single) {
    return query.single() as Promise<{ data: T | null; error: unknown }>
  }

  return query as Promise<{ data: T[] | null; error: unknown }>
}
