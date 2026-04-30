'use client'

import { cn } from '@/lib/utils'

interface Column<T> {
  key: string
  label: string
  render?: (row: T) => React.ReactNode
  className?: string
  mobileHide?: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyField: string
  emptyMessage?: string
  loading?: boolean
  mobileCard?: (row: T) => React.ReactNode
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyField,
  emptyMessage = 'No data found',
  loading = false,
  mobileCard,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        <p className="text-sm">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider',
                    col.className
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row) => (
              <tr key={row[keyField]} className="hover:bg-gray-50 transition-colors">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn('px-4 py-3 text-slate-700', col.className)}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {data.map((row) => (
          <div key={row[keyField]} className="bg-white rounded-xl border border-gray-200 p-4">
            {mobileCard ? (
              mobileCard(row)
            ) : (
              <div className="space-y-2">
                {columns
                  .filter((c) => !c.mobileHide)
                  .map((col) => (
                    <div key={col.key} className="flex justify-between items-start gap-2">
                      <span className="text-xs text-gray-500 flex-shrink-0">{col.label}</span>
                      <span className="text-sm text-slate-900 text-right">
                        {col.render ? col.render(row) : row[col.key]}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
