'use client'

import { useRef, useEffect, useState } from 'react'

interface RevealProps {
  children: React.ReactNode
  direction?: 'up' | 'left' | 'right' | 'fade'
  delay?: number
  className?: string
}

export function Reveal({ children, direction = 'up', delay = 0, className = '' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [played, setPlayed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const run = () => {
      const rect = el.getBoundingClientRect()
      const inView = rect.top < window.innerHeight + 80 && rect.bottom > 0
      if (inView && !played) {
        setPlayed(true)
      }
    }

    // Check immediately + on scroll
    run()
    window.addEventListener('scroll', run, { passive: true })
    window.addEventListener('resize', run, { passive: true })
    return () => {
      window.removeEventListener('scroll', run)
      window.removeEventListener('resize', run)
    }
  }, [played])

  const animClass = played
    ? `reveal-done reveal-${direction}`
    : `reveal-waiting reveal-${direction}`

  return (
    <div
      ref={ref}
      className={`${className} ${animClass}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
