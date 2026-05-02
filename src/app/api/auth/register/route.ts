import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { registerSchema } from '@/lib/validations'
import { getStoreTypeMeta } from '@/lib/storeTypes'

function generateSlug(name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return base + '-' + Math.random().toString(36).slice(2, 7)
}

function categorySlug(name: string, storeId: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + storeId.slice(-4)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { name, email, password, storeName, storeType, phone, city } = parsed.data

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const slug = generateSlug(storeName)

    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 14)

    // Starter categories based on chosen business type — one less manual setup step for the owner
    const starterCategories = getStoreTypeMeta(storeType).starterCategories

    const result = await prisma.$transaction(async (tx) => {
      const store = await tx.store.create({
        data: {
          name: storeName,
          slug,
          storeType,
          phone,
          city,
          subscriptionStatus: 'TRIAL',
          trialEndsAt,
        },
      })

      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'OWNER',
          storeId: store.id,
          isActive: true,
        },
      })

      // Create starter categories so the new owner sees the system populated and ready
      if (starterCategories.length > 0) {
        await tx.category.createMany({
          data: starterCategories.map((catName, idx) => ({
            storeId: store.id,
            name: catName,
            slug: categorySlug(catName, store.id),
            sortOrder: idx,
            isActive: true,
          })),
        })
      }

      return { store, user, categoriesCreated: starterCategories.length }
    })

    return NextResponse.json(
      {
        message: 'Account created successfully. Your 14-day trial has started.',
        userId: result.user.id,
        storeId: result.store.id,
        categoriesCreated: result.categoriesCreated,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[register]', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
