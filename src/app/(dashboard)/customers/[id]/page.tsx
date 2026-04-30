'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Star, ShoppingBag, Gift, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'

interface Order {
  id: string
  orderNumber: string
  total: number
  status: string
  createdAt: string
  _count: { items: number }
  payments: { method: string; amount: number }[]
}

interface LoyaltyTx {
  id: string
  points: number
  type: string
  notes: string | null
  createdAt: string
}

interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  gender: string | null
  notes: string | null
  customerGroup: string
  loyaltyPoints: number
  totalSpent: number
  totalOrders: number
  isActive: boolean
  createdAt: string
  orders: Order[]
  loyaltyTransactions: LoyaltyTx[]
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [customerId, setCustomerId] = useState('')

  useEffect(() => {
    params.then(({ id }) => {
      setCustomerId(id)
      fetchCustomer(id)
    })
  }, [params])

  async function fetchCustomer(id: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/customers/${id}`)
      const json = await res.json()
      if (json.success) {
        setCustomer(json.data)
      } else {
        toast.error('Customer not found')
        router.push('/customers')
      }
    } catch {
      toast.error('Failed to load customer')
    } finally {
      setLoading(false)
    }
  }

  function openEdit() {
    if (!customer) return
    setEditForm({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      city: customer.city || '',
      notes: customer.notes || '',
      customerGroup: customer.customerGroup,
    })
    setEditOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          phone: editForm.phone || undefined,
          email: editForm.email || undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) { toast.error(json.error || 'Update failed'); return }
      toast.success('Customer updated')
      setEditOpen(false)
      fetchCustomer(customerId)
    } catch {
      toast.error('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 bg-gray-100 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
              <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
              <div className="h-8 w-32 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <TableSkeleton rows={5} cols={4} />
        </div>
      </div>
    )
  }

  if (!customer) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button size="sm" onClick={openEdit}>
          <Pencil className="w-4 h-4 mr-2" /> Edit Customer
        </Button>
      </div>

      {/* Customer Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-slate-900">{customer.name}</h1>
              <StatusBadge status={customer.customerGroup} />
              {!customer.isActive && <StatusBadge status="inactive" label="Inactive" />}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
              {customer.phone && (
                <div className="flex gap-2">
                  <span className="text-gray-400 w-20">Phone:</span>
                  <span className="text-slate-700">{customer.phone}</span>
                </div>
              )}
              {customer.email && (
                <div className="flex gap-2">
                  <span className="text-gray-400 w-20">Email:</span>
                  <span className="text-slate-700">{customer.email}</span>
                </div>
              )}
              {customer.city && (
                <div className="flex gap-2">
                  <span className="text-gray-400 w-20">City:</span>
                  <span className="text-slate-700">{customer.city}</span>
                </div>
              )}
              <div className="flex gap-2">
                <span className="text-gray-400 w-20">Since:</span>
                <span className="text-slate-700">{formatDate(customer.createdAt)}</span>
              </div>
              {customer.notes && (
                <div className="flex gap-2 sm:col-span-2">
                  <span className="text-gray-400 w-20">Notes:</span>
                  <span className="text-slate-700">{customer.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl">
            <Star className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Loyalty Points</p>
            <p className="text-2xl font-bold text-slate-900">{customer.loyaltyPoints.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="p-3 bg-violet-50 rounded-xl">
            <ShoppingBag className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-2xl font-bold text-slate-900">{customer.totalOrders}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="p-3 bg-violet-50 rounded-xl">
            <Gift className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Spent</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(customer.totalSpent)}</p>
          </div>
        </div>
      </div>

      {/* Orders */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-slate-900">Order History</h2>
        </div>
        {customer.orders.length === 0 ? (
          <div className="py-10 text-center">
            <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No orders yet</p>
          </div>
        ) : (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Order #', 'Date', 'Items', 'Total', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customer.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-600">{order._count.items}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(order.total)}</td>
                    <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" onClick={() => router.push(`/orders/${order.id}`)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Mobile orders */}
        {customer.orders.length > 0 && (
          <div className="md:hidden divide-y divide-gray-100">
            {customer.orders.map((order) => (
              <div
                key={order.id}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => router.push(`/orders/${order.id}`)}
              >
                <div>
                  <p className="font-medium text-slate-800">{order.orderNumber}</p>
                  <p className="text-xs text-gray-500">{formatDate(order.createdAt)} · {order._count.items} items</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(order.total)}</p>
                  <StatusBadge status={order.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Loyalty Transactions */}
      {customer.loyaltyTransactions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-slate-900">Loyalty Point History</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {customer.loyaltyTransactions.map((tx) => (
              <div key={tx.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-700">{tx.notes || tx.type.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-400">{formatDateTime(tx.createdAt)}</p>
                </div>
                <span className={`font-semibold text-sm ${tx.points > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {tx.points > 0 ? '+' : ''}{tx.points} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={editForm.name || ''} onChange={(e) => setEditForm((p: any) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={editForm.phone || ''} onChange={(e) => setEditForm((p: any) => ({ ...p, phone: e.target.value }))} placeholder="03XX-XXXXXXX" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={editForm.email || ''} onChange={(e) => setEditForm((p: any) => ({ ...p, email: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input value={editForm.city || ''} onChange={(e) => setEditForm((p: any) => ({ ...p, city: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Group</Label>
                <Select value={editForm.customerGroup} onValueChange={(v) => setEditForm((p: any) => ({ ...p, customerGroup: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RETAIL">Retail</SelectItem>
                    <SelectItem value="WHOLESALE">Wholesale</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={editForm.notes || ''} onChange={(e) => setEditForm((p: any) => ({ ...p, notes: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
