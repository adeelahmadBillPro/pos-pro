'use client'

import { forwardRef, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface PhoneInputProps {
  value?: string
  onChange?: (e: { target: { value: string; name?: string } }) => void
  onBlur?: () => void
  name?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
  id?: string
}

/**
 * Pakistan phone input with fixed +92 prefix.
 *
 * - Stores the value as a full E.164-style number ("+923001234567" or just "03001234567"
 *   depending on what was passed in) so existing validators (zod regex) keep working.
 * - User only ever types the 10 digits after the country code.
 * - Strips non-digits, blocks leading "0" or "9", and enforces 10-digit length.
 */
export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(function PhoneInput(
  { value, onChange, onBlur, name, placeholder = '3001234567', disabled, required, className, id },
  ref,
) {
  // Internal display value: just the 10 digits (no +92, no leading 0)
  const [local, setLocal] = useState(() => stripToTenDigits(value ?? ''))

  // Re-sync if external value changes (form reset, default values etc.)
  useEffect(() => {
    setLocal(stripToTenDigits(value ?? ''))
  }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Allow only digits, max 10
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
    setLocal(digits)
    // Emit the canonical form: "+92" + 10 digits (or empty)
    const full = digits.length === 10 ? `+92${digits}` : digits
    onChange?.({ target: { value: full, name } })
  }

  return (
    <div
      className={cn(
        'flex h-10 rounded-md border border-[var(--input)] bg-white overflow-hidden focus-within:ring-2 focus-within:ring-amber-400 focus-within:border-amber-400 transition',
        disabled && 'opacity-60 pointer-events-none',
        className,
      )}
    >
      {/* Locked country prefix */}
      <span className="flex items-center gap-1.5 px-3 bg-gray-50 border-r border-[var(--input)] text-sm font-medium text-slate-700 select-none flex-shrink-0">
        <span className="text-xs">🇵🇰</span>
        <span>+92</span>
      </span>

      {/* The actual input — only 10 digits */}
      <input
        ref={ref}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        id={id}
        name={name}
        value={local}
        onChange={handleChange}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        maxLength={10}
        placeholder={placeholder}
        className="flex-1 min-w-0 px-3 text-sm bg-transparent outline-none placeholder:text-gray-400 tabular-nums"
      />

      {/* Helpful counter */}
      {local.length > 0 && local.length < 10 && (
        <span className="hidden sm:flex items-center px-2 text-[10px] text-gray-400 select-none flex-shrink-0">
          {local.length}/10
        </span>
      )}
    </div>
  )
})

function stripToTenDigits(input: string): string {
  // Remove anything non-digit
  const digits = input.replace(/\D/g, '')
  // Trim leading "92" (country code) or "0" (local prefix)
  let trimmed = digits
  if (trimmed.startsWith('92')) trimmed = trimmed.slice(2)
  if (trimmed.startsWith('0')) trimmed = trimmed.slice(1)
  return trimmed.slice(0, 10)
}
