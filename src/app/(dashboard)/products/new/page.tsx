'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { productSchema, type ProductInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'
import { toast } from 'sonner'
import { Loader2, Upload, X, RefreshCw } from 'lucide-react'

interface Category {
  id: string
  name: string
}

export default function NewProductPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductInput>({
    resolver: standardSchemaResolver(productSchema) as any,
    defaultValues: {
      trackStock: true,
      taxable: true,
      minStock: 5,
      unit: 'pcs',
      costPrice: 0,
      images: [],
    },
  })

  const trackStock = watch('trackStock')
  const taxable = watch('taxable')

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((res) => { if (res.success) setCategories(res.data) })
      .catch(() => {})
  }, [])

  function generateSKU() {
    const name = watch('name') || 'PROD'
    const prefix = name.split(' ').map((w: string) => w.slice(0, 3).toUpperCase()).join('-')
    const rand = Math.floor(100 + Math.random() * 900)
    setValue('sku', `${prefix}-${rand}`)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'uploads/products')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success) {
        const newImages = [...images, data.data.url]
        setImages(newImages)
        setValue('images', newImages)
      } else {
        toast.error(data.error || 'Upload failed')
      }
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function removeImage(index: number) {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
    setValue('images', newImages)
  }

  async function onSubmit(data: ProductInput) {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, images }),
      })
      const result = await res.json()
      if (result.success) {
        toast.success('Product created successfully')
        router.push('/products')
      } else {
        toast.error(result.error || 'Failed to create product')
      }
    } catch {
      toast.error('Failed to create product')
    }
  }

  return (
    <div>
      <PageHeader
        title="Add Product"
        breadcrumbs={[
          { label: 'Products', href: '/products' },
          { label: 'New Product' },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input id="name" {...register('name')} placeholder="e.g. Rice Basmati 5kg" className="mt-1" />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sku">SKU *</Label>
                <div className="flex gap-2 mt-1">
                  <Input id="sku" {...register('sku')} placeholder="e.g. RICE-001" />
                  <Button type="button" variant="outline" size="sm" onClick={generateSKU} title="Auto-generate SKU">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {errors.sku && <p className="text-xs text-red-600 mt-1">{errors.sku.message}</p>}
              </div>
              <div>
                <Label htmlFor="barcode">Barcode</Label>
                <Input id="barcode" {...register('barcode')} placeholder="Scan or enter barcode" className="mt-1" />
              </div>
            </div>

            <div>
              <Label htmlFor="categoryId">Category</Label>
              <select
                id="categoryId"
                {...register('categoryId')}
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register('description')} placeholder="Product description..." className="mt-1" rows={3} />
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Selling Price (Rs) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min={0.01}
                  {...register('price', { valueAsNumber: true })}
                  placeholder="0.00"
                  className="mt-1"
                />
                {errors.price && <p className="text-xs text-red-600 mt-1">{errors.price.message}</p>}
              </div>
              <div>
                <Label htmlFor="costPrice">Cost Price (Rs)</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  min={0}
                  {...register('costPrice', { valueAsNumber: true })}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-slate-900">Taxable</p>
                <p className="text-xs text-gray-500">Apply tax on this product</p>
              </div>
              <Switch
                checked={taxable}
                onCheckedChange={(v) => setValue('taxable', v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Inventory */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-slate-900">Track Stock</p>
                <p className="text-xs text-gray-500">Monitor inventory levels</p>
              </div>
              <Switch
                checked={trackStock}
                onCheckedChange={(v) => setValue('trackStock', v)}
              />
            </div>

            {trackStock && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minStock">Min Stock Alert</Label>
                  <Input
                    id="minStock"
                    type="number"
                    min={0}
                    {...register('minStock', { valueAsNumber: true })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <select
                    id="unit"
                    {...register('unit')}
                    className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pcs">pcs (Pieces)</option>
                    <option value="kg">kg (Kilogram)</option>
                    <option value="g">g (Gram)</option>
                    <option value="l">l (Liter)</option>
                    <option value="ml">ml (Milliliter)</option>
                    <option value="box">box</option>
                    <option value="pack">pack</option>
                    <option value="dozen">dozen</option>
                    <option value="meter">meter</option>
                  </select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative w-20 h-20">
                  <img src={img} alt="" className="w-full h-full object-cover rounded-lg border border-gray-200" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              <label className={`w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors ${uploading ? 'opacity-50 cursor-wait' : ''}`}>
                {uploading ? (
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-400">Add</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting} className="bg-violet-600 hover:bg-violet-700 text-white">
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Product
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/products')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
