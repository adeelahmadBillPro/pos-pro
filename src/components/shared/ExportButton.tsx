'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Papa from 'papaparse'

interface ExportButtonProps {
  data: Record<string, any>[]
  filename?: string
  label?: string
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function ExportButton({
  data,
  filename = 'export',
  label = 'Export CSV',
  className,
  variant = 'outline',
  size = 'sm',
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false)

  function handleExport() {
    if (!data || data.length === 0) return
    setLoading(true)

    try {
      const csv = Papa.unparse(data)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${filename}-${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={loading || !data?.length}
      className={className}
    >
      <Download className="w-4 h-4 mr-2" />
      {loading ? 'Exporting...' : label}
    </Button>
  )
}
