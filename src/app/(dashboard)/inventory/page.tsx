'use client'

import { useState, useEffect, useCallback } from 'react'
import { Package, Search, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ExportButton } from '@/components/shared/ExportButton'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { AdjustStockModal } from '@/components/inventory/AdjustStockModal'
import { cn } from '@/lib/utils'

interface InventoryItem {
  id: string
  quantity: number
  stockStatus: 'ok' | 'low' | 'out'
  product: {
    id: string
    name: string
    sku: string
    barcode: string | null
    minStock: number
    unit: string
    price: number
    costPrice: number
    category: { id: string; name: string } | null
  }
}

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'ok', label: 'In Stock' },
  { value: 'low', label: 'Low Stock' },
  { value: 'out', label: 'Out of Stock' },
]

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null)

  const fetchInventory = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '25' })
      if (search) params.set('search', search)
      if (status !== 'all') params.set('status', status)

      const res = await fetch(`/api/inventory?${params}`)
      const json = await res.json()
      if (json.success) {
        setItems(json.data)
        setPagination(json.pagination)
      }
    } catch {
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }, [page, search, status])

  useEffect(() => { fetchInventory() }, [fetchInventory])

  const exportData = items.map((item) => ({
    Name: item.product.name,
    SKU: item.product.sku,
    Barcode: item.product.barcode || '',
    Category: item.product.category?.name || '',
    'Current Stock': item.quantity,
    'Min Stock': item.product.minStock,
    Unit: item.product.unit,
    Status: item.stockStatus === 'ok' ? 'In Stock' : item.stockStatus === 'low' ? 'Low Stock' : 'Out of Stock',
    'Stock Value': item.quantity * item.product.costPrice,
  }))

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Track and manage product stock levels"
        actions={
          <ExportButton data={exportData} filename="inventory" label="Export CSV" size="sm" />
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatus(tab.value); setPage(1) }}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                status === tab.value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <TableSkeleton rows={8} cols={6} />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 flex flex-col items-center gap-3">
          <Package className="w-12 h-12 text-gray-300" />
          <p className="font-medium text-gray-600">No inventory items found</p>
          {search && (
            <Button variant="outline" size="sm" onClick={() => setSearch('')}>Clear search</Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Product', 'SKU', 'Category', 'Current Stock', 'Min Stock', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className={cn('hover:bg-gray-50 transition-colors', item.stockStatus === 'out' && 'bg-red-50/30')}>
                    <td className="px-4 py-3 font-medium text-slate-800">{item.product.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{item.product.sku}</td>
                    <td className="px-4 py-3 text-gray-500">{item.product.category?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'font-bold text-base',
                        item.stockStatus === 'out' ? 'text-red-600' : item.stockStatus === 'low' ? 'text-amber-600' : 'text-slate-800'
                      )}>
                        {item.quantity}
                      </span>
                      <span className="text-gray-400 text-xs ml-1">{item.product.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.product.minStock}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={item.stockStatus}
                        label={item.stockStatus === 'ok' ? 'In Stock' : item.stockStatus === 'low' ? 'Low Stock' : 'Out of Stock'}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => setAdjustItem(item)}
                      >
                        Adjust
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {items.map((item) => (
              <div key={item.id} className={cn('p-4', item.stockStatus === 'out' && 'bg-red-50/30')}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{item.product.name}</p>
                    <p className="text-xs text-gray-500 font-mono">{item.product.sku}</p>
                    {item.product.category && (
                      <p className="text-xs text-gray-400">{item.product.category.name}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={cn(
                      'text-xl font-bold',
                      item.stockStatus === 'out' ? 'text-red-600' : item.stockStatus === 'low' ? 'text-amber-600' : 'text-slate-800'
                    )}>
                      {item.quantity}
                    </p>
                    <p className="text-xs text-gray-400">{item.product.unit}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <StatusBadge
                    status={item.stockStatus}
                    label={item.stockStatus === 'ok' ? 'In Stock' : item.stockStatus === 'low' ? 'Low Stock' : 'Out of Stock'}
                  />
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => setAdjustItem(item)}>
                    Adjust Stock
                  </Button>
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
            Page {page} of {pagination.pages} ({pagination.total} items)
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustItem && (
        <AdjustStockModal
          open={!!adjustItem}
          onClose={() => setAdjustItem(null)}
          product={{
            id: adjustItem.product.id,
            name: adjustItem.product.name,
            sku: adjustItem.product.sku,
            unit: adjustItem.product.unit,
            currentStock: adjustItem.quantity,
          }}
          onSuccess={() => {
            setAdjustItem(null)
            fetchInventory()
          }}
        />
      )}
    </div>
  )
}
