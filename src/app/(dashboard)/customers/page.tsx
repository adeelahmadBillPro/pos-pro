'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, UserRound, Search, Download, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ExportButton } from '@/components/shared/ExportButton'
import { BulkImport } from '@/components/shared/BulkImport'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { PhoneInput } from '@/components/shared/PhoneInput'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  city: string | null
  customerGroup: string
  loyaltyPoints: number
  totalSpent: number
  totalOrders: number
  isActive: boolean
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

const GROUP_OPTIONS = ['', 'RETAIL', 'WHOLESALE', 'VIP']

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [group, setGroup] = useState('')
  const [page, setPage] = useState(1)
  const [importOpen, setImportOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', phone: '', email: '', city: '', customerGroup: 'RETAIL' })
  const [saving, setSaving] = useState(false)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.set('search', search)
      if (group) params.set('group', group)
      const res = await fetch(`/api/customers?${params}`)
      const json = await res.json()
      if (json.success) {
        setCustomers(json.data)
        setPagination(json.pagination)
      }
    } catch {
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [page, search, group])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setPage(1), 0)
    return () => clearTimeout(timer)
  }, [search, group])

  async function handleAdd() {
    if (!addForm.name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...addForm,
          phone: addForm.phone || undefined,
          email: addForm.email || undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) { toast.error(json.error || 'Failed to create'); return }
      toast.success('Customer created')
      setAddOpen(false)
      setAddForm({ name: '', phone: '', email: '', city: '', customerGroup: 'RETAIL' })
      fetchCustomers()
    } catch {
      toast.error('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  async function handleBulkImport(data: Record<string, any>[]) {
    let success = 0
    for (const row of data) {
      try {
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: row.name,
            phone: row.phone || undefined,
            email: row.email || undefined,
            city: row.city || undefined,
            customerGroup: row.customerGroup || 'RETAIL',
          }),
        })
        const json = await res.json()
        if (json.success) success++
      } catch {}
    }
    toast.success(`Imported ${success} of ${data.length} customers`)
    setImportOpen(false)
    fetchCustomers()
  }

  const exportData = customers.map((c) => ({
    Name: c.name,
    Phone: c.phone || '',
    Email: c.email || '',
    City: c.city || '',
    Group: c.customerGroup,
    'Loyalty Points': c.loyaltyPoints,
    'Total Spent': c.totalSpent,
    'Total Orders': c.totalOrders,
    'Created At': formatDate(c.createdAt),
  }))

  return (
    <div>
      <PageHeader
        title="Customers"
        description={`${pagination?.total ?? 0} total customers`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="w-4 h-4 mr-2" /> Import
            </Button>
            <ExportButton data={exportData} filename="customers" label="Export" />
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Customer
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={group || '_all'} onValueChange={(v) => setGroup(v === '_all' ? '' : v)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Groups" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Groups</SelectItem>
            <SelectItem value="RETAIL">Retail</SelectItem>
            <SelectItem value="WHOLESALE">Wholesale</SelectItem>
            <SelectItem value="VIP">VIP</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <TableSkeleton rows={8} cols={6} />
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 flex flex-col items-center gap-3">
          <UserRound className="w-12 h-12 text-gray-300" />
          <p className="font-medium text-gray-600">No customers found</p>
          {search || group ? (
            <Button variant="outline" size="sm" onClick={() => { setSearch(''); setGroup('') }}>
              Clear filters
            </Button>
          ) : (
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Customer
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Name', 'Phone', 'Group', 'Loyalty Points', 'Total Spent', 'Orders', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-800">{c.name}</p>
                        {c.email && <p className="text-xs text-gray-400">{c.email}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.customerGroup} />
                    </td>
                    <td className="px-4 py-3 font-medium text-emerald-700">{c.loyaltyPoints.toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(c.totalSpent)}</td>
                    <td className="px-4 py-3 text-gray-600">{c.totalOrders}</td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/customers/${c.id}`)}
                        className="text-xs"
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {customers.map((c) => (
              <div
                key={c.id}
                className="p-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100"
                onClick={() => router.push(`/customers/${c.id}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{c.name}</p>
                    <p className="text-sm text-gray-500">{c.phone || c.email || '—'}</p>
                  </div>
                  <StatusBadge status={c.customerGroup} />
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span>{c.totalOrders} orders</span>
                  <span>{formatCurrency(c.totalSpent)}</span>
                  <span>{c.loyaltyPoints} pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-gray-500">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add Customer Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input
                value={addForm.name}
                onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <PhoneInput
                  value={addForm.phone}
                  onChange={(e) => setAddForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="3001234567"
                />
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input
                  value={addForm.city}
                  onChange={(e) => setAddForm((p) => ({ ...p, city: e.target.value }))}
                  placeholder="Karachi"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Customer Group</Label>
              <Select
                value={addForm.customerGroup}
                onValueChange={(v) => setAddForm((p) => ({ ...p, customerGroup: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RETAIL">Retail</SelectItem>
                  <SelectItem value="WHOLESALE">Wholesale</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>Cancel</Button>
              <Button onClick={handleAdd} disabled={saving}>{saving ? 'Saving...' : 'Add Customer'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Customers</DialogTitle>
          </DialogHeader>
          <BulkImport
            open={importOpen}
            onClose={() => setImportOpen(false)}
            onImport={async (rows) => {
              let success = 0
              const errors: string[] = []
              for (const row of rows) {
                try {
                  const res = await fetch('/api/customers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: row.name || row.Name,
                      phone: row.phone || row.Phone,
                      email: row.email || row.Email,
                      customerGroup: row.customerGroup || row.group || 'RETAIL',
                    }),
                  })
                  if (res.ok) success++
                  else errors.push(`Row ${success + errors.length + 1}: failed`)
                } catch {
                  errors.push(`Row ${success + errors.length + 1}: error`)
                }
              }
              return { success, errors }
            }}
            templateHeaders={['name', 'phone', 'email', 'customerGroup']}
            title="Import Customers"
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
