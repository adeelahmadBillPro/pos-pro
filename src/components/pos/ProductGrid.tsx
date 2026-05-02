'use client'

import { ShoppingCart, Package, AlertTriangle } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { CartItem } from '@/types/index'

interface Product {
  id: string
  name: string
  sku: string
  price: number
  costPrice: number
  taxable: boolean
  unit: string
  images: string[]
  minStock: number
  description?: string | null
  inventory: { quantity: number } | null
}

interface ProductGridProps {
  products: Product[]
  onAdd: (item: CartItem) => void
}

export function ProductGrid({ products, onAdd }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Package className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm">No products found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {products.map((product) => {
        const stock = product.inventory?.quantity ?? 0
        const isOutOfStock = stock <= 0
        const isLowStock = !isOutOfStock && stock <= (product.minStock || 5)

        return (
          <button
            key={product.id}
            disabled={isOutOfStock}
            onClick={() => {
              onAdd({
                productId: product.id,
                name: product.name,
                sku: product.sku,
                price: product.price,
                costPrice: product.costPrice,
                quantity: 1,
                discount: 0,
                taxable: product.taxable,
                unit: product.unit,
                image: product.images[0],
              })
            }}
            className={cn(
              'group relative flex flex-col rounded-2xl border bg-white overflow-hidden text-left transition-all',
              'hover:shadow-lg hover:border-amber-300 hover:-translate-y-0.5 active:scale-[0.98]',
              'disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0'
            )}
          >
            {/* Image: big and prominent — kiku-style */}
            <div className={cn(
              'aspect-[5/4] flex items-center justify-center bg-gradient-to-br from-amber-50 to-gray-50 overflow-hidden',
              isOutOfStock && 'grayscale'
            )}>
              {product.images[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <Package className="w-12 h-12 text-amber-300" />
              )}
            </div>

            {/* Stock badge — only shown when low or out */}
            {(isOutOfStock || isLowStock) && (
              <div className="absolute top-2 right-2">
                {isOutOfStock ? (
                  <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide shadow-sm">
                    Out
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-semibold flex items-center gap-0.5 shadow-sm">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    Low ({stock})
                  </span>
                )}
              </div>
            )}

            {/* Info — name, description, price */}
            <div className="p-3 flex flex-col gap-1.5 flex-1">
              <p className="text-sm font-semibold text-slate-900 line-clamp-2 leading-tight">
                {product.name}
              </p>
              {product.description ? (
                <p className="text-[11px] text-gray-500 line-clamp-2 leading-snug">
                  {product.description}
                </p>
              ) : (
                <p className="text-[11px] text-gray-400">{product.sku}</p>
              )}
              <p className="text-base font-bold text-amber-700 mt-auto tabular-nums">
                {formatCurrency(product.price)}
                <span className="text-[10px] text-gray-400 font-normal ml-1">/ 1 {product.unit}</span>
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
