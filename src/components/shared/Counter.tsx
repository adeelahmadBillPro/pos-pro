'use client'

import { useEffect, useRef, useState } from 'react'

interface CounterProps {
  value: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
}

/**
 * Smooth count-up number animation. Animates from 0 → value on mount,
 * and re-animates whenever `value` changes.
 */
export function Counter({
  value,
  duration = 900,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}: CounterProps) {
  const [display, setDisplay] = useState(0)
  const startRef = useRef<number | null>(null)
  const fromRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    fromRef.current = display
    startRef.current = null

    function tick(now: number) {
      if (startRef.current === null) startRef.current = now
      const elapsed = now - startRef.current
      const t = Math.min(1, elapsed / duration)
      // Ease-out cubic for natural deceleration
      const eased = 1 - Math.pow(1 - t, 3)
      const current = fromRef.current + (value - fromRef.current) * eased
      setDisplay(current)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration])

  const formatted = decimals > 0
    ? display.toLocaleString('en-PK', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : Math.round(display).toLocaleString('en-PK')

  return (
    <span className={className}>
      {prefix}{formatted}{suffix}
    </span>
  )
}
