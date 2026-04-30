'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Building2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { toast } from 'sonner'

interface BankAccount {
  id: string
  bankName: string
  accountTitle: string
  iban: string
  branchCode: string | null
  isActive: boolean
  sortOrder: number
}

const defaultForm = {
  bankName: '',
  accountTitle: '',
  iban: '',
  branchCode: '',
  isActive: true,
  sortOrder: 0,
}

export default function SuperAdminBankAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editAccount, setEditAccount] = useState<BankAccount | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function loadAccounts() {
    try {
      const res = await fetch('/api/super-admin/bank-accounts')
      const json = await res.json()
      if (json.success) setAccounts(json.data)
    } catch {
      toast.error('Failed to load bank accounts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAccounts() }, [])

  function openAdd() {
    setEditAccount(null)
    setForm(defaultForm)
    setDialogOpen(true)
  }

  function openEdit(account: BankAccount) {
    setEditAccount(account)
    setForm({
      bankName: account.bankName,
      accountTitle: account.accountTitle,
      iban: account.iban,
      branchCode: account.branchCode || '',
      isActive: account.isActive,
      sortOrder: account.sortOrder,
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.bankName || !form.accountTitle || !form.iban) {
      toast.error('Please fill in required fields')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        branchCode: form.branchCode || null,
      }
      const res = editAccount
        ? await fetch(`/api/super-admin/bank-accounts/${editAccount.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/super-admin/bank-accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })

      const json = await res.json()
      if (!json.success) { toast.error(json.error || 'Failed to save'); return }

      toast.success(editAccount ? 'Bank account updated' : 'Bank account added')
      setDialogOpen(false)
      loadAccounts()
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/super-admin/bank-accounts/${deleteId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) { toast.error(json.error || 'Failed to delete'); return }
      toast.success('Bank account deleted')
      setDeleteId(null)
      loadAccounts()
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  async function toggleActive(account: BankAccount) {
    try {
      const res = await fetch(`/api/super-admin/bank-accounts/${account.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !account.isActive }),
      })
      const json = await res.json()
      if (!json.success) { toast.error('Failed to update'); return }
      toast.success(account.isActive ? 'Account hidden from tenants' : 'Account shown to tenants')
      loadAccounts()
    } catch {
      toast.error('Failed to update')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Bank Accounts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage payment bank accounts shown to tenants</p>
        </div>
        <Button onClick={openAdd} className="bg-violet-600 hover:bg-violet-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Add Account
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No bank accounts yet</p>
          <p className="text-sm text-gray-400 mt-1">Add bank accounts so tenants can make payments</p>
          <Button onClick={openAdd} className="mt-4 bg-violet-600 hover:bg-violet-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Add First Account
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`bg-white rounded-xl border p-4 flex items-start justify-between gap-4 ${
                account.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Building2 className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{account.bankName}</p>
                    {!account.isActive && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Hidden</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">
                    <span className="text-gray-400">Title:</span> {account.accountTitle}
                  </p>
                  <p className="text-sm font-mono text-gray-700 mt-0.5">{account.iban}</p>
                  {account.branchCode && (
                    <p className="text-xs text-gray-400 mt-0.5">Branch: {account.branchCode}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleActive(account)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                  title={account.isActive ? 'Hide from tenants' : 'Show to tenants'}
                >
                  {account.isActive
                    ? <ToggleRight className="w-5 h-5 text-green-600" />
                    : <ToggleLeft className="w-5 h-5 text-gray-400" />
                  }
                </button>
                <button
                  onClick={() => openEdit(account)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-violet-600 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteId(account.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editAccount ? 'Edit Bank Account' : 'Add Bank Account'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Bank Name *</Label>
              <Input
                className="mt-1"
                placeholder="e.g. HBL, UBL, Meezan Bank"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
              />
            </div>
            <div>
              <Label>Account Title *</Label>
              <Input
                className="mt-1"
                placeholder="Account holder name"
                value={form.accountTitle}
                onChange={(e) => setForm({ ...form, accountTitle: e.target.value })}
              />
            </div>
            <div>
              <Label>IBAN *</Label>
              <Input
                className="mt-1 font-mono"
                placeholder="PK00XXXX0000000000000000"
                value={form.iban}
                onChange={(e) => setForm({ ...form, iban: e.target.value })}
              />
            </div>
            <div>
              <Label>Branch Code (optional)</Label>
              <Input
                className="mt-1"
                placeholder="e.g. 0001"
                value={form.branchCode}
                onChange={(e) => setForm({ ...form, branchCode: e.target.value })}
              />
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input
                type="number"
                className="mt-1 max-w-24"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-gray-400 mt-1">Lower numbers appear first</p>
            </div>
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-gray-500">Show this account to tenants</p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, isActive: !form.isActive })}
                className={`w-11 h-6 rounded-full transition-colors ${form.isActive ? 'bg-violet-600' : 'bg-gray-300'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white mx-1 transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1 bg-violet-600 hover:bg-violet-700 text-white" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editAccount ? 'Update' : 'Add Account'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Bank Account"
        description="This will permanently remove this bank account. Tenants won't be able to see it for payments."
        variant="danger"
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
