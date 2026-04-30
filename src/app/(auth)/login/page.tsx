'use client'

import { Suspense, useState, useTransition, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2, ShoppingBag, BarChart3, Users, Package,
  Shield, Zap, CheckCircle2, ArrowRight, Eye, EyeOff,
} from 'lucide-react'
import { loginAction } from './actions'

const features = [
  { icon: ShoppingBag, text: 'Fast POS Terminal with barcode scan' },
  { icon: BarChart3, text: 'Real-time sales reports & analytics' },
  { icon: Users, text: 'Customer loyalty & staff management' },
  { icon: Package, text: 'Inventory tracking with low-stock alerts' },
  { icon: Shield, text: 'Multi-role access control & audit logs' },
  { icon: Zap, text: 'JazzCash, EasyPaisa & split payments' },
]

const stats = [
  { value: '500+', label: 'Stores' },
  { value: '99.9%', label: 'Uptime' },
  { value: '1M+', label: 'Orders' },
]

function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard'
  const [authError, setAuthError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const email = emailRef.current?.value ?? ''
    const password = passwordRef.current?.value ?? ''

    if (!email || !password) {
      setAuthError('Please enter your email and password.')
      return
    }
    setAuthError('')

    startTransition(async () => {
      const result = await loginAction(email, password, callbackUrl)
      if (result?.error) {
        setAuthError(result.error)
      }
    })
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-800 via-teal-700 to-teal-900" />
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-teal-600/30" />
        <div className="absolute top-1/2 -right-24 w-80 h-80 rounded-full bg-amber-400/20" />
        <div className="absolute -bottom-20 left-1/4 w-64 h-64 rounded-full bg-teal-600/20" />
        <div className="absolute top-1/4 right-1/3 w-32 h-32 rounded-full bg-amber-300/10" />

        <div className="relative z-10 flex flex-col h-full px-12 py-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-slate-900" />
            </div>
            <span className="text-white font-bold text-xl">POS Pro</span>
          </div>

          <div className="mt-16">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              Pakistan&apos;s Smartest<br />
              <span className="text-amber-400">Cloud POS</span><br />
              for Retail
            </h1>
            <p className="mt-4 text-teal-200 text-lg max-w-sm">
              Manage your store, sales, inventory and staff — all from one place.
            </p>
          </div>

          <div className="mt-10 space-y-3">
            {features.map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span className="text-teal-100 text-sm">{f.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-10 flex items-center gap-10 border-t border-white/10">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-teal-300 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center bg-[#f8f7f4] px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center mb-3">
              <ShoppingBag className="w-7 h-7 text-slate-900" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">POS Pro</h2>
            <p className="text-sm text-slate-500 mt-1">Pakistan&apos;s Modern Cloud POS</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
              <p className="text-slate-500 text-sm mt-1">Sign in to your store account</p>
            </div>

            <form onSubmit={handleSubmit} method="post" className="space-y-4">
              {authError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 font-medium">
                  {authError}
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email address
                </label>
                <input
                  ref={emailRef}
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={isPending}
                  required
                  className="flex h-11 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-50"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-teal-600 hover:text-teal-700 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    ref={passwordRef}
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={isPending}
                    required
                    className="flex h-11 w-full rounded-md border border-gray-200 bg-white px-3 py-2 pr-12 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-0 top-0 h-full w-11 flex items-center justify-center text-gray-400 hover:text-slate-700 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full h-11 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-900 font-semibold text-base rounded-xl mt-2 flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-100 text-center">
              <p className="text-sm text-slate-500">
                Don&apos;t have an account?{' '}
                <Link
                  href="/register"
                  className="font-semibold text-teal-700 hover:text-teal-800 hover:underline"
                >
                  Start free trial
                </Link>
              </p>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
              <span>Secure &amp; encrypted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
              <span>No credit card needed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
