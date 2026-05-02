'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { User, Mail, Phone, Lock, Save, Camera, Eye, EyeOff, Shield, Calendar, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/PageHeader'
import { PhoneInput } from '@/components/shared/PhoneInput'

interface ProfileData {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  avatar: string | null
  createdAt: string
  store: { name: string } | null
}

export default function ProfilePage() {
  const { update: updateSession } = useSession()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [avatar, setAvatar] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setProfile(res.data)
          setName(res.data.name ?? '')
          setEmail(res.data.email ?? '')
          setPhone(res.data.phone ?? '')
          setAvatar(res.data.avatar ?? '')
        }
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [])

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }

    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'avatars')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const json = await res.json()
      if (!json.success) { toast.error('Upload failed'); return }
      setAvatar(json.data.url)
      toast.success('Avatar uploaded — click Save to apply')
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (newPassword && newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    if (newPassword && !currentPassword) {
      toast.error('Enter your current password to change it')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          // email intentionally omitted — server ignores it anyway, but no point sending
          phone,
          avatar,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) {
        toast.error(json.error || 'Update failed')
        return
      }
      toast.success('Profile updated successfully')
      setProfile(json.data)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      // Refresh session so TopBar picks up new name/avatar
      try { await updateSession() } catch {}
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12 text-gray-500">
        Profile not found
      </div>
    )
  }

  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'
  const memberSince = new Date(profile.createdAt).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric',
  })

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="My Profile"
        description="Manage your personal information and password"
      />

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Avatar Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden border-2 border-amber-300">
                {avatar ? (
                  <img src={avatar} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-teal-700 text-2xl font-bold">{initials}</span>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-400 hover:bg-amber-500 active:bg-amber-600 flex items-center justify-center cursor-pointer shadow-md transition-colors border-2 border-white">
                {uploadingAvatar ? (
                  <Loader2 className="w-3.5 h-3.5 text-slate-900 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5 text-slate-900" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                />
              </label>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-900 truncate">{name || 'Your Name'}</h2>
              <p className="text-sm text-gray-500 truncate">{email}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3" /> {profile.role}
                </span>
                {profile.store?.name && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" /> {profile.store.name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Member since {memberSince}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-teal-600" />
            Personal Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Full Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={100}
                className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                placeholder="Your full name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                Email
                <span className="ml-1 text-[10px] font-semibold uppercase bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Locked</span>
              </label>
              <input
                type="email"
                value={email}
                readOnly
                disabled
                title="Email cannot be changed for security. Contact support if you need to update it."
                className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
              />
              <p className="text-[11px] text-gray-500 leading-tight">
                Email is your login. To change it,{' '}
                <a href="mailto:support@pospro.pk" className="text-amber-700 hover:underline font-medium">
                  email support
                </a>{' '}
                — we&apos;ll verify and update for you.
              </p>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                Phone
              </label>
              <PhoneInput
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="3001234567"
              />
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
            <Lock className="w-4 h-4 text-teal-600" />
            Change Password
          </h3>
          <p className="text-xs text-gray-500 mb-4">Leave blank to keep your current password</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full h-11 px-3 pr-11 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowCurrent((p) => !p)}
                  className="absolute right-0 top-0 h-full px-3 flex items-center text-gray-400 hover:text-slate-700"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full h-11 px-3 pr-11 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowNew((p) => !p)}
                  className="absolute right-0 top-0 h-full px-3 flex items-center text-gray-400 hover:text-slate-700"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Confirm New Password</label>
              <input
                type={showNew ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                autoComplete="new-password"
                className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                placeholder="Re-enter new password"
              />
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-4 pb-2">
          <button
            type="submit"
            disabled={saving || uploadingAvatar}
            className="w-full md:w-auto md:ml-auto md:flex h-12 px-8 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
