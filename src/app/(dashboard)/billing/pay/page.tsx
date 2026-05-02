'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { CreditCard, Upload, CheckCircle2, Building2, Package } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'
import { PhoneInput } from '@/components/shared/PhoneInput'

interface BankAccount {
  id: string
  bankName: string
  accountTitle: string
  iban: string
  branchCode: string | null
}

interface Plan {
  id: string
  name: string
  monthlyPrice: number
  yearlyPrice: number
}

function BillingPayForm() {
  const router = useRouter()
  const { data: session } = useSession()
  const searchParams = useSearchParams()

  // URL params from plans page: ?planId=xxx&monthly=999&yearly=true
  const planId = searchParams.get('planId') ?? ''
  const monthlyPrice = parseInt(searchParams.get('monthly') ?? '0')
  const isYearly = searchParams.get('yearly') === 'true'

  const [plan, setPlan] = useState<Plan | null>(null)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [months, setMonths] = useState(isYearly ? 12 : 1)
  const [uploading, setUploading] = useState(false)
  const [screenshotUrl, setScreenshotUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Form fields
  const [senderName, setSenderName] = useState('')
  const [senderPhone, setSenderPhone] = useState('')
  const [bankName, setBankName] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [notes, setNotes] = useState('')

  // Pre-fill name from session
  useEffect(() => {
    if (session?.user?.name) setSenderName(session.user.name)
  }, [session])

  useEffect(() => {
    async function fetchData() {
      const [plansRes, bankRes] = await Promise.all([
        fetch('/api/billing/plans'),
        fetch('/api/billing/bank-accounts').catch(() => null),
      ])

      const plansJson = await plansRes.json()
      if (plansJson.success && planId) {
        const found = plansJson.data.find((p: Plan) => p.id === planId)
        if (found) setPlan(found)
      }

      if (bankRes?.ok) {
        const bankJson = await bankRes.json()
        if (bankJson.success) setBankAccounts(bankJson.data)
      }
    }
    fetchData()
  }, [planId])

  function calculateAmount(m: number) {
    if (!plan) return monthlyPrice * m
    if (m >= 12) return plan.yearlyPrice
    return plan.monthlyPrice * m
  }

  const totalAmount = calculateAmount(months)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'payment-proofs')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const json = await res.json()
      if (!json.success) { toast.error('Upload failed'); return }
      setScreenshotUrl(json.data.url)
      toast.success('Screenshot uploaded')
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!screenshotUrl) { toast.error('Please upload payment screenshot'); return }
    if (!senderName.trim()) { toast.error('Please enter your name'); return }
    if (!senderPhone.trim()) { toast.error('Please enter your phone number'); return }
    if (!bankName.trim()) { toast.error('Please enter the bank name'); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/billing/submit-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan?.id || planId,
          amount: totalAmount,
          durationMonths: months,
          transactionId,
          bankName,
          senderName,
          senderPhone,
          screenshotUrl,
          notes,
        }),
      })
      const json = await res.json()
      if (!json.success) { toast.error(json.error || 'Submission failed'); return }
      toast.success('Payment proof submitted! We will activate your subscription within 24 hours.')
      router.push('/billing/pending')
    } catch {
      toast.error('An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Complete Payment</h1>
        <p className="text-sm text-gray-500 mt-0.5">Transfer payment to one of the accounts below, then submit proof</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left: Instructions + Plan Summary + Bank Accounts ── */}
        <div className="space-y-4">

          {/* Plan summary — always visible */}
          <div className="bg-white rounded-xl border-2 border-amber-300 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-slate-900">Order Summary</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Plan</span>
                <span className="font-semibold text-slate-900">
                  {plan?.name ?? (planId ? 'Loading…' : 'No plan selected')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Duration</span>
                <div className="flex gap-1">
                  {[1, 3, 6, 12].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMonths(m)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                        months === m
                          ? 'bg-amber-400 text-slate-900 border-amber-400'
                          : 'border-gray-300 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {m === 12 ? '1yr' : `${m}m`}
                    </button>
                  ))}
                </div>
              </div>
              {months >= 12 && (
                <div className="flex justify-between text-green-600 text-xs">
                  <span>Yearly discount</span>
                  <span>2 months free!</span>
                </div>
              )}
              <div className="flex justify-between items-center border-t pt-3 mt-1">
                <span className="font-bold text-base text-slate-900">Total Amount</span>
                <span className="text-2xl font-bold text-amber-600">
                  {totalAmount > 0 ? formatCurrency(totalAmount) : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-blue-900 text-sm">Payment Instructions</h3>
            </div>
            <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
              <li>Transfer the exact amount shown above to any bank account below</li>
              <li>Take a screenshot of the payment confirmation</li>
              <li>Fill in the form and upload your screenshot</li>
              <li>Your subscription will be activated within 24 hours</li>
            </ol>
          </div>

          {/* Bank accounts */}
          {bankAccounts.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900 text-sm">Transfer To</h3>
              {bankAccounts.map((bank) => (
                <div key={bank.id} className="bg-white rounded-xl border border-gray-200 p-4 text-sm">
                  <p className="font-bold text-slate-800 mb-2">{bank.bankName}</p>
                  <div className="space-y-1 text-gray-600 text-xs">
                    <div className="flex gap-2"><span className="text-gray-400 w-24 flex-shrink-0">Account Title</span><span className="font-medium">{bank.accountTitle}</span></div>
                    <div className="flex gap-2"><span className="text-gray-400 w-24 flex-shrink-0">IBAN</span><span className="font-mono font-medium break-all">{bank.iban}</span></div>
                    {bank.branchCode && <div className="flex gap-2"><span className="text-gray-400 w-24 flex-shrink-0">Branch Code</span><span>{bank.branchCode}</span></div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500 text-center">
              Bank account details will be added by admin. Contact support.
            </div>
          )}
        </div>

        {/* ── Right: Payment Form ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <CreditCard className="w-5 h-5 text-slate-600" />
            <h2 className="font-semibold text-slate-900">Submit Payment Proof</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Amount — read-only, prominent */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-700 font-medium">Amount to Pay</p>
                <p className="text-xl font-bold text-amber-800">
                  {totalAmount > 0 ? formatCurrency(totalAmount) : '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-amber-700">Plan</p>
                <p className="text-sm font-semibold text-amber-900">{plan?.name ?? '—'}</p>
                <p className="text-xs text-amber-600">{months >= 12 ? '1 Year' : `${months} Month${months > 1 ? 's' : ''}`}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Your Name *</Label>
              <Input
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Full name"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Your Phone *</Label>
              <PhoneInput
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                placeholder="3001234567"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Your Bank Name *</Label>
              <Input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. HBL, UBL, Meezan, JazzCash"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Transaction ID / Reference</Label>
              <Input
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Transaction reference number"
              />
            </div>

            {/* Screenshot upload */}
            <div className="space-y-1.5">
              <Label>Payment Screenshot *</Label>
              {screenshotUrl ? (
                <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-3 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-emerald-700 font-medium">Screenshot uploaded</p>
                    <img src={screenshotUrl} alt="payment proof" className="mt-2 rounded-lg max-h-24 object-cover" />
                  </div>
                  <button type="button" onClick={() => setScreenshotUrl('')} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border border-gray-200 rounded-lg">
                    Change
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:border-amber-400 transition-colors">
                  <Upload className="w-6 h-6 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500 font-medium">
                    {uploading ? 'Uploading...' : 'Tap to upload screenshot'}
                  </span>
                  <span className="text-xs text-gray-400 mt-0.5">PNG, JPG, WebP (max 5MB)</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional information" />
            </div>

            <button
              type="submit"
              disabled={submitting || uploading || !screenshotUrl || totalAmount === 0}
              className="w-full h-12 bg-teal-700 hover:bg-teal-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Payment Proof'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function BillingPayPage() {
  return (
    <Suspense>
      <BillingPayForm />
    </Suspense>
  )
}
