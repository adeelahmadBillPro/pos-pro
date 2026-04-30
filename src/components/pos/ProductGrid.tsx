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
              'relative flex flex-col rounded-xl border bg-white overflow-hidden text-left transition-all',
              'hover:shadow-md hover:border-violet-300 active:scale-95',
              'disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:active:scale-100'
            )}
          >
            {/* Image or icon */}
            <div className={cn(
              'aspect-square flex items-center justify-center bg-gray-50 overflow-hidden',
              isOutOfStock && 'grayscale'
            )}>
              {product.images[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="w-10 h-10 text-gray-300" />
              )}
            </div>

            {/* Stock badge */}
            <div className="absolute top-2 right-2">
              {isOutOfStock ? (
                <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
                  Out
                </span>
              ) : isLowStock ? (
                <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  {stock}
                </span>
              ) : (
                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                  {stock}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="p-2.5 flex flex-col gap-1 flex-1">
              <p className="text-xs font-medium text-slate-900 line-clamp-2 leading-tight">
                {product.name}
              </p>
              <p className="text-xs text-gray-400">{product.sku}</p>
              <p className="text-sm font-bold text-violet-600 mt-auto">
                {formatCurrency(product.price)}
              </p>
            </div>

            {/* Add button overlay on hover */}
            {!isOutOfStock && (
              <div className="absolute bottom-0 left-0 right-0 bg-violet-600 text-white text-xs py-1.5 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <ShoppingCart className="w-3 h-3" />
                Add
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
