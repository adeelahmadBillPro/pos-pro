'use client'

import { useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Printer, Share2, CheckCircle2, FileText } from 'lucide-react'

interface OrderItem {
  id: string
  name: string
  quantity: number
  unitPrice: number
  discount: number
  total: number
  sku: string
}

interface Payment {
  method: string
  amount: number
  change: number
}

interface ReceiptOrder {
  id: string
  orderNumber: string
  createdAt: string
  items: OrderItem[]
  subtotal: number
  discountAmount: number
  taxAmount: number
  total: number
  payments: Payment[]
  customer?: { name: string; phone?: string } | null
  cashier?: { name: string } | null
}

interface ReceiptModalProps {
  open: boolean
  onClose: () => void
  order: ReceiptOrder
  storeName?: string
  storeAddress?: string
  storePhone?: string
  receiptHeader?: string
  receiptFooter?: string
  loyaltyPointsEarned?: number
}

export function ReceiptModal({
  open,
  onClose,
  order,
  storeName = 'POS Store',
  storeAddress,
  storePhone,
  receiptHeader,
  receiptFooter,
  loyaltyPointsEarned = 0,
}: ReceiptModalProps) {
  const thermalRef = useRef<HTMLDivElement>(null)
  const [printMode, setPrintMode] = useState<'thermal' | 'a4'>('thermal')

  const cashPayment = order.payments.find((p) => p.method === 'CASH')
  const change = cashPayment?.change || 0
  const cashReceived = cashPayment ? cashPayment.amount + change : 0

  // ── Thermal 80mm Print ──────────────────────────────────────────────────
  function printThermal() {
    const win = window.open('', '_blank', 'width=400,height=600')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Receipt ${order.orderNumber}</title>
      <meta charset="utf-8">
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Courier New',monospace; font-size:12px; width:302px; margin:0 auto; padding:8px 12px; color:#000; }
        .c { text-align:center; }
        .r { text-align:right; }
        .b { font-weight:bold; }
        .lg { font-size:15px; }
        .xl { font-size:18px; }
        .sm { font-size:10px; }
        .dash { border-top:1px dashed #000; margin:6px 0; }
        .solid { border-top:1px solid #000; margin:6px 0; }
        table { width:100%; border-collapse:collapse; }
        td { padding:1px 0; vertical-align:top; }
        .item-name { max-width:160px; word-wrap:break-word; }
        .item-detail { font-size:10px; color:#555; padding-left:4px; }
        @media print {
          body { width:100%; }
          @page { margin:0; size:80mm auto; }
        }
      </style>
    </head><body>
      <div class="c b lg">${storeName}</div>
      ${storeAddress ? `<div class="c sm">${storeAddress}</div>` : ''}
      ${storePhone ? `<div class="c sm">Tel: ${storePhone}</div>` : ''}
      ${receiptHeader ? `<div class="c sm" style="margin-top:4px;font-style:italic">${receiptHeader}</div>` : ''}
      <div class="solid"></div>
      <table>
        <tr><td class="sm">Receipt#</td><td class="r b sm">${order.orderNumber}</td></tr>
        <tr><td class="sm">Date</td><td class="r sm">${formatDateTime(order.createdAt)}</td></tr>
        <tr><td class="sm">Cashier</td><td class="r sm">${order.cashier?.name || 'N/A'}</td></tr>
        ${order.customer ? `<tr><td class="sm">Customer</td><td class="r sm">${order.customer.name}</td></tr>` : ''}
      </table>
      <div class="dash"></div>
      <table>
        <thead><tr>
          <td class="b sm" style="width:55%">Item</td>
          <td class="r b sm" style="width:15%">Qty</td>
          <td class="r b sm" style="width:30%">Amount</td>
        </tr></thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td class="item-name sm">${item.name}</td>
              <td class="r sm">${item.quantity}</td>
              <td class="r sm">${formatCurrency(item.total)}</td>
            </tr>
            <tr><td colspan="3" class="item-detail">
              @ ${formatCurrency(item.unitPrice)}${item.discount > 0 ? ` (${item.discount}% off)` : ''}
            </td></tr>
          `).join('')}
        </tbody>
      </table>
      <div class="dash"></div>
      <table>
        <tr><td class="sm">Subtotal</td><td class="r sm">${formatCurrency(order.subtotal)}</td></tr>
        ${order.discountAmount > 0 ? `<tr><td class="sm">Discount</td><td class="r sm">-${formatCurrency(order.discountAmount)}</td></tr>` : ''}
        ${order.taxAmount > 0 ? `<tr><td class="sm">Tax</td><td class="r sm">${formatCurrency(order.taxAmount)}</td></tr>` : ''}
      </table>
      <div class="solid"></div>
      <table><tr>
        <td class="b lg">TOTAL</td>
        <td class="r b xl">${formatCurrency(order.total)}</td>
      </tr></table>
      <div class="dash"></div>
      <table>
        ${order.payments.map(p => `
          <tr><td class="sm">${p.method}</td><td class="r sm">${formatCurrency(p.amount)}</td></tr>
        `).join('')}
        ${change > 0 ? `<tr><td class="b sm">Change</td><td class="r b sm">${formatCurrency(change)}</td></tr>` : ''}
      </table>
      ${loyaltyPointsEarned > 0 ? `<div class="dash"></div><div class="c sm">⭐ Points Earned: ${loyaltyPointsEarned}</div>` : ''}
      <div class="dash"></div>
      <div class="c sm">${receiptFooter || 'Thank you for your purchase!'}</div>
      <div class="c sm" style="margin-top:4px">Powered by POS Pro</div>
      <br><br><br>
    </body></html>`)
    win.document.close()
    setTimeout(() => { win.print(); win.close() }, 300)
  }

  // ── A4 Invoice Print ────────────────────────────────────────────────────
  function printA4Invoice() {
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Invoice ${order.orderNumber}</title>
      <meta charset="utf-8">
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:Arial,sans-serif; font-size:13px; color:#1a1a1a; padding:40px; max-width:800px; margin:0 auto; }
        .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; }
        .store-name { font-size:26px; font-weight:800; color:#0f766e; }
        .store-info { font-size:12px; color:#666; margin-top:4px; line-height:1.6; }
        .invoice-label { font-size:28px; font-weight:700; color:#1a1a1a; text-align:right; }
        .invoice-meta { text-align:right; font-size:12px; color:#666; margin-top:6px; line-height:1.8; }
        .invoice-num { color:#0f766e; font-weight:700; }
        .divider { border-top:2px solid #0f766e; margin:20px 0; }
        .divider-light { border-top:1px solid #e5e7eb; margin:12px 0; }
        .bill-to { background:#f8f7f4; border-radius:8px; padding:16px; margin-bottom:24px; }
        .bill-to h3 { font-size:11px; text-transform:uppercase; letter-spacing:.08em; color:#666; margin-bottom:6px; }
        .bill-to p { font-size:13px; color:#1a1a1a; }
        table { width:100%; border-collapse:collapse; margin-bottom:24px; }
        thead tr { background:#0f766e; color:#fff; }
        th { padding:10px 12px; text-align:left; font-size:12px; font-weight:600; }
        th.r { text-align:right; }
        tbody tr { border-bottom:1px solid #f0f0f0; }
        tbody tr:nth-child(even) { background:#fafafa; }
        td { padding:10px 12px; font-size:13px; vertical-align:top; }
        td.r { text-align:right; }
        td.sku { font-size:11px; color:#888; }
        .totals { width:300px; margin-left:auto; }
        .totals table { margin-bottom:0; }
        .totals td { padding:6px 12px; font-size:13px; }
        .totals td.r { font-weight:600; }
        .total-row { border-top:2px solid #0f766e !important; }
        .total-row td { font-size:16px; font-weight:800; color:#0f766e; padding:10px 12px; }
        .payment-section { margin-top:24px; padding:16px; background:#f0fafa; border-radius:8px; border-left:4px solid #0f766e; }
        .payment-section h3 { font-size:12px; text-transform:uppercase; letter-spacing:.08em; color:#0f766e; margin-bottom:10px; font-weight:700; }
        .payment-row { display:flex; justify-content:space-between; font-size:13px; margin-bottom:4px; }
        .change-row { font-weight:700; color:#16a34a; }
        .footer { margin-top:40px; padding-top:20px; border-top:1px solid #e5e7eb; display:flex; justify-content:space-between; align-items:center; }
        .footer-note { font-size:12px; color:#666; }
        .loyalty-badge { background:#fef3c7; border:1px solid #f59e0b; border-radius:6px; padding:8px 14px; font-size:12px; color:#92400e; font-weight:600; }
        @media print { body { padding:20px; } @page { size:A4; margin:15mm; } }
      </style>
    </head><body>
      <div class="header">
        <div>
          <div class="store-name">${storeName}</div>
          <div class="store-info">
            ${storeAddress ? storeAddress + '<br>' : ''}
            ${storePhone ? 'Tel: ' + storePhone : ''}
          </div>
        </div>
        <div>
          <div class="invoice-label">INVOICE</div>
          <div class="invoice-meta">
            <span class="invoice-num">#${order.orderNumber}</span><br>
            Date: ${formatDateTime(order.createdAt)}<br>
            Cashier: ${order.cashier?.name || 'N/A'}
          </div>
        </div>
      </div>

      <div class="divider"></div>

      ${order.customer ? `
        <div class="bill-to">
          <h3>Bill To</h3>
          <p><strong>${order.customer.name}</strong></p>
          ${order.customer.phone ? `<p>${order.customer.phone}</p>` : ''}
        </div>
      ` : ''}

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Product</th>
            <th>SKU</th>
            <th class="r">Unit Price</th>
            <th class="r">Qty</th>
            <th class="r">Disc%</th>
            <th class="r">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map((item, i) => `
            <tr>
              <td style="color:#999;font-size:11px">${i + 1}</td>
              <td><strong>${item.name}</strong></td>
              <td class="sku">${item.sku}</td>
              <td class="r">${formatCurrency(item.unitPrice)}</td>
              <td class="r">${item.quantity}</td>
              <td class="r">${item.discount > 0 ? item.discount + '%' : '—'}</td>
              <td class="r"><strong>${formatCurrency(item.total)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <table>
          <tbody>
            <tr><td>Subtotal</td><td class="r">${formatCurrency(order.subtotal)}</td></tr>
            ${order.discountAmount > 0 ? `<tr><td style="color:#16a34a">Discount</td><td class="r" style="color:#16a34a">-${formatCurrency(order.discountAmount)}</td></tr>` : ''}
            ${order.taxAmount > 0 ? `<tr><td>Tax</td><td class="r">${formatCurrency(order.taxAmount)}</td></tr>` : ''}
            <tr class="total-row"><td>TOTAL</td><td class="r">${formatCurrency(order.total)}</td></tr>
          </tbody>
        </table>
      </div>

      <div class="payment-section">
        <h3>Payment Details</h3>
        ${order.payments.map(p => `
          <div class="payment-row"><span>${p.method}</span><span>${formatCurrency(p.amount)}</span></div>
        `).join('')}
        ${change > 0 ? `<div class="payment-row change-row"><span>Change Returned</span><span>${formatCurrency(change)}</span></div>` : ''}
      </div>

      <div class="footer">
        <div class="footer-note">
          ${receiptFooter || 'Thank you for your business!'}<br>
          <span style="font-size:11px;color:#aaa">Powered by POS Pro</span>
        </div>
        ${loyaltyPointsEarned > 0 ? `<div class="loyalty-badge">⭐ ${loyaltyPointsEarned} Points Earned</div>` : ''}
      </div>
    </body></html>`)
    win.document.close()
    setTimeout(() => { win.print(); win.close() }, 300)
  }

  // ── WhatsApp share ──────────────────────────────────────────────────────
  function handleWhatsApp() {
    const lines = [
      `*${storeName}*`,
      storePhone ? `Tel: ${storePhone}` : null,
      ``,
      `*Invoice #${order.orderNumber}*`,
      `Date: ${formatDateTime(order.createdAt)}`,
      order.customer ? `Customer: ${order.customer.name}` : null,
      ``,
      `*Items:*`,
      ...order.items.map(i =>
        `• ${i.name} x${i.quantity} @ ${formatCurrency(i.unitPrice)}${i.discount > 0 ? ` (-${i.discount}%)` : ''} = *${formatCurrency(i.total)}*`
      ),
      ``,
      `Subtotal: ${formatCurrency(order.subtotal)}`,
      order.discountAmount > 0 ? `Discount: -${formatCurrency(order.discountAmount)}` : null,
      order.taxAmount > 0 ? `Tax: ${formatCurrency(order.taxAmount)}` : null,
      `*TOTAL: ${formatCurrency(order.total)}*`,
      change > 0 ? `Change: ${formatCurrency(change)}` : null,
      loyaltyPointsEarned > 0 ? `⭐ Points Earned: ${loyaltyPointsEarned}` : null,
      ``,
      receiptFooter || 'Thank you for your purchase!',
    ].filter(Boolean).join('\n')

    const phone = order.customer?.phone?.replace(/[^0-9]/g, '') || ''
    const url = `https://wa.me/${phone ? `92${phone.slice(-10)}` : ''}?text=${encodeURIComponent(lines)}`
    window.open(url, '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full mx-2 p-0 flex flex-col max-h-[95dvh]">
        <DialogHeader className="px-5 pt-5 pb-3 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="w-5 h-5" />
            Sale Complete — #{order.orderNumber}
          </DialogTitle>
        </DialogHeader>

        {/* Receipt preview */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-4 font-mono text-xs space-y-2">
            {/* Store header */}
            <div className="text-center space-y-0.5">
              <p className="font-bold text-sm">{storeName}</p>
              {storeAddress && <p className="text-gray-500">{storeAddress}</p>}
              {storePhone && <p className="text-gray-500">{storePhone}</p>}
              {receiptHeader && <p className="text-gray-600 italic">{receiptHeader}</p>}
            </div>
            <div className="border-t border-dashed border-gray-400" />

            {/* Meta */}
            <div className="space-y-0.5">
              <div className="flex justify-between"><span className="text-gray-500">Receipt#</span><span className="font-semibold">{order.orderNumber}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Date</span><span>{formatDateTime(order.createdAt)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Cashier</span><span>{order.cashier?.name || 'N/A'}</span></div>
              {order.customer && <div className="flex justify-between"><span className="text-gray-500">Customer</span><span>{order.customer.name}</span></div>}
            </div>
            <div className="border-t border-dashed border-gray-400" />

            {/* Items */}
            <div className="space-y-1">
              {order.items.map((item) => (
                <div key={item.id}>
                  <div className="flex justify-between">
                    <span className="flex-1 pr-2 truncate font-medium">{item.name}</span>
                    <span className="font-semibold">{formatCurrency(item.total)}</span>
                  </div>
                  <div className="text-gray-400 pl-2">
                    {item.quantity} × {formatCurrency(item.unitPrice)}{item.discount > 0 ? ` (-${item.discount}%)` : ''}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed border-gray-400" />

            {/* Totals */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
              {order.discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(order.discountAmount)}</span></div>}
              {order.taxAmount > 0 && <div className="flex justify-between text-gray-500"><span>Tax</span><span>{formatCurrency(order.taxAmount)}</span></div>}
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-gray-300">
                <span>TOTAL</span><span>{formatCurrency(order.total)}</span>
              </div>
            </div>
            <div className="border-t border-dashed border-gray-400" />

            {/* Payment */}
            <div className="space-y-0.5">
              {order.payments.map((p, i) => (
                <div key={i} className="flex justify-between text-gray-500">
                  <span>{p.method}</span><span>{formatCurrency(p.amount)}</span>
                </div>
              ))}
              {change > 0 && <div className="flex justify-between font-bold text-green-600"><span>Change</span><span>{formatCurrency(change)}</span></div>}
            </div>

            {loyaltyPointsEarned > 0 && (
              <div className="text-center text-amber-600 font-semibold">⭐ {loyaltyPointsEarned} Points Earned!</div>
            )}
            <div className="border-t border-dashed border-gray-400" />
            <div className="text-center text-gray-400">{receiptFooter || 'Thank you for your purchase!'}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 pt-3 border-t flex-shrink-0 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" className="flex-col h-14 text-xs gap-1" onClick={printThermal}>
              <Printer className="w-4 h-4" />
              <span>Thermal<br/>80mm</span>
            </Button>
            <Button variant="outline" className="flex-col h-14 text-xs gap-1" onClick={printA4Invoice}>
              <FileText className="w-4 h-4" />
              <span>A4<br/>Invoice</span>
            </Button>
            <Button
              variant="outline"
              className="flex-col h-14 text-xs gap-1 text-green-700 border-green-200 hover:bg-green-50"
              onClick={handleWhatsApp}
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </Button>
          </div>
          <Button
            className="w-full h-11 bg-teal-700 hover:bg-teal-800 text-white font-semibold"
            onClick={onClose}
          >
            New Sale
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
