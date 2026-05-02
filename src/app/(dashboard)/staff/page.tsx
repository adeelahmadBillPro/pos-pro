'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, UserCheck, Loader2, LogIn, LogOut, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { staffSchema, type StaffInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { PhoneInput } from '@/components/shared/PhoneInput'
import { ClockOutModal } from '@/components/staff/ClockOutModal'
import { formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

interface StaffMember {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  isActive: boolean
  avatar: string | null
  createdAt: string
  shifts: Array<{ clockIn: string; clockOut: string | null }>
}

export default function StaffPage() {
  const { data: session } = useSession()
  const currentUserId = (session?.user as any)?.id

  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editMember, setEditMember] = useState<StaffMember | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [clockingIn, setClockingIn] = useState(false)
  const [clockingOut, setClockingOut] = useState(false)
  const [clockOutOpen, setClockOutOpen] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<StaffInput>({
    resolver: standardSchemaResolver(staffSchema) as any,
    defaultValues: { role: 'CASHIER' },
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/staff')
      const data = await res.json()
      if (data.success) setStaff(data.data)
    } catch {
      toast.error('Failed to load staff')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // My own shift status
  const myRecord = staff.find((s) => s.id === currentUserId)
  const myLastShift = myRecord?.shifts[0]
  const iAmClockedIn = myLastShift && !myLastShift.clockOut

  async function clockIn() {
    setClockingIn(true)
    try {
      const res = await fetch('/api/staff/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openingCash: 0 }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Clocked in successfully')
        load()
      } else {
        toast.error(data.error || 'Failed to clock in')
      }
    } catch {
      toast.error('Failed to clock in')
    } finally {
      setClockingIn(false)
    }
  }

  function clockOut() {
    // Open the End-of-Day modal which handles drawer count + reconciliation
    setClockOutOpen(true)
  }

  async function onSubmit(data: StaffInput) {
    const isEdit = !!editMember
    const url = isEdit ? `/api/staff/${editMember!.id}` : '/api/staff'
    const method = isEdit ? 'PUT' : 'POST'
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (result.success) {
        toast.success(isEdit ? 'Staff updated' : 'Staff member created')
        if (result.tempPassword) setTempPassword(result.tempPassword)
        setFormOpen(false)
        setEditMember(null)
        reset()
        load()
      } else {
        toast.error(result.error || 'Failed to save')
      }
    } catch {
      toast.error('Failed to save')
    }
  }

  function openEdit(s: StaffMember) {
    setEditMember(s)
    setValue('name', s.name)
    setValue('email', s.email)
    setValue('phone', s.phone || '')
    setValue('role', s.role as StaffInput['role'])
    setValue('password', '')
    setValue('pin', '')
    setFormOpen(true)
  }

  function openAdd() {
    setEditMember(null)
    reset({ role: 'CASHIER', name: '', email: '', phone: '', password: '', pin: '' })
    setFormOpen(true)
  }

  async function toggleActive(id: string, current: boolean) {
    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !current }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Staff ${!current ? 'activated' : 'deactivated'}`)
        load()
      } else {
        toast.error(data.error || 'Failed to update')
      }
    } catch {
      toast.error('Failed to update')
    }
  }

  return (
    <div>
      <PageHeader
        title="Staff"
        description={`${staff.length} staff members`}
        actions={
          <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white" onClick={openAdd}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Staff
          </Button>
        }
      />

      {/* My Shift Card */}
      {myRecord && (
        <div className={`mb-4 rounded-xl border p-4 flex items-center justify-between gap-4 ${
          iAmClockedIn ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
        }`}>
          <div>
            <p className="text-sm font-semibold text-slate-900">My Shift</p>
            {iAmClockedIn ? (
              <p className="text-xs text-green-700 mt-0.5">
                🟢 Clocked in since {formatDateTime(myLastShift!.clockIn)}
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-0.5">
                {myLastShift ? `Last shift: ${formatDateTime(myLastShift.clockIn)}` : 'No shifts yet'}
              </p>
            )}
          </div>
          {iAmClockedIn ? (
            <Button
              size="sm"
              variant="outline"
              onClick={clockOut}
              disabled={clockingOut}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 flex-shrink-0"
            >
              {clockingOut
                ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                : <LogOut className="w-3.5 h-3.5 mr-1.5" />}
              Clock Out
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={clockIn}
              disabled={clockingIn}
              className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0"
            >
              {clockingIn
                ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                : <LogIn className="w-3.5 h-3.5 mr-1.5" />}
              Clock In
            </Button>
          )}
        </div>
      )}

      {/* Temp password notice */}
      {tempPassword && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start justify-between gap-3">
          <div>
            <p className="font-medium text-amber-800 text-sm">Staff member created!</p>
            <p className="text-amber-700 text-sm mt-0.5">
              Temporary password: <code className="bg-amber-100 px-2 py-0.5 rounded font-bold">{tempPassword}</code>
            </p>
            <p className="text-xs text-amber-600 mt-1">Share this with the staff member to let them log in.</p>
          </div>
          <button onClick={() => setTempPassword(null)} className="text-amber-500 hover:text-amber-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <TableSkeleton rows={5} cols={5} />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {staff.length === 0 ? (
            <div className="py-16 text-center">
              <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-900">No staff members yet</p>
              <Button size="sm" className="mt-4 bg-teal-700 hover:bg-teal-800 text-white" onClick={openAdd}>
                Add First Staff
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Phone</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Last Shift</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Active</th>
                      <th className="text-right px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {staff.map((s) => {
                      const lastShift = s.shifts[0]
                      const isClockedIn = lastShift && !lastShift.clockOut
                      const isMe = s.id === currentUserId

                      return (
                        <tr key={s.id} className={`hover:bg-gray-50 ${isMe ? 'bg-teal-50/30' : ''}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                                isMe ? 'bg-teal-100 text-teal-700' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {s.name[0]}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">
                                  {s.name}
                                  {isMe && <span className="ml-1.5 text-xs text-teal-600 font-normal">(you)</span>}
                                </p>
                                <p className="text-xs text-gray-400">{s.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={s.role.toLowerCase()} label={s.role} />
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-sm">{s.phone || '—'}</td>
                          <td className="px-4 py-3">
                            {lastShift ? (
                              <div>
                                <p className={`text-xs font-medium flex items-center gap-1 ${isClockedIn ? 'text-green-600' : 'text-gray-500'}`}>
                                  {isClockedIn && <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />}
                                  {isClockedIn ? 'Clocked In' : 'Clocked Out'}
                                </p>
                                <p className="text-xs text-gray-400">{formatDateTime(lastShift.clockIn)}</p>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">No shifts</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Switch checked={s.isActive} onCheckedChange={() => toggleActive(s.id, s.isActive)} />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-gray-400 hover:text-slate-700"
                              onClick={() => openEdit(s)}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {staff.map((s) => {
                  const lastShift = s.shifts[0]
                  const isClockedIn = lastShift && !lastShift.clockOut
                  const isMe = s.id === currentUserId
                  return (
                    <div key={s.id} className={`p-4 flex items-center gap-3 ${isMe ? 'bg-teal-50/30' : ''}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${
                        isMe ? 'bg-teal-100 text-teal-700' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {s.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900 truncate">{s.name}</p>
                          {isClockedIn && <span className="text-xs text-green-600 font-medium">● In</span>}
                        </div>
                        <p className="text-xs text-gray-400">{s.role} · {s.email}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Switch checked={s.isActive} onCheckedChange={() => toggleActive(s.id, s.isActive)} />
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(s)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={(o) => {
        if (!o) { setFormOpen(false); setEditMember(null); reset() }
        else setFormOpen(true)
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editMember ? 'Edit Staff Member' : 'Add Staff Member'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Full Name *</Label>
                <Input {...register('name')} placeholder="Ali Khan" className="mt-1" />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <Label>Role *</Label>
                <select {...register('role')} className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="MANAGER">Manager</option>
                  <option value="CASHIER">Cashier</option>
                  <option value="VIEWER">Viewer</option>
                </select>
              </div>
            </div>

            <div>
              <Label>Email *</Label>
              <Input type="email" {...register('email')} placeholder="ali@store.com" className="mt-1" />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Phone</Label>
                <div className="mt-1">
                  <PhoneInput
                    value={watch('phone') || ''}
                    onChange={(e) => setValue('phone', e.target.value, { shouldValidate: true })}
                    placeholder="3001234567"
                  />
                </div>
              </div>
              <div>
                <Label>PIN (4 digits)</Label>
                <Input type="password" maxLength={4} {...register('pin')} placeholder="0000" className="mt-1" />
              </div>
            </div>

            <div>
              <Label>{editMember ? 'New Password' : 'Password'}</Label>
              <Input
                type="password"
                {...register('password')}
                placeholder={editMember ? 'Leave blank to keep current' : 'Leave blank to auto-generate'}
                className="mt-1"
              />
              {!editMember && <p className="text-xs text-gray-400 mt-1">Temporary password will be generated if left blank</p>}
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <Button type="button" variant="outline" onClick={() => { setFormOpen(false); setEditMember(null); reset() }}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-teal-700 hover:bg-teal-800 text-white">
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                {editMember ? 'Save Changes' : 'Add Staff'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* End-of-day clock out modal with drawer reconciliation */}
      <ClockOutModal
        open={clockOutOpen}
        onClose={() => setClockOutOpen(false)}
        onComplete={() => load()}
      />
    </div>
  )
}
