'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchInput } from '@/components/shared/SearchInput'
import { formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'

interface AuditLog {
  id: string
  action: string
  entity: string
  entityId: string | null
  oldValues: Record<string, unknown> | null
  newValues: Record<string, unknown> | null
  createdAt: string
  user: { id: string; name: string; email: string; role: string }
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  DEACTIVATE: 'bg-orange-100 text-orange-700',
  LOGIN: 'bg-purple-100 text-purple-700',
  CLOCK_IN: 'bg-teal-100 text-teal-700',
  CLOCK_OUT: 'bg-slate-100 text-slate-600',
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ pages: 1, total: 0 })
  const [entities, setEntities] = useState<string[]>([])
  const [entityFilter, setEntityFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (entityFilter) params.set('entity', entityFilter)
      if (actionFilter) params.set('action', actionFilter)

      const res = await fetch(`/api/audit?${params}`)
      const data = await res.json()
      if (data.success) {
        setLogs(data.data)
        setPagination(data.pagination)
        if (data.entities?.length) setEntities(data.entities)
      }
    } catch {
      toast.error('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }, [page, entityFilter, actionFilter])

  useEffect(() => { load() }, [load])

  const actionBadge = (action: string) => (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${ACTION_COLORS[action] || 'bg-gray-100 text-gray-600'}`}>
      {action}
    </span>
  )

  return (
    <div>
      <PageHeader
        title="Audit Log"
        description={`${pagination.total} events recorded`}
        actions={
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span className="text-xs text-gray-500">All actions are logged automatically</span>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={entityFilter}
          onChange={(e) => { setEntityFilter(e.target.value); setPage(1) }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-700"
        >
          <option value="">All Entities</option>
          {entities.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-700"
        >
          <option value="">All Actions</option>
          {['CREATE', 'UPDATE', 'DELETE', 'DEACTIVATE', 'LOGIN', 'CLOCK_IN', 'CLOCK_OUT'].map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-4 py-3 animate-pulse flex gap-3">
                <div className="w-16 h-5 bg-gray-100 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
                <div className="w-28 h-3 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <ShieldCheck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No audit events found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {logs.map((log) => {
              const isExpanded = expandedId === log.id
              const hasDetails = log.oldValues || log.newValues

              return (
                <div key={log.id} className="px-4 py-3">
                  <div
                    className={`flex items-start gap-3 ${hasDetails ? 'cursor-pointer' : ''}`}
                    onClick={() => hasDetails && setExpandedId(isExpanded ? null : log.id)}
                  >
                    {/* Action badge */}
                    <div className="flex-shrink-0 pt-0.5">
                      {actionBadge(log.action)}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900">
                        <span className="font-medium">{log.user.name}</span>
                        <span className="text-gray-400 mx-1">·</span>
                        <span className="text-gray-600">{log.entity}</span>
                        {log.entityId && (
                          <span className="text-gray-400 text-xs ml-1 font-mono">#{log.entityId.slice(-6)}</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{log.user.email} · {log.user.role}</p>
                    </div>

                    {/* Time */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-gray-400">{formatDateTime(log.createdAt)}</p>
                      {hasDetails && (
                        <p className="text-[10px] text-teal-600 mt-0.5">{isExpanded ? 'Hide' : 'Details'}</p>
                      )}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && hasDetails && (
                    <div className="mt-3 ml-16 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {log.oldValues && (
                        <div className="bg-red-50 rounded-lg p-3">
                          <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wide mb-1.5">Before</p>
                          <pre className="text-xs text-red-700 whitespace-pre-wrap break-all font-mono">
                            {JSON.stringify(log.oldValues, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.newValues && (
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wide mb-1.5">After</p>
                          <pre className="text-xs text-green-700 whitespace-pre-wrap break-all font-mono">
                            {JSON.stringify(log.newValues, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Page {page} of {pagination.pages} ({pagination.total} total)
            </p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="h-7 w-7 p-0">
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)} className="h-7 w-7 p-0">
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
