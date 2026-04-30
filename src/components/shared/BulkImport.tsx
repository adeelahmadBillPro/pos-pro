'use client'

import { useState, useRef, useCallback } from 'react'
import Papa from 'papaparse'
import {
  Upload, X, FileText, CheckCircle2, AlertTriangle,
  Loader2, Download, Info, ClipboardPaste, Table2,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface FieldDef {
  key: string
  label: string
  required: boolean
  example: string
  description: string
  validate?: (val: string) => string | null
}

interface BulkImportProps {
  open: boolean
  onClose: () => void
  onImport: (rows: Record<string, string>[]) => Promise<{ success: number; errors: string[]; skipped?: number }>
  fieldDefs?: FieldDef[]
  templateHeaders?: string[]
  title?: string
  description?: string
}

type TabType = 'csv' | 'paste'

export function BulkImport({
  open,
  onClose,
  onImport,
  fieldDefs,
  templateHeaders,
  title = 'Bulk Import',
  description,
}: BulkImportProps) {
  const [tab, setTab] = useState<TabType>('csv')
  const [file, setFile] = useState<File | null>(null)
  const [pasteText, setPasteText] = useState('')
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ success: number; errors: string[]; skipped?: number } | null>(null)
  const [pasteReady, setPasteReady] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const effectiveHeaders = fieldDefs
    ? fieldDefs.map((f) => f.key)
    : templateHeaders ?? []

  function downloadTemplate() {
    const hdrs = effectiveHeaders
    let csvContent = hdrs.join(',') + '\n'
    if (fieldDefs) {
      const sampleRow = fieldDefs.map((f) => {
        const val = f.example.includes(',') ? `"${f.example}"` : f.example
        return val
      })
      csvContent += sampleRow.join(',') + '\n'
    }
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-template.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function validateRows(rows: Record<string, string>[]): string[] {
    if (!fieldDefs) return []
    const errors: string[] = []
    rows.forEach((row, idx) => {
      const rowNum = idx + 2
      fieldDefs.forEach((field) => {
        const val = (row[field.key] || '').trim()
        if (field.required && !val) {
          errors.push(`Row ${rowNum}: "${field.label}" is required`)
          return
        }
        if (val && field.validate) {
          const err = field.validate(val)
          if (err) errors.push(`Row ${rowNum}: ${err}`)
        }
      })
    })
    return errors
  }

  function processRows(rows: Record<string, string>[]) {
    setHeaders(Object.keys(rows[0] || {}))
    setPreview(rows.slice(0, 5))
    const errs = validateRows(rows)
    setValidationErrors(errs)
  }

  function parseFile(f: File) {
    setFile(f)
    setResult(null)
    setValidationErrors([])
    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        processRows(results.data as Record<string, string>[])
      },
    })
  }

  // Parse tab-separated paste (from Excel/Sheets)
  function parsePaste(text: string) {
    const lines = text.trim().split('\n').filter(Boolean)
    if (lines.length < 2) {
      setPasteReady(false)
      setPreview([])
      setHeaders([])
      setValidationErrors([])
      return
    }

    // Detect delimiter: tab (Excel) or comma (Sheets CSV copy)
    const firstLine = lines[0]
    const delimiter = firstLine.includes('\t') ? '\t' : ','

    const hdrs = firstLine.split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ''))
    const rows: Record<string, string>[] = []

    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ''))
      const row: Record<string, string> = {}
      hdrs.forEach((h, idx) => { row[h] = cells[idx] || '' })
      rows.push(row)
    }

    setResult(null)
    setValidationErrors([])
    processRows(rows)
    setPasteReady(rows.length > 0)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && f.name.endsWith('.csv')) parseFile(f)
  }, [])

  async function getRawRows(): Promise<Record<string, string>[]> {
    if (tab === 'paste') {
      const lines = pasteText.trim().split('\n').filter(Boolean)
      const firstLine = lines[0]
      const delimiter = firstLine.includes('\t') ? '\t' : ','
      const hdrs = firstLine.split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ''))
      const rows: Record<string, string>[] = []
      for (let i = 1; i < lines.length; i++) {
        const cells = lines[i].split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ''))
        const row: Record<string, string> = {}
        hdrs.forEach((h, idx) => { row[h] = cells[idx] || '' })
        rows.push(row)
      }
      return rows
    }
    return new Promise<Record<string, string>[]>((resolve) => {
      Papa.parse(file!, {
        header: true,
        skipEmptyLines: true,
        complete: (r) => resolve(r.data as Record<string, string>[]),
      })
    })
  }

  async function handleImport() {
    if (tab === 'csv' && !file) return
    if (tab === 'paste' && !pasteReady) return
    setImporting(true)
    setResult(null)
    try {
      const allRows = await getRawRows()
      const res = await onImport(allRows)
      setResult(res)
    } finally {
      setImporting(false)
    }
  }

  function handleClose() {
    setFile(null)
    setPasteText('')
    setPreview([])
    setHeaders([])
    setResult(null)
    setValidationErrors([])
    setPasteReady(false)
    setTab('csv')
    onClose()
  }

  function switchTab(t: TabType) {
    setTab(t)
    setFile(null)
    setPasteText('')
    setPreview([])
    setHeaders([])
    setResult(null)
    setValidationErrors([])
    setPasteReady(false)
  }

  const hasData = tab === 'csv' ? !!file : pasteReady
  const canImport = hasData && validationErrors.length === 0 && !result

  // Preview table shared between both modes
  const PreviewTable = () => (
    preview.length > 0 ? (
      <div>
        <p className="text-xs text-gray-500 mb-2">Preview — first {preview.length} row{preview.length !== 1 ? 's' : ''}:</p>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                {headers.map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 border-r border-gray-200 last:border-r-0 whitespace-nowrap">
                    {h}
                    {fieldDefs?.find(f => f.key === h)?.required && (
                      <span className="text-red-400 ml-0.5">*</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {preview.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  {headers.map((h) => (
                    <td key={h} className="px-3 py-2 border-r border-gray-100 last:border-r-0 max-w-40 truncate">
                      {row[h] ? (
                        (h === 'image' || h === 'images') && row[h].startsWith('http') ? (
                          <span className="flex items-center gap-1">
                            <img src={row[h]} alt="" className="w-6 h-6 rounded object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                            <span className="truncate text-teal-600 text-xs">{row[h].slice(0, 30)}…</span>
                          </span>
                        ) : row[h]
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ) : null
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl w-full mx-2 p-0 flex flex-col max-h-[90dvh]">
        <DialogHeader className="px-6 pt-5 pb-3 border-b flex-shrink-0">
          <DialogTitle>{title}</DialogTitle>
          {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Field guide */}
          {fieldDefs && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 bg-slate-100">
                <Info className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Field Guide</span>
              </div>
              <div className="divide-y divide-slate-100">
                {fieldDefs.map((f) => (
                  <div key={f.key} className="flex items-start gap-3 px-4 py-2.5">
                    <code className="text-xs bg-white border border-slate-200 rounded px-1.5 py-0.5 font-mono text-slate-700 flex-shrink-0 mt-0.5">
                      {f.key}
                    </code>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-slate-700">{f.label}</span>
                        {f.required ? (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">required</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">optional</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{f.description}</p>
                      <p className="text-xs text-teal-600 mt-0.5">Example: <span className="font-mono">{f.example}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image-import tip — only shown when import has an image field */}
          {fieldDefs?.some((f) => f.key === 'image' || f.key === 'images') && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
              <p className="font-semibold mb-1 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Adding product images
              </p>
              <ul className="space-y-1 ml-5 list-disc text-amber-800">
                <li>Upload your images first to any free host: <span className="font-mono">imgur.com</span>, <span className="font-mono">cloudinary.com</span>, Google Drive (set "Anyone with link"), or your own storage.</li>
                <li>Copy the <em>direct image URL</em> (must end with <span className="font-mono">.jpg</span>, <span className="font-mono">.png</span>, or <span className="font-mono">.webp</span>) and paste it into the <span className="font-mono bg-white px-1 rounded">image</span> column.</li>
                <li>Leave the column empty if you'd rather upload images later from the product edit page.</li>
              </ul>
            </div>
          )}

          {/* Template download */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
              <Download className="w-3.5 h-3.5" />
              Download Template CSV
            </Button>
            <span className="text-xs text-gray-400">Includes headers + 1 sample row</span>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
            <button
              onClick={() => switchTab('csv')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                tab === 'csv'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-gray-500 hover:text-slate-700'
              )}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload CSV
            </button>
            <button
              onClick={() => switchTab('paste')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                tab === 'paste'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-gray-500 hover:text-slate-700'
              )}
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              Paste from Excel / Sheets
            </button>
          </div>

          {/* CSV Upload Tab */}
          {tab === 'csv' && (
            <div className="space-y-3">
              {!file ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onClick={() => inputRef.current?.click()}
                  className={cn(
                    'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors',
                    isDragging
                      ? 'border-teal-400 bg-teal-50'
                      : 'border-gray-300 hover:border-teal-400 hover:bg-gray-50'
                  )}
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-700 font-medium">Drag & drop your CSV file here</p>
                  <p className="text-xs text-gray-400 mt-1">or click to browse — .csv files only</p>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && parseFile(e.target.files[0])}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-600" />
                      <span className="text-sm font-medium text-slate-900">{file.name}</span>
                      <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <button onClick={() => { setFile(null); setPreview([]); setHeaders([]); setValidationErrors([]) }}>
                      <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                  {validationErrors.length > 0 && <ValidationErrorBox errors={validationErrors} />}
                  <PreviewTable />
                </div>
              )}
            </div>
          )}

          {/* Paste Tab */}
          {tab === 'paste' && (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 space-y-1">
                <div className="flex items-center gap-2 text-amber-800 text-xs font-semibold">
                  <Table2 className="w-4 h-4 flex-shrink-0" />
                  How to paste from Excel or Google Sheets
                </div>
                <ol className="text-xs text-amber-700 space-y-0.5 ml-5 list-decimal">
                  <li>Open your Excel / Google Sheets file</li>
                  <li>Make sure the <strong>first row has column headers</strong> (e.g. name, sku, price…)</li>
                  <li>Select all rows including the header row</li>
                  <li>Copy (<kbd className="bg-amber-100 px-1 rounded">Ctrl+C</kbd>) and paste below</li>
                </ol>
                <p className="text-xs text-amber-600 mt-1">
                  Column names must match the field keys shown in the Field Guide above (e.g. <code className="bg-amber-100 px-1 rounded">name</code>, <code className="bg-amber-100 px-1 rounded">sku</code>, <code className="bg-amber-100 px-1 rounded">price</code>).
                </p>
              </div>

              <textarea
                value={pasteText}
                onChange={(e) => {
                  setPasteText(e.target.value)
                  parsePaste(e.target.value)
                }}
                placeholder={'Paste your copied rows here…\n\nExample (tab-separated from Excel):\nname\tsku\tprice\tbarcode\nPepsi 500ml\tPEPSI-500\t150\t8901234567890'}
                rows={8}
                className="w-full font-mono text-xs border border-gray-200 rounded-lg p-3 resize-y focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50 placeholder:text-gray-400"
              />

              {pasteText && !pasteReady && (
                <p className="text-xs text-red-500">Need at least a header row + 1 data row.</p>
              )}

              {pasteReady && (
                <p className="text-xs text-teal-700 font-medium">
                  ✓ {preview.length < 5
                    ? `${preview.length} row${preview.length !== 1 ? 's' : ''} detected`
                    : `5+ rows detected`
                  } — ready to import
                </p>
              )}

              {validationErrors.length > 0 && <ValidationErrorBox errors={validationErrors} />}
              <PreviewTable />
            </div>
          )}

          {/* Import result */}
          {result && (
            <div className={cn(
              'rounded-lg p-4 space-y-2',
              result.errors.length === 0 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
            )}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-green-800">
                  {result.success} record{result.success !== 1 ? 's' : ''} imported successfully
                  {result.skipped ? ` · ${result.skipped} skipped (duplicate SKU)` : ''}
                </span>
              </div>
              {result.errors.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-amber-800 text-sm font-semibold mb-1">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {result.errors.length} rows failed:
                  </div>
                  <ul className="text-xs text-amber-700 space-y-0.5 ml-5 list-disc">
                    {result.errors.slice(0, 6).map((e, i) => <li key={i}>{e}</li>)}
                    {result.errors.length > 6 && <li>…and {result.errors.length - 6} more</li>}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex-shrink-0 flex gap-3 justify-end">
          <Button variant="outline" onClick={handleClose}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && hasData && (
            <Button
              onClick={handleImport}
              disabled={importing || !canImport}
              className="bg-teal-700 hover:bg-teal-800 text-white gap-2"
            >
              {importing && <Loader2 className="w-4 h-4 animate-spin" />}
              {importing ? 'Importing…' : `Import ${preview.length > 0 ? `(${preview.length}+ rows)` : ''}`}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ValidationErrorBox({ errors }: { errors: string[] }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-red-700 text-sm font-semibold">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        {errors.length} validation error{errors.length > 1 ? 's' : ''} — fix before importing
      </div>
      <ul className="text-xs text-red-600 space-y-0.5 ml-5 list-disc">
        {errors.slice(0, 8).map((e, i) => <li key={i}>{e}</li>)}
        {errors.length > 8 && <li>…and {errors.length - 8} more</li>}
      </ul>
    </div>
  )
}
