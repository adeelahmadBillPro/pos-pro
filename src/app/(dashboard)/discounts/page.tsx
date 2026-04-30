'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, Trash2, Percent, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { discountSchema, type DiscountInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

interface Discount {
  id: string
  name: string
  code: string | null
  type: string
  value: number
  minOrderValue: number | null
  maxUses: number | null
  usedCount: number
  startDate: string | null
  endDate: string | null
  isActive: boolean
  createdAt: string
}

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<DiscountInput>({
    resolver: standardSchemaResolver(discountSchema) as any,
    defaultValues: { type: 'PERCENTAGE', value: 10 },
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/discounts?page=1&limit=50')
      const data = await res.json()
      if (data.success) setDiscounts(data.data)
    } catch {
      toast.error('Failed to load discounts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() {
    reset({ name: '', type: 'PERCENTAGE', value: 10 })
    setEditingId(null)
    setFormOpen(true)
  }

  async function openEdit(d: Discount) {
    reset({
      name: d.name,
      code: d.code || '',
      type: d.type as 'PERCENTAGE' | 'FIXED_AMOUNT',
      value: d.value,
      minOrderValue: d.minOrderValue || undefined,
      maxUses: d.maxUses || undefined,
      startDate: d.startDate ? d.startDate.split('T')[0] : '',
      endDate: d.endDate ? d.endDate.split('T')[0] : '',
    })
    setEditingId(d.id)
    setFormOpen(true)
  }

  async function onSubmit(data: DiscountInput) {
    try {
      const url = editingId ? `/api/discounts/${editingId}` : '/api/discounts'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (result.success) {
        toast.success(editingId ? 'Discount updated' : 'Discount created')
        setFormOpen(false)
        load()
      } else {
        toast.error(result.error || 'Failed to save')
      }
    } catch {
      toast.error('Failed to save')
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/discounts/${deleteId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Discount deleted')
        setDeleteId(null)
        load()
      } else {
        toast.error(data.error || 'Failed to delete')
      }
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Discounts"
        description="Manage discount codes and promotions"
        actions={
          <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white" onClick={openCreate}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Discount
          </Button>
        }
      />

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <TableSkeleton rows={6} cols={6} />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {discounts.length === 0 ? (
            <div className="py-16 text-center">
              <Percent className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-900">No discounts yet</p>
              <Button size="sm" className="mt-4" onClick={openCreate}>Create First Discount</Button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Name / Code</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Type</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Value</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Usage</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Valid Until</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-right px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {discounts.map((d) => {
                  const now = new Date()
                  const isExpired = d.endDate && new Date(d.endDate) < now
                  const isNotStarted = d.startDate && new Date(d.startDate) > now

                  return (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{d.name}</p>
                        {d.code && (
                          <code className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                            {d.code}
                          </code>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <StatusBadge status={d.type === 'PERCENTAGE' ? 'active' : 'pending'} label={d.type === 'PERCENTAGE' ? 'Percentage' : 'Fixed Amount'} />
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {d.type === 'PERCENTAGE' ? `${d.value}%` : formatCurrency(d.value)}
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell text-gray-500">
                        {d.usedCount}{d.maxUses ? `/${d.maxUses}` : ''}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-gray-500 text-xs">
                        {d.endDate ? formatDate(d.endDate) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={!d.isActive || !!isExpired ? 'inactive' : !!isNotStarted ? 'pending' : 'active'}
                          label={!d.isActive ? 'Inactive' : isExpired ? 'Expired' : isNotStarted ? 'Scheduled' : 'Active'}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(d)}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setDeleteId(d.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Discount' : 'New Discount'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input {...register('name')} placeholder="e.g. Summer Sale" className="mt-1" />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <Label>Code (optional)</Label>
              <Input {...register('code')} placeholder="e.g. SUMMER20" className="mt-1 uppercase" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type *</Label>
                <select
                  {...register('type')}
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FIXED_AMOUNT">Fixed Amount</option>
                </select>
              </div>
              <div>
                <Label>Value *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0.01}
                  {...register('value', { valueAsNumber: true })}
                  placeholder="10"
                  className="mt-1"
                />
                {errors.value && <p className="text-xs text-red-600 mt-1">{errors.value.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Min Order (Rs)</Label>
                <Input
                  type="number"
                  min={0}
                  {...register('minOrderValue', { valueAsNumber: true })}
                  placeholder="Optional"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Max Uses</Label>
                <Input
                  type="number"
                  min={1}
                  {...register('maxUses', { valueAsNumber: true })}
                  placeholder="Unlimited"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date</Label>
                <Input type="date" {...register('startDate')} className="mt-1" />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" {...register('endDate')} className="mt-1" />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-violet-600 hover:bg-violet-700 text-white">
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                {editingId ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Discount"
        description="This discount will be permanently deleted."
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  )
}
