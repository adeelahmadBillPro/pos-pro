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

// ── Table skeleton ────────────────────────────────────────────────────────────
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4">
          {[...Array(cols)].map((_, j) => (
            <Skeleton key={j} className="h-10 flex-1 rounded-lg" />
          ))}
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
