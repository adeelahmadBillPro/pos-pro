'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { settingsSchema, type SettingsInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'
import { FormSkeleton } from '@/components/shared/LoadingSkeleton'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsInput>({
    resolver: standardSchemaResolver(settingsSchema) as any,
    defaultValues: {
      currency: 'PKR',
      taxRate: 0,
      taxName: 'GST',
      taxEnabled: false,
      requireCustomer: false,
      allowNegativeStock: false,
      autoApplyTax: true,
      lowStockThreshold: 10,
    },
  })

  const taxEnabled = watch('taxEnabled')
  const autoApplyTax = watch('autoApplyTax')
  const requireCustomer = watch('requireCustomer')
  const allowNegativeStock = watch('allowNegativeStock')

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          const s = res.data
          reset({
            name: s.name,
            address: s.address || '',
            phone: s.phone || '',
            email: s.email || '',
            city: s.city || '',
            currency: s.currency,
            taxRate: s.taxRate,
            taxName: s.taxName,
            taxEnabled: s.taxEnabled,
            requireCustomer: s.requireCustomer,
            allowNegativeStock: s.allowNegativeStock,
            autoApplyTax: s.autoApplyTax,
            lowStockThreshold: s.lowStockThreshold,
            receiptHeader: s.receiptHeader || '',
            receiptFooter: s.receiptFooter || '',
          })
        }
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [reset])

  async function onSubmit(data: SettingsInput) {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (result.success) {
        toast.success('Settings saved successfully')
        reset(data)
      } else {
        toast.error(result.error || 'Failed to save')
      }
    } catch {
      toast.error('Failed to save settings')
    }
  }

  if (loading) {
    return (
      <div>
        <div className="h-16 mb-6" />
        <div className="max-w-2xl space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
              <FormSkeleton fields={4} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure your store settings"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        {/* Store Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Store Information</CardTitle>
            <CardDescription>Basic information shown on receipts and invoices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Store Name *</Label>
              <Input id="name" {...register('name')} className="mt-1" placeholder="My Store" />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register('phone')} className="mt-1" placeholder="03XX-XXXXXXX" />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" {...register('city')} className="mt-1" placeholder="Karachi" />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} className="mt-1" placeholder="store@email.com" />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" {...register('address')} className="mt-1" rows={2} placeholder="Shop #1, Main Bazaar..." />
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                {...register('currency')}
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="PKR">PKR — Pakistani Rupee</option>
                <option value="USD">USD — US Dollar</option>
                <option value="AED">AED — UAE Dirham</option>
                <option value="SAR">SAR — Saudi Riyal</option>
                <option value="GBP">GBP — British Pound</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Tax Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tax Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-slate-900">Enable Tax</p>
                <p className="text-xs text-gray-500">Apply tax to taxable products</p>
              </div>
              <Switch checked={taxEnabled} onCheckedChange={(v) => setValue('taxEnabled', v)} />
            </div>

            {taxEnabled && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tax Name</Label>
                    <Input {...register('taxName')} className="mt-1" placeholder="GST" />
                  </div>
                  <div>
                    <Label>Tax Rate (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      max={100}
                      {...register('taxRate', { valueAsNumber: true })}
                      className="mt-1"
                      placeholder="17"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Auto Apply Tax</p>
                    <p className="text-xs text-gray-500">Automatically add tax to all sales</p>
                  </div>
                  <Switch checked={autoApplyTax} onCheckedChange={(v) => setValue('autoApplyTax', v)} />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* POS Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">POS Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-slate-900">Require Customer</p>
                <p className="text-xs text-gray-500">Force customer selection before checkout</p>
              </div>
              <Switch checked={requireCustomer} onCheckedChange={(v) => setValue('requireCustomer', v)} />
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-slate-900">Allow Negative Stock</p>
                <p className="text-xs text-gray-500">Allow sales even when stock is zero</p>
              </div>
              <Switch checked={allowNegativeStock} onCheckedChange={(v) => setValue('allowNegativeStock', v)} />
            </div>

            <div>
              <Label>Low Stock Alert Threshold</Label>
              <Input
                type="number"
                min={0}
                {...register('lowStockThreshold', { valueAsNumber: true })}
                className="mt-1 max-w-32"
                placeholder="10"
              />
              <p className="text-xs text-gray-400 mt-1">Show warning when stock falls below this level</p>
            </div>
          </CardContent>
        </Card>

        {/* Receipt Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receipt Customization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Receipt Header</Label>
              <Textarea
                {...register('receiptHeader')}
                className="mt-1"
                rows={2}
                placeholder="Welcome to our store!"
              />
              <p className="text-xs text-gray-400 mt-1">Text shown at the top of receipts</p>
            </div>
            <div>
              <Label>Receipt Footer</Label>
              <Textarea
                {...register('receiptFooter')}
                className="mt-1"
                rows={2}
                placeholder="Thank you for your purchase!"
              />
              <p className="text-xs text-gray-400 mt-1">Text shown at the bottom of receipts</p>
            </div>
          </CardContent>
        </Card>

        {/* Save button */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  )
}
