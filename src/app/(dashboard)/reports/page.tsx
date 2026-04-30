'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart3, TrendingUp, ShoppingBag, DollarSign, Loader2, Download } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { DateRangePicker } from '@/components/shared/DateRangePicker'
import { ExportButton } from '@/components/shared/ExportButton'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { format, subDays } from 'date-fns'

interface ReportData {
  summary: {
    totalRevenue: number
    totalOrders: number
    avgOrderValue: number
    totalTax: number
    totalDiscount: number
  }
  dailyData: Array<{
    date: string
    label: string
    revenue: number
    orders: number
    avgOrderValue: number
  }>
  paymentBreakdown: Array<{ method: string; total: number; count: number }>
  topProducts: Array<{ productId: string; name: string; quantity: number; revenue: number }>
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    from: format(subDays(new Date(), 29), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
  })

  const loadReport = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateRange.from) params.set('from', dateRange.from)
      if (dateRange.to) params.set('to', dateRange.to)

      const res = await fetch(`/api/reports/sales?${params}`)
      const result = await res.json()
      if (result.success) setData(result.data)
    } catch {
      toast.error('Failed to load report')
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => { loadReport() }, [loadReport])

  const stats = data
    ? [
        { title: 'Total Revenue', value: formatCurrency(data.summary.totalRevenue), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
        { title: 'Total Orders', value: data.summary.totalOrders.toString(), icon: ShoppingBag, color: 'text-violet-600', bg: 'bg-violet-50' },
        { title: 'Avg Order Value', value: formatCurrency(data.summary.avgOrderValue), icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
        { title: 'Total Discount', value: formatCurrency(data.summary.totalDiscount), icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50' },
      ]
    : []

  const paymentMethodColors: Record<string, string> = {
    CASH: '#22c55e',
    CARD: '#3b82f6',
    JAZZCASH: '#ef4444',
    EASYPAISA: '#f59e0b',
    BANK_TRANSFER: '#8b5cf6',
    STORE_CREDIT: '#64748b',
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Sales analytics and insights"
        actions={
          data && (
            <ExportButton
              data={data.dailyData.map((d) => ({
                date: d.date,
                revenue: d.revenue,
                orders: d.orders,
                avgOrderValue: d.avgOrderValue,
              }))}
              filename="sales-report"
              label="Export CSV"
            />
          )
        }
      />

      {/* Date range picker */}
      <div className="flex items-center gap-3 flex-wrap">
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        {loading && <Loader2 className="w-4 h-4 animate-spin text-violet-600" />}
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 h-24 animate-pulse bg-gray-100" />
            ))}
          </div>
        </div>
      ) : !data ? (
        <div className="text-center py-16 text-gray-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No report data available</p>
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.title} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-gray-500">{s.title}</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">{s.value}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${s.bg}`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Revenue Trend</h3>
            {data.dailyData.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">No sales data for this period</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']}
                    labelStyle={{ color: '#1e293b' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ fill: '#2563eb', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-slate-900 mb-4">Top Products</h3>
              {data.topProducts.length === 0 ? (
                <p className="text-center text-gray-400 py-4 text-sm">No products sold</p>
              ) : (
                <div className="space-y-3">
                  {data.topProducts.map((p, i) => (
                    <div key={p.productId} className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-400 w-5 text-center">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.quantity} sold</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{formatCurrency(p.revenue)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment methods */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-slate-900 mb-4">Payment Methods</h3>
              {data.paymentBreakdown.length === 0 ? (
                <p className="text-center text-gray-400 py-4 text-sm">No payment data</p>
              ) : (
                <div className="space-y-3">
                  {data.paymentBreakdown.map((p) => {
                    const totalRevenue = data.paymentBreakdown.reduce((s, b) => s + b.total, 0)
                    const pct = totalRevenue > 0 ? (p.total / totalRevenue) * 100 : 0
                    return (
                      <div key={p.method}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-slate-700">{p.method}</span>
                          <div className="flex gap-3 text-gray-500">
                            <span>{p.count} txns</span>
                            <span className="font-medium text-slate-900">{formatCurrency(p.total)}</span>
                          </div>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: paymentMethodColors[p.method] || '#94a3b8',
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
