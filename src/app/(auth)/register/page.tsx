'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { Loader2, ShoppingBag, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { registerSchema, type RegisterInput } from '@/lib/validations'
import { STORE_TYPE_META, STORE_TYPE_ACCENT_CLASSES, type StoreType } from '@/lib/storeTypes'
import { cn } from '@/lib/utils'
import { PhoneInput } from '@/components/shared/PhoneInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const CITIES = [
  'Karachi',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Quetta',
] as const

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const form = useForm<RegisterInput>({
    resolver: standardSchemaResolver(registerSchema) as any,
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      storeName: '',
      storeType: 'GENERAL' as StoreType,
      phone: '',
      city: '',
      terms: false as unknown as true,
    },
  })

  async function onSubmit(data: RegisterInput) {
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const json = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          form.setError('email', { message: json.error })
          return
        }
        if (json.issues) {
          Object.entries(json.issues).forEach(([field, messages]) => {
            form.setError(field as keyof RegisterInput, {
              message: (messages as string[])[0],
            })
          })
          return
        }
        toast.error(json.error ?? 'Registration failed. Please try again.')
        return
      }

      setSuccess(true)
      toast.success('Account created! Your 14-day trial has started.')
      setTimeout(() => router.push('/login'), 2000)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--muted)] px-4">
        <Card className="w-full max-w-md shadow-lg text-center">
          <CardContent className="pt-8 pb-8">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="w-16 h-16 text-[var(--success)]" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Account Created!</h2>
            <p className="text-[var(--muted-foreground)] mb-4">
              Your 14-day free trial has started. Redirecting to login…
            </p>
            <Loader2 className="animate-spin mx-auto h-5 w-5 text-[var(--accent)]" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* ── Decorative animated background — softer on mobile ── */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-teal-50" />
      <div className="hidden sm:block absolute -top-40 -left-40 w-96 h-96 rounded-full bg-amber-200/40 blur-3xl" />
      <div className="hidden sm:block absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-teal-200/40 blur-3xl" />
      <div className="hidden sm:block absolute -bottom-40 left-1/3 w-96 h-96 rounded-full bg-rose-200/30 blur-3xl" />
      {/* Mobile-only subtle gradient blobs */}
      <div className="sm:hidden absolute -top-20 -right-20 w-64 h-64 rounded-full bg-amber-200/30 blur-2xl" />
      <div className="sm:hidden absolute bottom-0 -left-20 w-64 h-64 rounded-full bg-teal-200/30 blur-2xl" />

      {/* Subtle dot grid — desktop only (saves mobile render cost) */}
      <div
        className="hidden sm:block absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(15, 118, 110, 0.15) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative w-full flex items-center justify-center px-3 sm:px-4 py-6 sm:py-10">
        <div className="w-full max-w-2xl">
          {/* Logo — smaller on mobile to give form more room */}
          <div className="flex flex-col items-center mb-4 sm:mb-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-amber-400 blur-md opacity-40" />
              <div className="relative flex items-center justify-center w-12 sm:w-16 h-12 sm:h-16 rounded-2xl bg-amber-400 mb-2 sm:mb-4 shadow-lg">
                <ShoppingBag className="w-6 sm:w-8 h-6 sm:h-8 text-slate-900" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 sm:mt-2">POS Pro</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Start your 14-day free trial
            </p>
          </div>

        <Card className="shadow-2xl border-gray-200/60 backdrop-blur-sm bg-white/95">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">Create your account</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              No credit card required. Cancel anytime.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Muhammad Ali"
                          autoComplete="name"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          autoComplete="email"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <input
                              name={field.name}
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              ref={field.ref}
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Min 8 chars"
                              autoComplete="new-password"
                              disabled={isLoading}
                              className="flex h-10 w-full rounded-md border border-[var(--input)] bg-white px-3 py-2 pr-10 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-50"
                            />
                            <button
                              type="button"
                              tabIndex={-1}
                              onClick={() => setShowPassword((p) => !p)}
                              className="absolute right-0 top-0 h-full px-3 flex items-center justify-center text-gray-400 hover:text-slate-700 transition-colors"
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <input
                              name={field.name}
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              ref={field.ref}
                              type={showConfirm ? 'text' : 'password'}
                              placeholder="Repeat password"
                              autoComplete="new-password"
                              disabled={isLoading}
                              className="flex h-10 w-full rounded-md border border-[var(--input)] bg-white px-3 py-2 pr-10 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-50"
                            />
                            <button
                              type="button"
                              tabIndex={-1}
                              onClick={() => setShowConfirm((p) => !p)}
                              className="absolute right-0 top-0 h-full px-3 flex items-center justify-center text-gray-400 hover:text-slate-700 transition-colors"
                              aria-label={showConfirm ? 'Hide password' : 'Show password'}
                            >
                              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Store name */}
                <FormField
                  control={form.control}
                  name="storeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ali General Store"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ── Business Type selector ── */}
                <FormField
                  control={form.control}
                  name="storeType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What type of business?</FormLabel>
                      <p className="text-xs text-[var(--muted-foreground)] -mt-1">
                        Hum aapke business ke hisab se starter categories bana denge.
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2 mt-1">
                        {STORE_TYPE_META.map((meta) => {
                          const accent = STORE_TYPE_ACCENT_CLASSES[meta.accent] ?? STORE_TYPE_ACCENT_CLASSES.teal
                          const selected = field.value === meta.type
                          return (
                            <button
                              key={meta.type}
                              type="button"
                              onClick={() => field.onChange(meta.type)}
                              disabled={isLoading}
                              title={meta.description}
                              className={cn(
                                'relative aspect-square flex flex-col items-center justify-center gap-0.5 sm:gap-1 p-1 sm:p-2 rounded-xl border-2 transition-all text-center',
                                selected
                                  ? `${accent.bg} border-current ${accent.text} ring-2 sm:ring-4 ${accent.ring} shadow-sm scale-[1.02]`
                                  : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-95',
                              )}
                            >
                              <span className="text-xl sm:text-2xl leading-none">{meta.emoji}</span>
                              <span className={cn(
                                'text-[9px] sm:text-xs font-semibold leading-tight px-0.5',
                                selected ? accent.text : 'text-slate-600',
                              )}>
                                {meta.label}
                              </span>
                              {selected && (
                                <CheckCircle2 className={cn('absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-3 h-3 sm:w-3.5 sm:h-3.5', accent.text)} />
                              )}
                            </button>
                          )
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone + City row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone number</FormLabel>
                        <FormControl>
                          <PhoneInput
                            name={field.name}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            disabled={isLoading}
                            placeholder="3001234567"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select city" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CITIES.map((city) => (
                              <SelectItem key={city} value={city}>
                                {city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Terms */}
                <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="terms"
                          className="mt-0.5 h-4 w-4 rounded border-[var(--input)] accent-[var(--accent)] cursor-pointer"
                          checked={field.value === true}
                          onChange={(e) => field.onChange(e.target.checked)}
                          disabled={isLoading}
                        />
                        <label
                          htmlFor="terms"
                          className="text-sm text-[var(--muted-foreground)] cursor-pointer leading-relaxed"
                        >
                          I agree to the{' '}
                          <Link
                            href="/terms"
                            className="text-[var(--accent)] hover:underline"
                            target="_blank"
                          >
                            Terms of Service
                          </Link>{' '}
                          and{' '}
                          <Link
                            href="/privacy"
                            className="text-[var(--accent)] hover:underline"
                            target="_blank"
                          >
                            Privacy Policy
                          </Link>
                        </label>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    'Create account — free for 14 days'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="justify-center border-t pt-4">
            <p className="text-sm text-[var(--muted-foreground)]">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-[var(--accent)] hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>

          {/* Trust badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>No credit card needed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Setup in 5 minutes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
