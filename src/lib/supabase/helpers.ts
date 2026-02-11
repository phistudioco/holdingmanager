/**
 * Helper functions for Supabase operations on new tables
 * that may not have full type support yet
 */

import { createClient } from './client'

type AnyRecord = Record<string, unknown>

/**
 * Insert data into a table without strict type checking
 */
export async function insertIntoTable(
  tableName: string,
  data: AnyRecord | AnyRecord[]
) {
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(tableName).insert(data).select()
}

/**
 * Update data in a table without strict type checking
 */
export async function updateTable(
  tableName: string,
  data: AnyRecord,
  filters: { column: string; value: unknown }[]
) {
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any).from(tableName).update(data)
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
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any).from(tableName).select(columns)

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
