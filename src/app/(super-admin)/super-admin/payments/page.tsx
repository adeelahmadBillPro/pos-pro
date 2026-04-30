'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, CheckCircle2, XCircle, Eye, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { formatCurrency, formatDateTime } from '@/lib/utils'

interface PaymentProof {
  id: string
  amount: number
  durationMonths: number
  transactionId: string | null
  screenshotUrl: string
  bankName: string
  senderName: string
  senderPhone: string | null
  notes: string | null
  status: string
  rejectionReason: string | null
  submittedAt: string
  reviewedAt: string | null
  store: { id: string; name: string; email: string | null; phone: string | null }
  plan: { id: string; name: string; monthlyPrice: number }
  reviewedBy: { id: string; name: string } | null
}

const REJECTION_REASONS = [
  'Payment screenshot is unclear',
  'Transaction amount does not match',
  'Payment not found in our records',
  'Duplicate submission',
  'Invalid bank account used',
  'Other',
]

export default function SuperAdminPaymentsPage() {
  const [proofs, setProofs] = useState<PaymentProof[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)

  const [viewProof, setViewProof] = useState<PaymentProof | null>(null)
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [selectedProof, setSelectedProof] = useState<PaymentProof | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectNotes, setRejectNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  const fetchProofs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (statusFilter) params.set('status', statusFilter)
      if (search) params.set('search', search)

      const res = await fetch(`/api/super-admin/payments?${params}`)
      const json = await res.json()
      if (json.success) {
        setProofs(json.data)
        setPagination(json.pagination)
      }
    } catch {
      toast.error('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, search])

  useEffect(() => { fetchProofs() }, [fetchProofs])

  async function handleApprove() {
    if (!selectedProof) return
    setProcessing(true)
    try {
      const res = await fetch('/api/super-admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proofId: selectedProof.id }),
      })
      const json = await res.json()
      if (!json.success) { toast.error(json.error || 'Approval failed'); return }
      toast.success(`Payment approved for ${selectedProof.store.name}!`)
      setApproveOpen(false)
      setSelectedProof(null)
      fetchProofs()
    } catch {
      toast.error('An error occurred')
    } finally {
      setProcessing(false)
    }
  }

  async function handleReject() {
    if (!selectedProof) return
    const reason = rejectReason === 'Other' ? rejectNotes : rejectReason
    if (!reason.trim()) { toast.error('Please provide a rejection reason'); return }
    setProcessing(true)
    try {
      const res = await fetch('/api/super-admin/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proofId: selectedProof.id, reason }),
      })
      const json = await res.json()
      if (!json.success) { toast.error(json.error || 'Rejection failed'); return }
      toast.success('Payment rejected')
      setRejectOpen(false)
      setSelectedProof(null)
      setRejectReason('')
      fetchProofs()
    } catch {
      toast.error('An error occurred')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payment Reviews</h1>
        <p className="text-gray-500 text-sm">Review and approve payment proofs</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input className="pl-9" placeholder="Search store name or email..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <Select value={statusFilter || '_all'} onValueChange={(v) => { setStatusFilter(v === '_all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <TableSkeleton rows={8} cols={7} />
        </div>
      ) : proofs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
          <p className="font-medium text-gray-600">No payment proofs found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Store', 'Plan', 'Amount', 'Submitted', 'Status', 'Screenshot', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {proofs.map((proof) => (
                  <tr key={proof.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{proof.store.name}</p>
                      <p className="text-xs text-gray-400">{proof.store.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-700">{proof.plan.name}</p>
                      <p className="text-xs text-gray-400">{proof.durationMonths}mo</p>
                    </td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(proof.amount)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(proof.submittedAt)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={proof.status} />
                      {proof.rejectionReason && (
                        <p className="text-xs text-red-500 mt-0.5 max-w-32 truncate">{proof.rejectionReason}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setViewProof(proof)}
                        className="text-violet-600 hover:text-blue-800 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {proof.status === 'PENDING' && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => { setSelectedProof(proof); setApproveOpen(true) }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                            onClick={() => { setSelectedProof(proof); setRejectOpen(true) }}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      {/* View Screenshot Dialog */}
      {viewProof && (
        <Dialog open={!!viewProof} onOpenChange={() => setViewProof(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Payment Proof — {viewProof.store.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">Plan</p>
                  <p className="font-medium">{viewProof.plan.name}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Amount</p>
                  <p className="font-semibold">{formatCurrency(viewProof.amount)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Sender</p>
                  <p>{viewProof.senderName}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Bank</p>
                  <p>{viewProof.bankName}</p>
                </div>
                {viewProof.transactionId && (
                  <div className="col-span-2">
                    <p className="text-gray-400 text-xs">Transaction ID</p>
                    <p className="font-mono text-sm">{viewProof.transactionId}</p>
                  </div>
                )}
              </div>
              {viewProof.screenshotUrl && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Screenshot</p>
                  <img
                    src={viewProof.screenshotUrl}
                    alt="Payment proof"
                    className="w-full rounded-lg border border-gray-200 cursor-pointer"
                    onClick={() => window.open(viewProof.screenshotUrl, '_blank')}
                  />
                  <p className="text-xs text-gray-400 mt-1 text-center">Click to open full size</p>
                </div>
              )}
              {viewProof.status === 'PENDING' && (
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => { setSelectedProof(viewProof); setViewProof(null); setApproveOpen(true) }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200"
                    onClick={() => { setSelectedProof(viewProof); setViewProof(null); setRejectOpen(true) }}
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Reject
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Approve Dialog */}
      <Dialog open={approveOpen} onOpenChange={() => setApproveOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Payment</DialogTitle>
          </DialogHeader>
          {selectedProof && (
            <div className="space-y-4 pt-2">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm">
                <p className="font-semibold text-emerald-900 mb-2">Subscription to Activate</p>
                <div className="space-y-1 text-emerald-700">
                  <p>Store: <strong>{selectedProof.store.name}</strong></p>
                  <p>Plan: <strong>{selectedProof.plan.name}</strong></p>
                  <p>Duration: <strong>{selectedProof.durationMonths} month(s)</strong></p>
                  <p>Amount: <strong>{formatCurrency(selectedProof.amount)}</strong></p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Approving will activate a <strong>{selectedProof.durationMonths}-month</strong> subscription for this store.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setApproveOpen(false)} disabled={processing}>Cancel</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleApprove} disabled={processing}>
                  {processing ? 'Processing...' : 'Confirm Approval'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={() => setRejectOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Rejection Reason *</Label>
              <Select value={rejectReason} onValueChange={setRejectReason}>
                <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                <SelectContent>
                  {REJECTION_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {rejectReason === 'Other' && (
              <div className="space-y-1.5">
                <Label>Details</Label>
                <Input value={rejectNotes} onChange={(e) => setRejectNotes(e.target.value)} placeholder="Explain the reason..." />
              </div>
            )}
            <p className="text-xs text-gray-500">The store owner will be notified with this reason via email.</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={processing}>Cancel</Button>
              <Button variant="destructive" onClick={handleReject} disabled={processing || !rejectReason}>
                {processing ? 'Processing...' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
