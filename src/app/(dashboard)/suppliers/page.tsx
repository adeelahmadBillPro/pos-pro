'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Phone, Mail, Edit, Trash2, Truck, Search, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { PhoneInput } from '@/components/shared/PhoneInput'

interface Supplier {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  isActive: boolean
  _count: { purchaseOrders: number }
}

const empty = { name: '', phone: '', email: '', address: '', notes: '' }

export default function SuppliersPage() {
  const [list, setList] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/suppliers?search=${encodeURIComponent(search)}`)
      const json = await res.json()
      if (json.success) setList(json.data)
    } catch {
      toast.error('Failed to load suppliers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [search])

  function openAdd() {
    setEditing(null)
    setForm(empty)
    setOpen(true)
  }

  function openEdit(s: Supplier) {
    setEditing(s)
    setForm({
      name: s.name,
      phone: s.phone ?? '',
      email: s.email ?? '',
      address: s.address ?? '',
      notes: s.notes ?? '',
    })
    setOpen(true)
  }

  async function save() {
    if (!form.name.trim()) { toast.error('Vendor name required'); return }
    setSaving(true)
    try {
      const url = editing ? `/api/suppliers/${editing.id}` : '/api/suppliers'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!json.success) { toast.error(json.error || 'Save failed'); return }
      toast.success(editing ? 'Vendor updated' : 'Vendor added')
      setOpen(false)
      load()
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/suppliers/${deleteId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) { toast.error(json.error || 'Delete failed'); return }
      toast.success('Vendor deleted')
      setDeleteId(null)
      load()
    } catch {
      toast.error('Network error')
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Vendors / Suppliers"
        description="Manage suppliers you order stock from"
        actions={
          <Button onClick={openAdd} className="gap-1.5">
            <Plus className="w-4 h-4" /> Add Vendor
          </Button>
        }
      />

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search vendors by name, phone, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Link
          href="/purchase-orders"
          className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition-colors"
        >
          <Truck className="w-3.5 h-3.5" />
          Purchase Orders
        </Link>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">No vendors yet</p>
          <p className="text-sm text-gray-500 mt-1 mb-4">Add suppliers you regularly purchase stock from.</p>
          <Button onClick={openAdd} className="gap-1.5">
            <Plus className="w-4 h-4" /> Add First Vendor
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {list.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border border-gray-200 hover:border-amber-300 hover:shadow-md transition-all p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5 text-amber-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{s.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {s._count.purchaseOrders} order{s._count.purchaseOrders !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => openEdit(s)}
                    className="w-7 h-7 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-amber-600 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteId(s.id)}
                    className="w-7 h-7 rounded-md hover:bg-rose-50 flex items-center justify-center text-gray-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-sm">
                {s.phone && (
                  <a href={`tel:${s.phone}`} className="flex items-center gap-2 text-slate-600 hover:text-amber-700 transition-colors">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                    <span className="truncate">{s.phone}</span>
                  </a>
                )}
                {s.email && (
                  <a href={`mailto:${s.email}`} className="flex items-center gap-2 text-slate-600 hover:text-amber-700 transition-colors">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                    <span className="truncate">{s.email}</span>
                  </a>
                )}
                {!s.phone && !s.email && (
                  <p className="text-xs text-gray-400 italic">No contact info</p>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                <Link
                  href={`/purchase-orders/new?supplier=${s.id}`}
                  className="flex-1 h-8 rounded-lg bg-teal-50 text-teal-700 text-xs font-semibold flex items-center justify-center gap-1 hover:bg-teal-100 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  New PO
                </Link>
                <Link
                  href={`/purchase-orders?supplierId=${s.id}`}
                  className="flex-1 h-8 rounded-lg bg-gray-50 text-slate-700 text-xs font-semibold flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  View History
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Vendor' : 'Add Vendor'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label>Vendor Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="ABC Wholesale Suppliers"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Phone</Label>
                <div className="mt-1">
                  <PhoneInput
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="orders@vendor.com"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Shop address"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Payment terms, delivery days, etc."
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                {editing ? 'Update' : 'Add Vendor'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Vendor?"
        description="The vendor will be removed but past purchase orders are kept for record."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
