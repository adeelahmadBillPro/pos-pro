'use client'

import { useState, useEffect } from 'react'
import { Check, Zap, Building2, Phone, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Plan {
  id: string
  name: string
  description: string | null
  monthlyPrice: number
  yearlyPrice: number
  maxProducts: number
  maxUsers: number
  maxOrders: number
  features: string[]
  sortOrder: number
}

export default function PlansPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [yearly, setYearly] = useState(false)

  useEffect(() => {
    fetch('/api/billing/plans')
      .then((r) => r.json())
      .then((data) => { if (data.success) setPlans(data.data) })
      .catch(() => toast.error('Failed to load plans'))
      .finally(() => setLoading(false))
  }, [])

  function handleSelect(plan: Plan) {
    const price = yearly ? plan.yearlyPrice / 12 : plan.monthlyPrice
    router.push(`/billing/pay?planId=${plan.id}&monthly=${Math.round(price)}&yearly=${yearly}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  // Add Enterprise plan manually
  const allPlans = [
    ...plans,
  ]

  return (
    <div>
      <PageHeader
        title="Choose Your Plan"
        description="Upgrade to unlock all features"
        breadcrumbs={[{ label: 'Billing', href: '/billing' }, { label: 'Plans' }]}
      />

      {/* Yearly toggle */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <button
          onClick={() => setYearly(false)}
          className={cn(
            'text-sm font-medium px-4 py-2 rounded-lg transition-colors',
            !yearly ? 'bg-violet-600 text-white' : 'text-gray-600 hover:bg-gray-100'
          )}
        >
          Monthly
        </button>
        <button
          onClick={() => setYearly(true)}
          className={cn(
            'text-sm font-medium px-4 py-2 rounded-lg transition-colors',
            yearly ? 'bg-violet-600 text-white' : 'text-gray-600 hover:bg-gray-100'
          )}
        >
          Yearly
          <span className="ml-1.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Save 20%</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {/* Trial Plan */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <Zap className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Free Trial</h3>
              <p className="text-xs text-gray-400">14 days free</p>
            </div>
          </div>
          <div className="mb-6">
            <span className="text-3xl font-bold text-slate-900">Rs 0</span>
          </div>
          <ul className="space-y-2.5 mb-6">
            {['100 products', '3 staff accounts', '500 orders', 'Basic reports', 'POS terminal'].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <Button variant="outline" className="w-full" disabled>
            Current (Trial)
          </Button>
        </div>

        {/* Dynamic plans from DB */}
        {plans.map((plan, i) => {
          const price = yearly ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice
          const isPopular = i === 0 || plan.name.toLowerCase().includes('business')

          return (
            <div
              key={plan.id}
              className={cn(
                'bg-white rounded-2xl border-2 p-6 relative',
                isPopular ? 'border-blue-500 shadow-blue-100 shadow-lg' : 'border-gray-200'
              )}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-violet-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  isPopular ? 'bg-violet-100' : 'bg-gray-100'
                )}>
                  <Building2 className={cn('w-5 h-5', isPopular ? 'text-violet-600' : 'text-gray-600')} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{plan.name}</h3>
                  {plan.description && <p className="text-xs text-gray-400">{plan.description}</p>}
                </div>
              </div>

              <div className="mb-6">
                <span className="text-3xl font-bold text-slate-900">{formatCurrency(price)}</span>
                <span className="text-gray-400 text-sm">/mo</span>
                {yearly && (
                  <p className="text-xs text-green-600 mt-0.5">
                    {formatCurrency(plan.yearlyPrice)}/year (save {formatCurrency(plan.monthlyPrice * 12 - plan.yearlyPrice)})
                  </p>
                )}
              </div>

              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    {f}
                  </li>
                ))}
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  {plan.maxProducts === -1 ? 'Unlimited' : plan.maxProducts.toLocaleString()} products
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  {plan.maxUsers} staff accounts
                </li>
              </ul>

              <Button
                className={cn(
                  'w-full',
                  isPopular ? 'bg-violet-600 hover:bg-violet-700 text-white' : ''
                )}
                variant={isPopular ? 'default' : 'outline'}
                onClick={() => handleSelect(plan)}
              >
                Get Started
              </Button>
            </div>
          )
        })}

        {/* Enterprise Plan */}
        <div className="bg-slate-900 rounded-2xl border-2 border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">Enterprise</h3>
              <p className="text-xs text-slate-400">Custom solution</p>
            </div>
          </div>
          <div className="mb-6">
            <span className="text-3xl font-bold text-white">Contact Us</span>
          </div>
          <ul className="space-y-2.5 mb-6">
            {['Unlimited everything', 'Dedicated support', 'Custom integrations', 'Multi-store', 'API access', 'SLA guarantee'].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <a href="https://wa.me/923001234567" target="_blank" rel="noopener noreferrer">
            <Button className="w-full bg-white text-slate-900 hover:bg-gray-100">
              Contact Sales
            </Button>
          </a>
        </div>
      </div>
    </div>
  )
}
