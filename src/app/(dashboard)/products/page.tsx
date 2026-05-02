'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, Upload, Package, ArrowUp, ArrowDown, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchInput } from '@/components/shared/SearchInput'
import { DataTable } from '@/components/shared/DataTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { BulkImport, type FieldDef } from '@/components/shared/BulkImport'
import { ExportButton } from '@/components/shared/ExportButton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  sku: string
  barcode: string | null
  price: number
  costPrice: number
  images: string[]
  category: { id: string; name: string } | null
  isActive: boolean
  trackStock: boolean
  inventory: { quantity: number } | null
  minStock: number
}

interface Pagination {
  page: number
  pages: number
  total: number
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pages: 1, total: 0 })
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [reorderMode, setReorderMode] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)

  /** Move a product up or down within the current page's products array,
   *  then push the new order to the API so the change persists in POS too. */
  async function moveProduct(idx: number, direction: -1 | 1) {
    const newIdx = idx + direction
    if (newIdx < 0 || newIdx >= products.length) return
    const next = [...products]
    const [moved] = next.splice(idx, 1)
    next.splice(newIdx, 0, moved)
    setProducts(next)

    setSavingOrder(true)
    try {
      const res = await fetch('/api/products/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: next.map((p) => p.id) }),
      })
      const json = await res.json()
      if (!json.success) {
        toast.error(json.error || 'Could not save order')
        // Revert on failure
        setProducts(products)
      }
    } catch {
      toast.error('Network error')
      setProducts(products)
    } finally {
      setSavingOrder(false)
    }
  }

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((res) => { if (res.success) setCategories(res.data) })
      .catch(() => {})
  }, [])

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.set('search', search)
      if (categoryFilter) params.set('categoryId', categoryFilter)
      if (statusFilter) params.set('status', statusFilter)

      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()
      if (data.success) {
        setProducts(data.data)
        setPagination(data.pagination)
      }
    } catch {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [page, search, categoryFilter, statusFilter])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/products/${deleteId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Product deleted')
        setDeleteId(null)
        loadProducts()
      } else {
        toast.error(data.error || 'Failed to delete')
      }
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  const productFieldDefs: FieldDef[] = [
    {
      key: 'name', label: 'Product Name', required: true,
      example: 'Pepsi 500ml',
      description: 'Full product name (2–200 characters)',
      validate: (v) => v.length < 2 ? 'Name must be at least 2 characters' : null,
    },
    {
      key: 'sku', label: 'SKU', required: true,
      example: 'PEPSI-500',
      description: 'Unique stock-keeping unit code',
      validate: (v) => v.length < 1 ? 'SKU is required' : null,
    },
    {
      key: 'barcode', label: 'Barcode', required: false,
      example: '8901234567890',
      description: 'EAN/UPC barcode number (optional)',
    },
    {
      key: 'price', label: 'Selling Price (PKR)', required: true,
      example: '150',
      description: 'Customer-facing price in PKR, no commas',
      validate: (v) => isNaN(parseFloat(v)) || parseFloat(v) <= 0 ? 'Price must be a positive number' : null,
    },
    {
      key: 'costPrice', label: 'Cost Price (PKR)', required: false,
      example: '95',
      description: 'Your purchase/cost price in PKR',
      validate: (v) => v && isNaN(parseFloat(v)) ? 'Cost price must be a number' : null,
    },
    {
      key: 'category', label: 'Category Name', required: false,
      example: 'Beverages',
      description: 'Exact category name as listed in Categories page',
    },
    {
      key: 'unit', label: 'Unit', required: false,
      example: 'pcs',
      description: 'Unit of measure: pcs, kg, g, ltr, ml, box, dozen',
    },
    {
      key: 'initialStock', label: 'Opening Stock', required: false,
      example: '50',
      description: 'How many units you currently have. Default: 0',
      validate: (v) => v && isNaN(parseInt(v)) ? 'Opening stock must be a whole number' : null,
    },
    {
      key: 'minStock', label: 'Min Stock Level', required: false,
      example: '10',
      description: 'Low-stock alert threshold (default: 5)',
      validate: (v) => v && isNaN(parseInt(v)) ? 'Min stock must be a whole number' : null,
    },
    {
      key: 'taxable', label: 'Taxable', required: false,
      example: 'true',
      description: 'Include in tax calculation: true or false',
      validate: (v) => !['true', 'false', '1', '0', 'yes', 'no'].includes(v.toLowerCase()) ? 'Must be true or false' : null,
    },
    {
      key: 'image', label: 'Image URL', required: false,
      example: 'https://example.com/images/pepsi.jpg',
      description: 'Full HTTPS URL to product image (jpg/png/webp)',
      validate: (v) => {
        try { new URL(v); return null } catch { return 'Image must be a valid URL (https://...)' }
      },
    },
  ]

  async function handleImport(rows: Record<string, string>[]) {
    let success = 0
    let skipped = 0
    const errors: string[] = []

    // Build category name→id map
    const catMap: Record<string, string> = {}
    categories.forEach((c) => { catMap[c.name.toLowerCase()] = c.id })

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2
      try {
        // Resolve category by name
        const catName = (row.category || '').trim().toLowerCase()
        const categoryId = catName ? catMap[catName] : undefined

        // Parse image URL
        const imageUrl = (row.image || '').trim()
        const images = imageUrl ? [imageUrl] : []

        // Parse taxable
        const taxableStr = (row.taxable || 'true').toLowerCase()
        const taxable = !['false', '0', 'no'].includes(taxableStr)

        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: (row.name || '').trim(),
            sku: (row.sku || '').trim(),
            barcode: (row.barcode || '').trim() || undefined,
            price: parseFloat(row.price || '0'),
            costPrice: parseFloat(row.costPrice || '0'),
            categoryId: categoryId || undefined,
            trackStock: true,
            taxable,
            minStock: parseInt(row.minStock || '5') || 5,
            initialStock: parseInt(row.initialStock || '0') || 0,
            unit: (row.unit || 'pcs').trim(),
            images,
          }),
        })
        const data = await res.json()
        if (data.success) {
          success++
        } else if (res.status === 409) {
          // Duplicate SKU — silently skip, count separately
          skipped++
        } else {
          errors.push(`Row ${rowNum}: ${data.error}`)
        }
      } catch {
        errors.push(`Row ${rowNum}: Network error`)
      }
    }

    loadProducts()
    return { success, errors, skipped }
  }

  const columns = [
    {
      key: 'image',
      label: '',
      render: (p: Product) => (
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {p.images[0] ? (
            <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-5 h-5 text-gray-300" />
          )}
        </div>
      ),
      className: 'w-16',
      mobileHide: true,
    },
    {
      key: 'name',
      label: 'Product',
      render: (p: Product) => (
        <div className="flex items-center gap-2">
          {reorderMode && (
            <div className="flex flex-col gap-0.5 flex-shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); const idx = products.findIndex(x => x.id === p.id); moveProduct(idx, -1) }}
                disabled={savingOrder || products.findIndex(x => x.id === p.id) === 0}
                className="w-6 h-5 rounded border border-gray-200 hover:bg-amber-50 hover:border-amber-300 active:bg-amber-100 disabled:opacity-30 flex items-center justify-center transition-colors"
                title="Move up"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); const idx = products.findIndex(x => x.id === p.id); moveProduct(idx, 1) }}
                disabled={savingOrder || products.findIndex(x => x.id === p.id) === products.length - 1}
                className="w-6 h-5 rounded border border-gray-200 hover:bg-amber-50 hover:border-amber-300 active:bg-amber-100 disabled:opacity-30 flex items-center justify-center transition-colors"
                title="Move down"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="min-w-0">
            <p className="font-medium text-slate-900">{p.name}</p>
            <p className="text-xs text-gray-400">{p.sku}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      render: (p: Product) => (
        <div>
          <p className="font-medium">{formatCurrency(p.price)}</p>
          <p className="text-xs text-gray-400">Cost: {formatCurrency(p.costPrice)}</p>
        </div>
      ),
    },
    {
      key: 'stock',
      label: 'Stock',
      mobileHide: true,
      render: (p: Product) => {
        if (!p.trackStock) return <span className="text-xs text-gray-400">Not tracked</span>
        const qty = p.inventory?.quantity ?? 0
        return (
          <span className={`font-medium text-sm ${qty === 0 ? 'text-red-600' : qty <= p.minStock ? 'text-amber-600' : 'text-slate-900'}`}>
            {qty}
          </span>
        )
      },
    },
    {
      key: 'category',
      label: 'Category',
      mobileHide: true,
      render: (p: Product) => p.category?.name || <span className="text-gray-400">—</span>,
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (p: Product) => (
        <StatusBadge status={p.isActive ? 'active' : 'inactive'} />
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (p: Product) => (
        <div className="flex items-center gap-1">
          <Link href={`/products/${p.id}/edit`}>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <Edit className="w-3.5 h-3.5" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
            onClick={() => setDeleteId(p.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
      className: 'text-right',
    },
  ]

  return (
    <div>
      <PageHeader
        title="Products"
        description={`${pagination.total} products total`}
        actions={
          <>
            <Button
              variant={reorderMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setReorderMode((p) => !p)}
              className={reorderMode ? 'bg-amber-500 hover:bg-amber-600 text-slate-900' : ''}
              title="Drag products to change POS display order"
            >
              <GripVertical className="w-3.5 h-3.5 mr-1.5" />
              {reorderMode ? 'Done Reordering' : 'Reorder'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              Import
            </Button>
            <ExportButton
              data={products.map((p) => ({
                name: p.name,
                sku: p.sku,
                barcode: p.barcode || '',
                price: p.price,
                costPrice: p.costPrice,
                category: p.category?.name || '',
                stock: p.inventory?.quantity ?? 0,
                status: p.isActive ? 'active' : 'inactive',
              }))}
              filename="products"
            />
            <Link href="/products/new">
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Product
              </Button>
            </Link>
          </>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1) }}
          placeholder="Search by name, SKU, barcode..."
          className="flex-1 min-w-48"
        />
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-700"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-700"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <DataTable
          data={products}
          columns={columns}
          keyField="id"
          loading={loading}
          emptyMessage="No products found. Add your first product."
          mobileCard={(p: Product) => (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {p.images[0] ? (
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-6 h-6 text-gray-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{p.name}</p>
                <p className="text-xs text-gray-400">{p.sku}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-medium text-teal-700">{formatCurrency(p.price)}</span>
                  <span className="text-xs text-gray-400">Cost: {formatCurrency(p.costPrice)}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <StatusBadge status={p.isActive ? 'active' : 'inactive'} />
                <div className="flex items-center gap-1">
                  <Link href={`/products/${p.id}/edit`}>
                    <button className="p-1.5 text-gray-400 hover:text-teal-600 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                  </Link>
                  <button
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                    onClick={() => setDeleteId(p.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        />

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </p>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-7 text-xs"
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="h-7 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        description="This action cannot be undone. The product will be soft-deleted."
        confirmLabel="Delete"
        loading={deleting}
      />

      <BulkImport
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
        fieldDefs={productFieldDefs}
        title="Import Products"
        description="Upload a CSV with your products. Category must match an existing category name exactly."
      />
    </div>
  )
}
