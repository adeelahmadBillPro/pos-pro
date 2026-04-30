'use client'

import { useState } from 'react'
import { Calendar, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'

interface DateRange {
  from: string
  to: string
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
  className?: string
}

const QUICK_RANGES = [
  { label: 'Today', from: () => format(new Date(), 'yyyy-MM-dd'), to: () => format(new Date(), 'yyyy-MM-dd') },
  { label: 'Yesterday', from: () => format(subDays(new Date(), 1), 'yyyy-MM-dd'), to: () => format(subDays(new Date(), 1), 'yyyy-MM-dd') },
  { label: 'Last 7 days', from: () => format(subDays(new Date(), 6), 'yyyy-MM-dd'), to: () => format(new Date(), 'yyyy-MM-dd') },
  { label: 'Last 30 days', from: () => format(subDays(new Date(), 29), 'yyyy-MM-dd'), to: () => format(new Date(), 'yyyy-MM-dd') },
  { label: 'This month', from: () => format(startOfMonth(new Date()), 'yyyy-MM-dd'), to: () => format(endOfMonth(new Date()), 'yyyy-MM-dd') },
]

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [showQuick, setShowQuick] = useState(false)

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 bg-white">
          <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <input
            type="date"
            value={value.from}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
            className="text-sm bg-transparent outline-none w-32 text-slate-700"
          />
          <span className="text-gray-400 text-sm">—</span>
          <input
            type="date"
            value={value.to}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
            className="text-sm bg-transparent outline-none w-32 text-slate-700"
          />
          {(value.from || value.to) && (
            <button
              onClick={() => onChange({ from: '', to: '' })}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQuick(!showQuick)}
            className="h-9 text-xs"
          >
            Quick
          </Button>

          {showQuick && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-2 z-50 min-w-36">
              {QUICK_RANGES.map((r) => (
                <button
                  key={r.label}
                  onClick={() => {
                    onChange({ from: r.from(), to: r.to() })
                    setShowQuick(false)
                  }}
                  className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
