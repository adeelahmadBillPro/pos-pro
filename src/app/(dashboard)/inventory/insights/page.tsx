'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle, TrendingUp, Package, Loader2,
  Snail, RefreshCw, ShoppingCart, AlertCircle, CheckCircle2,
  Sparkles, Flame, Zap, ArrowUpRight, Filter, ChevronRight,
  Activity, BarChart3, Coins, Box,
} from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { Counter } from '@/components/shared/Counter'

interface InsightProduct {
  id: string
  name: string
  sku: string
  image: string | null
  category: { id: string; name: string } | null
  stock: number
  minStock: number
  unit: string
  price: number
  costPrice: number
  stockValueCost: number
  stockValueRetail: number
  sold30d: number
  avgPerDay: number
  daysLeft: number | null
  bucket: 'URGENT' | 'LOW' | 'HEALTHY' | 'DEAD' | 'NEW'
  recommendedOrderQty: number
}

interface InsightData {
  summary: {
    totalProducts: number
    outOfStock: number
    urgent: number
    low: number
    deadStock: number
    totalValueCost: number
    totalValueRetail: number
    potentialProfit: number
  }
  urgent: InsightProduct[]
  low: InsightProduct[]
  fastMovers: InsightProduct[]
  deadStock: InsightProduct[]
  byCategory: { id: string; name: string; sold: number; stockValue: number; products: number }[]
  windowDays: number
}

type Bucket = 'urgent' | 'low' | 'healthy' | 'dead' | 'fast'

