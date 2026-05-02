'use client'

import { useRef, useState } from 'react'
import { Upload, Loader2, X, ImageOff, Camera } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  /** Current image URL(s). Single string or array. */
  value?: string | string[] | null
  /** Called with the new value (string for single, string[] for multi). */
  onChange?: (value: string | string[]) => void
  /** Folder under /public to save into. Examples: "uploads/products", "avatars", "payment-proofs". */
  folder?: string
  /** Multi-image mode — let user upload several. */
  multiple?: boolean
  /** Max size in MB — server enforces 5 too. */
  maxSizeMB?: number
  /** Visual size of each thumbnail tile. */
  size?: 'sm' | 'md' | 'lg'
  /** Disable the uploader. */
  disabled?: boolean
  className?: string
  /** Accept attribute. Default: image/*. */
  accept?: string
  /** Custom label/CTA text. */
  label?: string
  /** Maximum images allowed (multi mode only). */
  maxImages?: number
}

const SIZE_CLASSES = {
  sm: 'w-16 h-16 text-[10px]',
  md: 'w-20 h-20 text-xs',
  lg: 'w-28 h-28 text-sm',
}

/**
 * Unified image upload widget — used for product photos, avatars, payment proofs,
 * store logos, etc. POSTs to /api/upload, handles preview, broken-image fallback,
 * and lets the user remove images.
 */
export function ImageUpload({
  value,
  onChange,
  folder = 'uploads',
  multiple = false,
  maxSizeMB = 5,
  size = 'md',
  disabled,
  className,
  accept = 'image/jpeg,image/png,image/webp,image/gif',
  label = 'Upload',
  maxImages = 5,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [brokenUrls, setBrokenUrls] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)

  // Normalize value to array form for rendering
  const images: string[] = Array.isArray(value) ? value : value ? [value] : []
  const reachedLimit = multiple && images.length >= maxImages

  function emit(next: string[]) {
    if (multiple) onChange?.(next)
    else onChange?.(next[0] ?? '')
  }

  async function handleFile(file: File) {
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Image too large. Max ${maxSizeMB}MB allowed.`)
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', folder)

      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()

      if (!res.ok || !json?.success || !json?.data?.url) {
        toast.error(json?.error || 'Upload failed — please try again')
        return
      }

      const url: string = json.data.url
      const next = multiple ? [...images, url] : [url]
      emit(next)
      toast.success('Image uploaded')
    } catch {
      toast.error('Network error — please try again')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function removeImage(index: number) {
    const next = images.filter((_, i) => i !== index)
    emit(next)
  }

  function markBroken(url: string) {
    setBrokenUrls((prev) => new Set(prev).add(url))
  }

  return (
    <div className={cn('flex flex-wrap gap-2 items-start', className)}>
      {/* Existing images */}
      {images.map((url, i) => {
        const broken = brokenUrls.has(url)
        return (
          <div
            key={`${url}-${i}`}
            className={cn(
              'relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center flex-shrink-0',
              SIZE_CLASSES[size],
            )}
          >
            {broken ? (
              <div className="flex flex-col items-center gap-0.5 text-gray-400 px-1">
                <ImageOff className="w-4 h-4" />
                <span className="text-[9px] text-center leading-tight">Image not found</span>
              </div>
            ) : (
              <img
                src={url}
                alt={`Image ${i + 1}`}
                onError={() => markBroken(url)}
                className="w-full h-full object-cover"
              />
            )}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                aria-label="Remove image"
                title="Remove"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )
      })}

      {/* Upload tile — hidden once limit hit */}
      {!reachedLimit && !disabled && (
        <label
          className={cn(
            'border-2 border-dashed border-gray-300 hover:border-amber-400 active:bg-amber-50 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all flex-shrink-0',
            SIZE_CLASSES[size],
            uploading && 'opacity-70 cursor-wait pointer-events-none',
          )}
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
          ) : (
            <>
              <Camera className="w-5 h-5 text-gray-400 mb-0.5" />
              <span className="text-gray-500 font-medium leading-none">{label}</span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleInputChange}
            disabled={uploading || disabled}
          />
        </label>
      )}
    </div>
  )
}
