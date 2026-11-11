export type Row = Record<string, unknown>

export interface FakeDatabase {
  units: Row[]
  profiles: Row[]
  indicators: Row[]
  report_periods: Row[]
  reports: Row[]
  report_entries: Row[]
  indicator_helper_records: Row[]
}

type Operation = 'select' | 'update' | 'insert' | 'upsert' | 'delete'

type FakeError = { code: string; message: string }

export function createFakeClient(database: FakeDatabase) {
  let sequence = 0

  function uniqueViolation(table: keyof FakeDatabase, payload: Row, excluded: Row[]): FakeError | null {
    if (payload.code === undefined) return null
    const clash = database[table].find((row) => row.code === payload.code && !excluded.includes(row))
    return clash ? { code: '23505', message: `duplicate key value violates unique constraint "${String(table)}_code_key"` } : null
  }

  function from(table: keyof FakeDatabase) {
    const filters: Row = {}
    const inFilters: Record<string, unknown[]> = {}
    const rangeFilters: { column: string; op: 'gte' | 'lte'; value: unknown }[] = []
    const orGroups: ((row: Row) => boolean)[][] = []
    let operation: Operation = 'select'
    let payload: Row | null = null
    let insertPayload: Row[] | null = null
    let upsertPayload: Row[] | null = null

    const matching = () => database[table].filter((row) => (
      Object.entries(filters).every(([column, value]) => row[column] === value)
      && Object.entries(inFilters).every(([column, values]) => values.some((value) => row[column] === value))
      && rangeFilters.every(({ column, op, value }) => {
        const current = row[column]
        if (typeof current !== 'string' || typeof value !== 'string') return false
        return op === 'gte' ? current >= value : current <= value
      })
      && orGroups.every((group) => group.some((predicate) => predicate(row)))
    ))

    const run = (): { rows: Row[]; error: FakeError | null } => {
      if (operation === 'upsert' && upsertPayload) {
        const saved: Row[] = []
        for (const item of upsertPayload) {
          const target = database[table].find((row) => (
            (item.id !== undefined && row.id === item.id)
            || (item.report_id !== undefined && item.indicator_id !== undefined && row.report_id === item.report_id && row.indicator_id === item.indicator_id)
          ))
          if (target) {
            Object.assign(target, item)
            saved.push(target)
          } else {
            const inserted = { id: item.id ?? `fake-${++sequence}`, active: true, ...item }
            database[table] = [...database[table], inserted]
            saved.push(inserted)
          }
        }
        return { rows: saved, error: null }
      }
      if (operation === 'insert' && insertPayload) {
        const inserted: Row[] = []
        for (const item of insertPayload) {
          const violation = uniqueViolation(table, item, [])
          if (violation) return { rows: [], error: violation }
          const row = { id: item.id ?? `fake-${++sequence}`, active: true, ...item }
          database[table] = [...database[table], row]
          inserted.push(row)
        }
        return { rows: inserted, error: null }
      }
      if (operation === 'update' && payload) {
        const changes = payload
        const targets = matching()
        const violation = uniqueViolation(table, changes, targets)
        if (violation) return { rows: [], error: violation }
        database[table] = database[table].map((row) => (targets.includes(row) ? { ...row, ...changes } : row))
        return { rows: targets.map((row) => ({ ...row, ...changes })), error: null }
      }
      if (operation === 'delete') {
        const removed = matching()
        database[table] = database[table].filter((row) => !removed.includes(row))
        return { rows: removed, error: null }
      }
      return { rows: matching(), error: null }
    }

    const builder = {
      select: () => builder,
      order: () => builder,
      or: (expression: string) => {
        orGroups.push(expression.split(',').map((clause) => {
          const [column, operator, ...rest] = clause.trim().split('.')
          const value = rest.join('.')
          if (operator === 'is' && value === 'null') return (row: Row) => row[column] === null || row[column] === undefined
          if (operator === 'eq') return (row: Row) => row[column] !== undefined && String(row[column]) === value
          if (operator === 'in') {
            const items = value.replace(/^\(/, '').replace(/\)$/, '').split(',').filter(Boolean)
            return (row: Row) => row[column] !== undefined && items.includes(String(row[column]))
          }
          return () => true
        }))
        return builder
      },
      eq: (column: string, value: unknown) => {
        filters[column] = value
        return builder
      },
      in: (column: string, values: unknown[]) => {
        inFilters[column] = values
        return builder
      },
      gte: (column: string, value: unknown) => {
        rangeFilters.push({ column, op: 'gte', value })
        return builder
      },
      lte: (column: string, value: unknown) => {
        rangeFilters.push({ column, op: 'lte', value })
        return builder
      },
      update: (values: Row) => {
        operation = 'update'
        payload = values
        return builder
      },
      insert: (values: Row | Row[]) => {
        operation = 'insert'
        insertPayload = Array.isArray(values) ? values : [values]
        return builder
      },
      upsert: (values: Row | Row[]) => {
        operation = 'upsert'
        upsertPayload = Array.isArray(values) ? values : [values]
        return builder
      },
      delete: () => {
        operation = 'delete'
        return builder
      },
      maybeSingle: () => {
        const { rows, error } = run()
        return Promise.resolve({ data: error ? null : rows[0] ?? null, error })
      },
      single: () => {
        const { rows, error } = run()
        if (error) return Promise.resolve({ data: null, error })
        if (rows.length !== 1) {
          return Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' } })
        }
        return Promise.resolve({ data: rows[0], error: null })
      },
      then: (resolve: (value: { data: Row[]; error: FakeError | null }) => unknown) => {
        const { rows, error } = run()
        return Promise.resolve({ data: error ? [] : rows, error }).then(resolve)
      },
    }

    return builder
  }

  return { from }
}