export default function InsightsPage() {
  const [data, setData] = useState<InsightData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeBucket, setActiveBucket] = useState<Bucket>('urgent')
  const [allProducts, setAllProducts] = useState<InsightProduct[]>([])

  async function load() {
    try {
      const res = await fetch('/api/inventory/insights', { cache: 'no-store' })
      const json = await res.json()
      if (json.success) {
        setData(json.data)
        // Combine all products for healthy filter (we need products NOT in urgent/low/dead)
        const allBuckets = [...json.data.urgent, ...json.data.low, ...json.data.fastMovers, ...json.data.deadStock]
        const seen = new Set<string>()
        const unique: InsightProduct[] = []
        allBuckets.forEach(p => { if (!seen.has(p.id)) { seen.add(p.id); unique.push(p) } })
        setAllProducts(unique)
      }
    } catch {} finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  function refresh() {
    setRefreshing(true)
    load()
  }

  const visibleProducts = useMemo(() => {
    if (!data) return []
    if (activeBucket === 'urgent') return data.urgent
    if (activeBucket === 'low') return data.low
    if (activeBucket === 'fast') return data.fastMovers
    if (activeBucket === 'dead') return data.deadStock
    if (activeBucket === 'healthy') {
      // Healthy = fastMovers minus those already in urgent/low/dead
      const flagged = new Set([
        ...data.urgent.map(p => p.id),
        ...data.low.map(p => p.id),
        ...data.deadStock.map(p => p.id),
      ])
      return data.fastMovers.filter(p => !flagged.has(p.id))
    }
    return []
  }, [activeBucket, data])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Crunching your inventory numbers…</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-16 text-gray-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        Could not load inventory insights.
      </div>
    )
  }

  const { summary } = data
  const healthyCount = Math.max(0, summary.totalProducts - summary.urgent - summary.low - summary.deadStock - summary.outOfStock)

  // Hero alert message — most pressing item
  const heroMessage = (() => {
    if (summary.outOfStock > 0) {
      return {
        icon: <AlertCircle className="w-6 h-6" />,
        title: `${summary.outOfStock} product${summary.outOfStock > 1 ? 's' : ''} out of stock!`,
        sub: 'These are losing you sales right now. Order today.',
        accent: 'rose' as const,
        action: { label: 'Fix now', bucket: 'urgent' as Bucket },
      }
    }
    if (summary.urgent > 0) {
      return {
        icon: <Flame className="w-6 h-6" />,
        title: `${summary.urgent} product${summary.urgent > 1 ? 's' : ''} running out in 7 days`,
        sub: 'Place purchase order before stock hits zero.',
        accent: 'amber' as const,
        action: { label: 'Review urgent', bucket: 'urgent' as Bucket },
      }
    }
    if (summary.deadStock > 0) {
      return {
        icon: <Snail className="w-6 h-6" />,
        title: `${formatCurrency(data.deadStock.reduce((s, p) => s + p.stockValueCost, 0))} tied up in dead stock`,
        sub: 'Consider clearance or bundle deals to free up cash.',
        accent: 'slate' as const,
        action: { label: 'View dead stock', bucket: 'dead' as Bucket },
      }
    }
    return {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'Inventory looking healthy!',
      sub: 'No urgent restocks needed. Keep an eye on fast movers.',
      accent: 'emerald' as const,
      action: { label: 'See top sellers', bucket: 'fast' as Bucket },
    }
  })()

  const heroStyles = {
    rose:    'from-rose-500 to-rose-700',
    amber:   'from-amber-500 to-orange-600',
    slate:   'from-slate-600 to-slate-800',
    emerald: 'from-emerald-500 to-teal-600',
  }[heroMessage.accent]

  return (
    <div className="space-y-5">
      {/* ── Hero alert banner ── */}
      <div className={cn('relative rounded-3xl bg-gradient-to-br p-5 sm:p-6 text-white overflow-hidden shadow-lg', heroStyles)}>
        {/* Decorative blob */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 -left-12 w-56 h-56 bg-white/5 rounded-full blur-3xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
              {heroMessage.icon}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold leading-tight">{heroMessage.title}</h1>
              <p className="text-sm text-white/80 mt-1">{heroMessage.sub}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={refresh}
              disabled={refreshing}
              className="h-10 w-10 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur flex items-center justify-center transition-colors"
              title="Refresh data"
            >
              <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
            </button>
            <button
              onClick={() => setActiveBucket(heroMessage.action.bucket)}
              className="h-10 px-4 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-white/90 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
            >
              {heroMessage.action.label}
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Big metric tiles — clickable to filter ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <MetricTile
          icon={<AlertCircle className="w-5 h-5" />}
          label="Urgent"
          value={summary.urgent + summary.outOfStock}
          subtitle={summary.outOfStock > 0 ? `incl. ${summary.outOfStock} out` : 'order today'}
          accent="rose"
          active={activeBucket === 'urgent'}
          onClick={() => setActiveBucket('urgent')}
        />
        <MetricTile
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Low Stock"
          value={summary.low}
          subtitle="order this week"
          accent="amber"
          active={activeBucket === 'low'}
          onClick={() => setActiveBucket('low')}
        />
        <MetricTile
          icon={<Flame className="w-5 h-5" />}
          label="Top Sellers"
          value={data.fastMovers.length}
          subtitle="last 30 days"
          accent="violet"
          active={activeBucket === 'fast'}
          onClick={() => setActiveBucket('fast')}
        />
        <MetricTile
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Healthy"
          value={healthyCount}
          subtitle="all good"
          accent="emerald"
          active={activeBucket === 'healthy'}
          onClick={() => setActiveBucket('healthy')}
        />
        <MetricTile
          icon={<Snail className="w-5 h-5" />}
          label="Dead Stock"
          value={summary.deadStock}
          subtitle="0 sales in 30 days"
          accent="slate"
          active={activeBucket === 'dead'}
          onClick={() => setActiveBucket('dead')}
        />
      </div>

      {/* ── Capital strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <CapitalCard
          icon={<Box className="w-5 h-5" />}
          label="Stock at cost"
          value={summary.totalValueCost}
          accent="from-slate-100 to-slate-50 border-slate-200 text-slate-700"
        />
        <CapitalCard
          icon={<Coins className="w-5 h-5" />}
          label="Stock at retail"
          value={summary.totalValueRetail}
          accent="from-teal-100 to-teal-50 border-teal-200 text-teal-700"
        />
        <CapitalCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Potential profit"
          value={summary.potentialProfit}
          accent="from-emerald-100 to-emerald-50 border-emerald-200 text-emerald-700"
        />
      </div>

      {/* ── Filter tabs (mobile) + section title ── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <BucketIcon bucket={activeBucket} />
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900 text-base">{bucketTitle(activeBucket)}</h2>
              <p className="text-xs text-gray-500 truncate">{bucketSubtitle(activeBucket)}</p>
            </div>
          </div>
          <span className="bg-slate-900 text-white text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0">
            {visibleProducts.length}
          </span>
        </div>

        {visibleProducts.length === 0 ? (
          <EmptyState bucket={activeBucket} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3">
            {visibleProducts.map((p) => (
              <ProductCard key={p.id} p={p} bucket={activeBucket} />
            ))}
          </div>
        )}
      </div>

      {/* ── Category performance ── */}
      {data.byCategory.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-600" />
            <h2 className="font-bold text-slate-900">Category Performance</h2>
          </div>
          <div className="p-4 space-y-2.5">
            {(() => {
              const maxSold = Math.max(...data.byCategory.map((c) => c.sold), 1)
              return data.byCategory.map((c) => (
                <div key={c.id} className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-slate-800 truncate">{c.name}</span>
                    <div className="flex items-center gap-3 text-xs flex-shrink-0">
                      <span className="text-slate-700 font-semibold tabular-nums">{c.sold} sold</span>
                      <span className="text-gray-400 tabular-nums">{formatCurrency(c.stockValue)}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500"
                      style={{ width: `${(c.sold / maxSold) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            })()}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── helpers ───────────────────────────────────────────────────────────

function bucketTitle(b: Bucket): string {
  switch (b) {
    case 'urgent':  return 'Order Today'
    case 'low':     return 'Order This Week'
    case 'fast':    return 'Top Sellers'
    case 'healthy': return 'Healthy Stock'
    case 'dead':    return 'Dead Stock — capital tied up'
  }
}

function bucketSubtitle(b: Bucket): string {
  switch (b) {
    case 'urgent':  return 'Out of stock or running out within 7 days'
    case 'low':     return 'Days left between 7 and 14 — order this week'
    case 'fast':    return 'Bestsellers in the last 30 days'
    case 'healthy': return 'Selling well, plenty of stock'
    case 'dead':    return 'No sales in 30 days. Consider clearance or bundles.'
  }
}

function BucketIcon({ bucket }: { bucket: Bucket }) {
  const map: Record<Bucket, { icon: React.ReactNode; bg: string }> = {
    urgent:  { icon: <AlertCircle className="w-4 h-4" />,  bg: 'bg-rose-100 text-rose-700' },
    low:     { icon: <AlertTriangle className="w-4 h-4" />, bg: 'bg-amber-100 text-amber-700' },
    fast:    { icon: <Flame className="w-4 h-4" />,         bg: 'bg-violet-100 text-violet-700' },
    healthy: { icon: <CheckCircle2 className="w-4 h-4" />,  bg: 'bg-emerald-100 text-emerald-700' },
    dead:    { icon: <Snail className="w-4 h-4" />,         bg: 'bg-slate-200 text-slate-700' },
  }
  const m = map[bucket]
  return (
    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', m.bg)}>
      {m.icon}
    </div>
  )
}

function MetricTile({
  icon, label, value, subtitle, accent, active, onClick,
}: {
  icon: React.ReactNode
  label: string
  value: number
  subtitle: string
  accent: 'rose' | 'amber' | 'violet' | 'emerald' | 'slate'
  active: boolean
  onClick: () => void
}) {
  const styles: Record<string, { bg: string; ring: string; text: string; chip: string }> = {
    rose:    { bg: 'bg-rose-50',    ring: 'ring-rose-300',    text: 'text-rose-700',    chip: 'bg-rose-500' },
    amber:   { bg: 'bg-amber-50',   ring: 'ring-amber-300',   text: 'text-amber-700',   chip: 'bg-amber-500' },
    violet:  { bg: 'bg-violet-50',  ring: 'ring-violet-300',  text: 'text-violet-700',  chip: 'bg-violet-500' },
    emerald: { bg: 'bg-emerald-50', ring: 'ring-emerald-300', text: 'text-emerald-700', chip: 'bg-emerald-500' },
    slate:   { bg: 'bg-slate-50',   ring: 'ring-slate-300',   text: 'text-slate-700',   chip: 'bg-slate-500' },
  }
  const s = styles[accent]
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative rounded-2xl border-2 p-4 text-left transition-all duration-200 active:scale-95 transform-gpu',
        active
          ? `${s.bg} border-current ${s.text} ring-4 ${s.ring} shadow-md scale-[1.02]`
          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm hover:-translate-y-0.5',
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-white', s.chip)}>
          {icon}
        </div>
        {active && <ArrowUpRight className="w-4 h-4" />}
      </div>
      <p className={cn('text-3xl font-bold tabular-nums leading-none', active ? s.text : 'text-slate-900')}>
        <Counter value={value} />
      </p>
      <p className={cn('text-sm font-semibold mt-2', active ? s.text : 'text-slate-700')}>{label}</p>
      <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
    </button>
  )
}

function CapitalCard({
  icon, label, value, accent,
}: { icon: React.ReactNode; label: string; value: number; accent: string }) {
  return (
    <div className={cn('rounded-2xl border bg-gradient-to-br p-4 flex items-center gap-3', accent)}>
      <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{label}</p>
        <p className="text-xl font-bold tabular-nums leading-tight">
          <Counter value={value} prefix="Rs " />
        </p>
      </div>
    </div>
  )
}

function ProductCard({ p, bucket }: { p: InsightProduct; bucket: Bucket }) {
  // Days-left bar: 0–30 days range mapped to 0-100%
  const daysBarPct = p.daysLeft === null
    ? 0
    : Math.min(100, Math.max(0, (p.daysLeft / 30) * 100))

  const barColor = p.daysLeft === null
    ? 'bg-slate-300'
    : p.daysLeft <= 7
    ? 'bg-rose-500'
    : p.daysLeft <= 14
    ? 'bg-amber-500'
    : 'bg-emerald-500'

  return (
    <div className="rounded-xl border border-gray-200 hover:border-amber-300 hover:shadow-md transition-all p-3 bg-white group">
      <div className="flex items-start gap-3">
        {/* Image */}
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-50 to-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
          {p.image ? (
            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-6 h-6 text-amber-300" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-slate-900 truncate text-sm">{p.name}</p>
            {p.category && (
              <span className="text-[10px] font-medium text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded uppercase tracking-wide">
                {p.category.name}
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5 font-mono">{p.sku}</p>

          {/* Body — varies by bucket */}
          {bucket === 'fast' || bucket === 'healthy' ? (
            <div className="mt-2 grid grid-cols-3 gap-1 text-xs">
              <Stat label="Sold/day" value={`${p.avgPerDay}`} accent="violet" />
              <Stat label="Stock" value={`${p.stock}`} accent="slate" />
              <Stat label="30d sold" value={`${p.sold30d}`} accent="emerald" />
            </div>
          ) : bucket === 'dead' ? (
            <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
              <Stat label="Stock" value={`${p.stock} ${p.unit}`} accent="slate" />
              <Stat label="Capital" value={formatCurrency(p.stockValueCost)} accent="rose" />
            </div>
          ) : (
            // urgent / low
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-700 font-medium">
                  {p.stock === 0 ? (
                    <span className="text-rose-700 font-bold">Out of stock!</span>
                  ) : p.daysLeft !== null ? (
                    <>
                      <span className={p.daysLeft <= 7 ? 'text-rose-700 font-bold' : 'text-amber-700 font-semibold'}>
                        {p.daysLeft === 0 ? 'Out today' : `${p.daysLeft} day${p.daysLeft !== 1 ? 's' : ''} left`}
                      </span>
                    </>
                  ) : (
                    <span>{p.stock} {p.unit} left</span>
                  )}
                </span>
                <span className="text-gray-500 tabular-nums">{p.avgPerDay}/day</span>
              </div>
              {p.daysLeft !== null && (
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={cn('h-full transition-all', barColor)} style={{ width: `${daysBarPct}%` }} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {(bucket === 'urgent' || bucket === 'low') && p.recommendedOrderQty > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <Link
            href={`/inventory?search=${encodeURIComponent(p.sku)}`}
            className={cn(
              'flex-1 h-9 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-95 transform-gpu',
              bucket === 'urgent'
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-amber-500 hover:bg-amber-600 text-slate-900',
            )}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Order {p.recommendedOrderQty} {p.unit}
          </Link>
          <Link
            href={`/products/${p.id}/edit`}
            className="h-9 w-9 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500 hover:text-slate-900 transition-colors"
            title="Edit product"
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
      {bucket === 'dead' && (
        <div className="mt-3 flex items-center gap-2">
          <Link
            href={`/discounts`}
            className="flex-1 h-9 px-3 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-900 flex items-center justify-center gap-1.5 transition-colors active:scale-95 transform-gpu"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Create discount
          </Link>
          <Link
            href={`/products/${p.id}/edit`}
            className="h-9 w-9 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500 hover:text-slate-900 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  const colors: Record<string, string> = {
    violet:  'bg-violet-50 text-violet-700',
    slate:   'bg-slate-50 text-slate-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    rose:    'bg-rose-50 text-rose-700',
  }
  return (
    <div className={cn('rounded-md px-2 py-1', colors[accent])}>
      <p className="text-[9px] font-medium uppercase tracking-wide opacity-80 leading-none">{label}</p>
      <p className="font-semibold mt-0.5 leading-none">{value}</p>
    </div>
  )
}

function EmptyState({ bucket }: { bucket: Bucket }) {
  const messages: Record<Bucket, { icon: React.ReactNode; title: string; sub: string }> = {
    urgent:  { icon: <CheckCircle2 className="w-12 h-12 text-emerald-400" />, title: 'All clear!', sub: 'No products need urgent restocking. Great work.' },
    low:     { icon: <CheckCircle2 className="w-12 h-12 text-emerald-400" />, title: 'Nothing low', sub: 'No products in the warning zone.' },
    fast:    { icon: <Activity className="w-12 h-12 text-gray-300" />,        title: 'No sales yet', sub: 'Top movers will appear once you start selling.' },
    healthy: { icon: <CheckCircle2 className="w-12 h-12 text-emerald-400" />, title: 'Building up', sub: 'Healthy products will appear here once you have history.' },
    dead:    { icon: <Sparkles className="w-12 h-12 text-emerald-400" />,     title: 'No dead stock', sub: 'Great inventory turnover — every product is moving.' },
  }
  const m = messages[bucket]
  return (
    <div className="px-6 py-12 flex flex-col items-center text-center">
      {m.icon}
      <p className="text-base font-semibold text-slate-700 mt-3">{m.title}</p>
      <p className="text-sm text-gray-500 mt-1 max-w-xs">{m.sub}</p>
    </div>
  )
}
