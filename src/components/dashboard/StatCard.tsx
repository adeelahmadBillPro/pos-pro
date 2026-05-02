'use client'

import { Counter } from '@/components/shared/Counter'
import {
  TrendingUp,
  ShoppingBag,
  Users,
  AlertTriangle,
  Package,
  CreditCard,
  DollarSign,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const iconMap: Record<string, LucideIcon> = {
  trendingUp: TrendingUp,
  shoppingBag: ShoppingBag,
  users: Users,
  alertTriangle: AlertTriangle,
  package: Package,
  creditCard: CreditCard,
  dollarSign: DollarSign,
}

export type StatIconName = keyof typeof iconMap

interface StatCardProps {
  title: string
  value: number
  iconName: StatIconName
  variant: 'amber' | 'teal' | 'rose' | 'violet' | 'emerald'
  prefix?: string
  decimals?: number
  delay?: number
}

const variantStyles = {
  amber:   { card: 'stat-card-gradient-amber',   icon: 'bg-amber-200 text-amber-700',     accent: 'text-amber-700' },
  teal:    { card: 'stat-card-gradient-teal',    icon: 'bg-teal-200 text-teal-700',       accent: 'text-teal-700' },
  rose:    { card: 'stat-card-gradient-rose',    icon: 'bg-rose-200 text-rose-700',       accent: 'text-rose-700' },
  violet:  { card: 'stat-card-gradient-violet',  icon: 'bg-violet-200 text-violet-700',   accent: 'text-violet-700' },
  emerald: { card: 'stat-card-gradient-emerald', icon: 'bg-emerald-200 text-emerald-700', accent: 'text-emerald-700' },
}

export function StatCard({
  title,
  value,
  iconName,
  variant,
  prefix = '',
  decimals = 0,
  delay = 0,
}: StatCardProps) {
  const styles = variantStyles[variant]
  const Icon = iconMap[iconName]
  return (
    <div
      className={cn(
        'rounded-2xl p-5 card-hover animate-slide-up',
        styles.card,
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-600 truncate uppercase tracking-wide">
            {title}
          </p>
          <p className={cn('text-2xl font-bold mt-2 truncate tabular-nums', styles.accent)}>
            <Counter value={value} prefix={prefix} decimals={decimals} />
          </p>
        </div>
        <div className={cn('p-2.5 rounded-xl flex-shrink-0', styles.icon)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}
