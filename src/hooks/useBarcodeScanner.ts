'use client'
import { useEffect, useRef } from 'react'

export function useBarcodeScanner(onScan: (barcode: string) => void, enabled = true) {
  const buffer = useRef('')
  const lastKey = useRef(0)

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now()
      const timeDiff = now - lastKey.current
      lastKey.current = now

      // If keys come in very fast (< 50ms apart), it's likely a scanner
      if (timeDiff < 50) {
        if (e.key === 'Enter') {
          if (buffer.current.length > 2) {
            onScan(buffer.current)
          }
          buffer.current = ''
        } else if (e.key.length === 1) {
          buffer.current += e.key
        }
      } else {
        // Too slow — reset buffer (manual typing)
        buffer.current = e.key.length === 1 ? e.key : ''
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onScan, enabled])
}
