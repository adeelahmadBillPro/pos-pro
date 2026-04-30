'use client'

import { useState, useRef } from 'react'
import { Upload, Download, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Papa from 'papaparse'

interface ProductBulkImportProps {
  onImport: (data: Record<string, any>[]) => Promise<void>
  onClose?: () => void
}

const REQUIRED_FIELDS = ['name', 'sku', 'price']
const OPTIONAL_FIELDS = ['costPrice', 'description', 'barcode', 'unit', 'minStock', 'categoryId', 'trackStock', 'taxable']

const SAMPLE_DATA = [
  { name: 'T-Shirt Blue M', sku: 'TSH-BLU-M', price: 1500, costPrice: 900, unit: 'pcs', minStock: 5, trackStock: true, taxable: true },
  { name: 'T-Shirt Red L', sku: 'TSH-RED-L', price: 1500, costPrice: 900, unit: 'pcs', minStock: 5, trackStock: true, taxable: true },
  { name: 'Jeans Dark Blue', sku: 'JNS-DBL-32', price: 3500, costPrice: 2000, unit: 'pcs', minStock: 3, trackStock: true, taxable: true },
]

export function ProductBulkImport({ onImport, onClose }: ProductBulkImportProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [data, setData] = useState<Record<string, any>[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function parseFile(f: File) {
    setFile(f)
    setErrors([])
    setData([])

    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        const rows = results.data as Record<string, any>[]
        const firstRow = rows[0] || {}

        const missing = REQUIRED_FIELDS.filter((field) => !(field in firstRow))
        if (missing.length > 0) {
          setErrors([`Missing required columns: ${missing.join(', ')}`])
          return
        }

        const validationErrors: string[] = []
        rows.forEach((row, i) => {
          if (!row.name) validationErrors.push(`Row ${i + 2}: name is required`)
          if (!row.sku) validationErrors.push(`Row ${i + 2}: sku is required`)
          if (!row.price || isNaN(parseFloat(row.price))) validationErrors.push(`Row ${i + 2}: valid price is required`)
        })

        if (validationErrors.length > 0) {
          setErrors(validationErrors.slice(0, 8))
          return
        }

        setData(rows)
      },
      error: (err) => setErrors([`CSV parse error: ${err.message}`]),
    })
  }

  function downloadSample() {
    const csv = Papa.unparse(SAMPLE_DATA)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'sample-products.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport() {
    setImporting(true)
    try {
      await onImport(data)
      setDone(true)
    } catch {
      setErrors(['Import failed. Please try again.'])
    } finally {
      setImporting(false)
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center py-10 gap-3">
        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        <p className="font-semibold text-slate-800">{data.length} products imported!</p>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Field guide */}
      <div className="bg-violet-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs font-semibold text-blue-800 mb-1">Required columns:</p>
        <p className="text-xs text-violet-700 font-mono">{REQUIRED_FIELDS.join(', ')}</p>
        <p className="text-xs font-semibold text-blue-800 mt-2 mb-1">Optional columns:</p>
        <p className="text-xs text-violet-700 font-mono">{OPTIONAL_FIELDS.join(', ')}</p>
      </div>

      <Button variant="outline" size="sm" onClick={downloadSample}>
        <Download className="w-4 h-4 mr-2" /> Download Sample CSV
      </Button>

      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files[0]; if (f) parseFile(f) }}
          onClick={() => fileRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
            isDragOver ? 'border-blue-400 bg-violet-50' : 'border-gray-300 hover:border-gray-400'
          )}
        >
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-700 font-medium">Drop your CSV here or click to browse</p>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) parseFile(f) }} />
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <FileText className="w-5 h-5 text-violet-500" />
          <div className="flex-1">
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-gray-500">{data.length > 0 ? `${data.length} products ready to import` : 'Parsing...'}</p>
          </div>
          <button onClick={() => { setFile(null); setData([]); setErrors([]) }}><X className="w-4 h-4 text-gray-400" /></button>
        </div>
      )}

      {errors.map((e, i) => (
        <div key={i} className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-2.5 border border-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{e}</span>
        </div>
      ))}

      {data.length > 0 && (
        <>
          <div className="border border-gray-200 rounded-lg overflow-auto max-h-40">
            <table className="text-xs w-full">
              <thead className="bg-gray-50">
                <tr>{Object.keys(data[0]).slice(0, 6).map((k) => (<th key={k} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">{k}</th>))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.slice(0, 5).map((row, i) => (
                  <tr key={i}>{Object.values(row).slice(0, 6).map((v: any, j) => (<td key={j} className="px-3 py-1.5 whitespace-nowrap">{String(v ?? '')}</td>))}</tr>
                ))}
              </tbody>
            </table>
            {data.length > 5 && <p className="text-xs text-gray-400 text-center py-2">+{data.length - 5} more rows</p>}
          </div>
          <Button onClick={handleImport} disabled={importing} className="w-full">
            {importing ? 'Importing...' : `Import ${data.length} Products`}
          </Button>
        </>
      )}
    </div>
  )
}
