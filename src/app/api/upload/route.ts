import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join, extname } from 'path'
import { existsSync } from 'fs'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'uploads'

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only JPEG, PNG, WebP, GIF allowed' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum 5MB allowed' },
        { status: 400 }
      )
    }

    const ext = extname(file.name) || '.jpg'
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
    const uploadDir = join(process.cwd(), 'public', folder)

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = join(uploadDir, fileName)

    await writeFile(filePath, buffer)

    const url = `/${folder}/${fileName}`

    return NextResponse.json({ success: true, data: { url, fileName } })
  } catch (error) {
    console.error('[UPLOAD]', error)
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 })
  }
}
