import { cn } from '@/lib/utils'

type StatusVariant =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'processing'
  | 'approved'
  | 'rejected'
  | 'trial'
  | 'expired'
  | 'low'
  | 'out'
  | 'ok'
  | 'suspended'

const variantStyles: Record<StatusVariant | string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  pending: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-purple-100 text-purple-700',
  processing: 'bg-violet-100 text-violet-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  trial: 'bg-amber-100 text-amber-700',
  expired: 'bg-red-100 text-red-700',
  low: 'bg-amber-100 text-amber-700',
  out: 'bg-red-100 text-red-700',
  ok: 'bg-green-100 text-green-700',
  suspended: 'bg-orange-100 text-orange-700',
}

interface StatusBadgeProps {
  status: string
  label?: string
  className?: string
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const key = status.toLowerCase() as StatusVariant
  const styles = variantStyles[key] || 'bg-gray-100 text-gray-600'

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
        styles,
        className
      )}
    >
      {label || status}
    </span>
  )
}
