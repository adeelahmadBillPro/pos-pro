import { Skeleton } from '@/components/ui/skeleton'
import { ShoppingBag } from 'lucide-react'

// ── Branded spinner (same style as page splash loader) ──────────────────────
export function Spinner({ size = 'md', label }: { size?: 'sm' | 'md' | 'lg'; label?: string }) {
  const box = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-20 h-20' : 'w-12 h-12'
  const icon = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-6 h-6'
  const ring = size === 'sm' ? '-inset-1.5 rounded-[14px]' : size === 'lg' ? '-inset-3 rounded-[26px]' : '-inset-2 rounded-[18px]'

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div className={`${box} rounded-xl bg-amber-400 flex items-center justify-center`}>
          <ShoppingBag className={`${icon} text-slate-900`} />
        </div>
        <div className={`absolute ${ring} border-2 border-transparent border-t-amber-400 border-r-teal-500 animate-spin`} />
      </div>
      {label && <p className="text-sm text-slate-400 font-medium">{label}</p>}
    </div>
  )
}

// ── Full-page centered spinner ───────────────────────────────────────────────
export function PageSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Spinner size="md" label={label} />
    </div>
  )
}

// ── Inline button / small spinner ────────────────────────────────────────────
export function InlineSpinner() {
  return (
    <div className="w-4 h-4 rounded border-2 border-current border-t-transparent animate-spin" />
  )
}

// ── Table skeleton — header + rows ──────────────────────────────────────────
export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="hidden md:flex gap-4 px-4 py-3 border-b border-gray-200 bg-gray-50">
        {[...Array(cols)].map((_, j) => (
          <Skeleton key={j} className="h-3 flex-1 rounded" />
        ))}
      </div>
      {/* Rows — desktop */}
      <div className="hidden md:block divide-y divide-gray-100">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3 items-center">
            {[...Array(cols)].map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1 rounded" />
            ))}
          </div>
        ))}
      </div>
      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-gray-100">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3 rounded" />
              <Skeleton className="h-3 w-1/3 rounded" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Stat cards skeleton (dashboard) ─────────────────────────────────────────
export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="w-8 h-8 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-28 rounded" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
      ))}
    </div>
  )
}

// ── Card skeleton ─────────────────────────────────────────────────────────────
export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-8 w-32 rounded" />
        </div>
      ))}
    </div>
  )
}

// ── Form skeleton ─────────────────────────────────────────────────────────────
export function FormSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {[...Array(fields)].map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
    </div>
  )
}

// ── Product grid skeleton (POS) ─────────────────────────────────────────────
export function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-3 space-y-2">
          <Skeleton className="aspect-square rounded-lg w-full" />
          <Skeleton className="h-3 w-3/4 rounded" />
          <Skeleton className="h-4 w-1/2 rounded" />
        </div>
      ))}
    </div>
  )
}

// ── Empty list with branded look ────────────────────────────────────────────
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-1/2 rounded" />
            <Skeleton className="h-3 w-1/3 rounded" />
          </div>
          <Skeleton className="h-7 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  )
}
