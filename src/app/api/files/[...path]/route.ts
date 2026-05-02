import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

/**
 * Streams files from /public/{path} dynamically.
 *
 * Why this exists: Next.js production mode caches the contents of /public at
 * `next start` time. Files written after start (e.g. user uploads) are not
 * served by the static handler. This route reads them off disk on demand so
 * uploaded images, payment proofs, avatars, etc. load reliably in prod.
 *
 * Security: only serves files from a whitelist of folders that the upload
 * route writes to. No traversal allowed.
 */

const ALLOWED_TOP_DIRS = new Set([
  'uploads',
  'avatars',
  'payment-proofs',
  'logos',
])

const MIME_TYPES: Record<string, string> = {
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.webp': 'image/webp',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.pdf':  'application/pdf',
}

function getMime(filename: string): string {
  const lower = filename.toLowerCase()
  for (const ext of Object.keys(MIME_TYPES)) {
    if (lower.endsWith(ext)) return MIME_TYPES[ext]
  }
  return 'application/octet-stream'
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params

  if (!path || path.length === 0) {
    return new NextResponse('Not found', { status: 404 })
  }

  // Security: check first segment is in our allowlist + no path traversal
  const topDir = path[0]
  if (!ALLOWED_TOP_DIRS.has(topDir)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  for (const seg of path) {
    if (seg.includes('..') || seg.includes('\\') || seg.startsWith('.')) {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  const filePath = join(process.cwd(), 'public', ...path)

  if (!existsSync(filePath)) {
    return new NextResponse('Not found', { status: 404 })
  }

  try {
    const fileStat = await stat(filePath)
    if (!fileStat.isFile()) {
      return new NextResponse('Not found', { status: 404 })
    }

    const buffer = await readFile(filePath)
    const filename = path[path.length - 1]
    const mime = getMime(filename)

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Length': String(fileStat.size),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('[FILES_GET]', error)
    return new NextResponse('Server error', { status: 500 })
  }
}
