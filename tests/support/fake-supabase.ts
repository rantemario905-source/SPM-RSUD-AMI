export type Row = Record<string, unknown>

export interface FakeDatabase {
  units: Row[]
  profiles: Row[]
}

type Operation = 'select' | 'update' | 'insert' | 'delete'

export function createFakeClient(database: FakeDatabase) {
  function from(table: keyof FakeDatabase) {
    const filters: Row = {}
    let operation: Operation = 'select'
    let payload: Row | null = null

    const matching = () => database[table].filter((row) => Object.entries(filters).every(([column, value]) => row[column] === value))

    const commit = (): Row[] => {
      if (operation === 'insert' && payload) {
        const inserted = { active: true, ...payload }
        database[table] = [...database[table], inserted]
        return [inserted]
      }
      if (operation === 'update' && payload) {
        const changes = payload
        database[table] = database[table].map((row) => (matching().includes(row) ? { ...row, ...changes } : row))
        return matching()
      }
      if (operation === 'delete') {
        const removed = matching()
        database[table] = database[table].filter((row) => !removed.includes(row))
        return removed
      }
      return database[table]
    }

    const builder = {
      select: () => builder,
      order: () => builder,
      or: () => builder,
      eq: (column: string, value: unknown) => {
        filters[column] = value
        return builder
      },
      update: (values: Row) => {
        operation = 'update'
        payload = values
        return builder
      },
      insert: (values: Row) => {
        operation = 'insert'
        payload = values
        return builder
      },
      delete: () => {
        operation = 'delete'
        return builder
      },
      maybeSingle: () => Promise.resolve({ data: matching()[0] ?? null, error: null }),
      single: () => Promise.resolve({ data: commit()[0] ?? null, error: null }),
      then: (resolve: (value: { data: Row[]; error: null }) => unknown) => Promise.resolve({ data: commit(), error: null }).then(resolve),
    }

    return builder
  }

  return { from }
}
