import 'dotenv/config'
// @ts-ignore
import { PrismaClient } from '../src/generated/prisma/client.ts'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
// @ts-ignore
const prisma = new PrismaClient({ adapter })

async function main() {
  // Plans
  await prisma.plan.createMany({
    data: [
      {
        name: 'Trial',
        description: '14 din free trial',
        monthlyPrice: 0,
        yearlyPrice: 0,
        maxStores: 1,
        maxProducts: 50,
        maxUsers: 3,
        features: ['pos', 'products', 'basic_reports'],
        sortOrder: 0,
      },
      {
        name: 'Starter',
        description: 'Choti dukan ke liye perfect',
        monthlyPrice: 2999,
        yearlyPrice: 29990,
        maxStores: 1,
        maxProducts: 500,
        maxUsers: 5,
        features: ['pos', 'products', 'customers', 'inventory', 'reports', 'discounts'],
        sortOrder: 1,
      },
      {
        name: 'Business',
        description: 'Growing business ke liye',
        monthlyPrice: 6999,
        yearlyPrice: 69990,
        maxStores: 3,
        maxProducts: -1,
        maxUsers: 15,
        features: ['pos', 'products', 'customers', 'inventory', 'reports', 'discounts', 'multi_store', 'staff', 'expenses'],
        sortOrder: 2,
      },
    ],
    skipDuplicates: true,
  })

  // Bank Accounts
  await prisma.bankAccount.createMany({
    data: [
      {
        bankName: 'HBL',
        accountTitle: 'POS Pro Pakistan',
        iban: 'PK36HABB0000100123456702',
        isActive: true,
        sortOrder: 1,
      },
      {
        bankName: 'Meezan Bank',
        accountTitle: 'POS Pro Pakistan',
        iban: 'PK07MEZN0001520100123456',
        isActive: false,
        sortOrder: 2,
      },
    ],
    skipDuplicates: true,
  })

  // Super Admin
  await prisma.user.upsert({
    where: { email: 'superadmin@pospro.pk' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'superadmin@pospro.pk',
      password: await bcrypt.hash('Admin@12345', 12),
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  })

  // Demo Store
  const store = await prisma.store.upsert({
    where: { slug: 'demo-store' },
    update: {},
    create: {
      name: 'Demo Store',
      slug: 'demo-store',
      address: 'Main Market, Lahore',
      city: 'Lahore',
      phone: '03001234567',
      email: 'demo@store.pk',
      currency: 'PKR',
      taxRate: 17,
      taxName: 'GST',
      taxEnabled: true,
      subscriptionStatus: 'ACTIVE',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  })

  // Demo Owner
  await prisma.user.upsert({
    where: { email: 'owner@demo.pk' },
    update: {},
    create: {
      name: 'Ahmed Khan',
      email: 'owner@demo.pk',
      password: await bcrypt.hash('Owner@1234', 12),
      role: 'OWNER',
      storeId: store.id,
      phone: '03001234568',
      pin: '1234',
      isActive: true,
    },
  })

  // Demo Manager
  await prisma.user.upsert({
    where: { email: 'manager@demo.pk' },
    update: {},
    create: {
      name: 'Sara Ali',
      email: 'manager@demo.pk',
      password: await bcrypt.hash('Manager@1234', 12),
      role: 'MANAGER',
      storeId: store.id,
      pin: '5678',
      isActive: true,
    },
  })

  // Demo Cashier
  await prisma.user.upsert({
    where: { email: 'cashier@demo.pk' },
    update: {},
    create: {
      name: 'Ali Hassan',
      email: 'cashier@demo.pk',
      password: await bcrypt.hash('Cashier@1234', 12),
      role: 'CASHIER',
      storeId: store.id,
      pin: '9999',
      isActive: true,
    },
  })

  // Categories
  const cat1 = await prisma.category.upsert({
    where: { slug_storeId: { slug: 'electronics', storeId: store.id } },
    update: {},
    create: { name: 'Electronics', slug: 'electronics', storeId: store.id },
  })
  const cat2 = await prisma.category.upsert({
    where: { slug_storeId: { slug: 'clothing', storeId: store.id } },
    update: {},
    create: { name: 'Clothing', slug: 'clothing', storeId: store.id },
  })
  const cat3 = await prisma.category.upsert({
    where: { slug_storeId: { slug: 'food-drinks', storeId: store.id } },
    update: {},
    create: { name: 'Food & Drinks', slug: 'food-drinks', storeId: store.id },
  })

  // Products with inventory
  const products = [
    { name: 'Mobile Phone Samsung A15', sku: 'SAM-A15', price: 45000, costPrice: 38000, categoryId: cat1.id, stock: 25 },
    { name: 'USB Cable Type-C', sku: 'USB-TC-01', price: 350, costPrice: 150, categoryId: cat1.id, stock: 100 },
    { name: 'Men Polo T-Shirt', sku: 'CLT-POLO-M', price: 1200, costPrice: 600, categoryId: cat2.id, stock: 50 },
    { name: 'Ladies Kurti', sku: 'CLT-KRT-L', price: 1800, costPrice: 900, categoryId: cat2.id, stock: 30 },
    { name: 'Mineral Water 1L', sku: 'FD-WAT-1L', price: 80, costPrice: 40, categoryId: cat3.id, stock: 200 },
    { name: 'Pepsi 500ml', sku: 'FD-PEP-500', price: 100, costPrice: 60, categoryId: cat3.id, stock: 150 },
    { name: 'Lays Chips Classic', sku: 'FD-LAY-CLS', price: 60, costPrice: 35, categoryId: cat3.id, stock: 80 },
    { name: 'Wireless Earbuds', sku: 'ELC-WE-01', price: 3500, costPrice: 2000, categoryId: cat1.id, stock: 15 },
    { name: 'Power Bank 10000mAh', sku: 'ELC-PB-10K', price: 2800, costPrice: 1500, categoryId: cat1.id, stock: 20 },
    { name: 'Kids Sneakers', sku: 'CLT-SNK-KD', price: 2200, costPrice: 1100, categoryId: cat2.id, stock: 35 },
  ]

  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { sku: p.sku, storeId: store.id } })
    if (!existing) {
      const product = await prisma.product.create({
        data: {
          name: p.name,
          sku: p.sku,
          price: p.price,
          costPrice: p.costPrice,
          categoryId: p.categoryId,
          storeId: store.id,
          taxable: true,
          trackStock: true,
        },
      })
      await prisma.inventoryItem.create({
        data: { productId: product.id, quantity: p.stock },
      })
    }
  }

  // Demo Customers
  const customers = [
    { name: 'Farrukh Ahmed', phone: '03011234567', email: 'farrukh@gmail.com', loyaltyPoints: 250, totalSpent: 25000 },
    { name: 'Nadia Hussain', phone: '03021234567', email: 'nadia@gmail.com', loyaltyPoints: 100, totalSpent: 10000 },
    { name: 'Bilal Malik', phone: '03031234567', loyaltyPoints: 500, totalSpent: 50000, customerGroup: 'VIP' },
    { name: 'Sana Sheikh', phone: '03041234567', loyaltyPoints: 75, totalSpent: 7500 },
    { name: 'Tariq Mehmood', phone: '03051234567', customerGroup: 'WHOLESALE' },
  ]

  for (const c of customers) {
    const existing = await prisma.customer.findFirst({ where: { phone: c.phone, storeId: store.id } })
    if (!existing) {
      await prisma.customer.create({ data: { ...c, storeId: store.id } })
    }
  }

  // Demo Discounts
  await prisma.discount.createMany({
    data: [
      { storeId: store.id, name: 'Welcome 10%', code: 'WELCOME10', type: 'PERCENTAGE', value: 10, isActive: true },
      { storeId: store.id, name: 'Flat 500 off', code: 'FLAT500', type: 'FIXED_AMOUNT', value: 500, minOrderValue: 5000, isActive: true },
      { storeId: store.id, name: 'EID Special 20%', code: 'EID20', type: 'PERCENTAGE', value: 20, isActive: false },
    ],
    skipDuplicates: true,
  })

  console.log('✅ Seed complete!')
  console.log('Super Admin: superadmin@pospro.pk / Admin@12345')
  console.log('Owner: owner@demo.pk / Owner@1234')
  console.log('Manager: manager@demo.pk / Manager@1234')
  console.log('Cashier: cashier@demo.pk / Cashier@1234')
}

main().catch(console.error).finally(() => prisma.$disconnect())
