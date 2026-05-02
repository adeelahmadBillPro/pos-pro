import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join, extname } from 'path'
import { existsSync } from 'fs'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FOLDERS = new Set([
  'uploads',
  'uploads/products',
  'uploads/categories',
  'avatars',
  'payment-proofs',
  'logos',
])

/** Reject any folder containing path-traversal segments or unknown names. */
function safeFolder(folder: string): string | null {
  if (!folder) return null
  // Strip leading/trailing slashes, collapse to lowercase
  const cleaned = folder.replace(/^\/+|\/+$/g, '').toLowerCase()
  if (cleaned.includes('..') || cleaned.includes('\\')) return null
  if (!ALLOWED_FOLDERS.has(cleaned)) return null
  return cleaned
}

function safeExt(filename: string, mime: string): string {
  const fromName = (extname(filename) || '').toLowerCase()
  // Whitelist to avoid arbitrary extensions
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
  if (allowed.includes(fromName)) return fromName
  // Fallback from mime
  if (mime === 'image/jpeg') return '.jpg'
  if (mime === 'image/png')  return '.png'
  if (mime === 'image/webp') return '.webp'
  if (mime === 'image/gif')  return '.gif'
  return '.jpg'
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const folderInput = (formData.get('folder') as string) || 'uploads'
    const folder = safeFolder(folderInput)

    if (!folder) {
      return NextResponse.json(
        { success: false, error: 'Invalid upload folder' },
        { status: 400 },
      )
    }

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only JPEG, PNG, WebP, GIF allowed' },
        { status: 400 },
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum 5MB allowed' },
        { status: 400 },
      )
    }

    const ext = safeExt(file.name, file.type)
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`
    const uploadDir = join(process.cwd(), 'public', folder)

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = join(uploadDir, fileName)

    await writeFile(filePath, buffer)

    // Verify it actually persisted (defensive — catches transient IO failures)
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: 'Upload completed but file could not be saved. Please try again.' },
        { status: 500 },
      )
    }

    // Return URL that goes through /api/files/* — Next.js production doesn't auto-serve
    // newly added files in /public after server start, so we stream them via API instead.
    // Always forward-slash form (no Windows backslashes).
    const url = `/api/files/${folder}/${fileName}`.replace(/\\/g, '/')

    return NextResponse.json({ success: true, data: { url, fileName } })
  } catch (error) {
    console.error('[UPLOAD]', error)
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 })
  }
}
