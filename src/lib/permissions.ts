export type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'MANAGER' | 'CASHIER' | 'VIEWER'

export const PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: ['*'],

  OWNER: [
    'dashboard.view',
    'pos.use', 'pos.discount.unlimited',
    'products.read', 'products.write', 'products.delete', 'products.import', 'products.export',
    'categories.read', 'categories.write', 'categories.delete',
    'inventory.read', 'inventory.write', 'inventory.adjust', 'inventory.export',
    'suppliers.read', 'suppliers.write', 'suppliers.delete',
    'purchase_orders.read', 'purchase_orders.write', 'purchase_orders.delete', 'purchase_orders.receive',
    'customers.read', 'customers.write', 'customers.delete', 'customers.import', 'customers.export',
    'orders.read', 'orders.write', 'orders.cancel', 'orders.void', 'orders.export',
    'returns.read', 'returns.process',
    'discounts.read', 'discounts.write', 'discounts.delete',
    'staff.read', 'staff.write', 'staff.delete',
    'reports.view', 'reports.export',
    'expenses.read', 'expenses.write',
    'settings.read', 'settings.write',
    'billing.read', 'billing.manage',
  ],

  MANAGER: [
    'dashboard.view',
    'pos.use', 'pos.discount.max20',
    'products.read', 'products.write', 'products.import', 'products.export',
    'categories.read', 'categories.write',
    'inventory.read', 'inventory.write', 'inventory.adjust', 'inventory.export',
    'suppliers.read', 'suppliers.write',
    'purchase_orders.read', 'purchase_orders.write', 'purchase_orders.receive',
    'customers.read', 'customers.write', 'customers.import', 'customers.export',
    'orders.read', 'orders.write', 'orders.cancel', 'orders.export',
    'returns.read', 'returns.process',
    'discounts.read', 'discounts.write',
    'staff.read',
    'reports.view', 'reports.export',
    'expenses.read', 'expenses.write',
    'settings.read',
  ],

  CASHIER: [
    'dashboard.view',
    'pos.use', 'pos.discount.max10',
    'products.read',
    'customers.read', 'customers.create',
    'orders.read', 'orders.create',
    'returns.process',
  ],

  VIEWER: [
    'dashboard.view',
    'products.read',
    'orders.read',
    'reports.view',
    'inventory.read',
    'customers.read',
  ],
}

export function hasPermission(role: UserRole, permission: string): boolean {
  const perms = PERMISSIONS[role]
  if (!perms) return false
  if (perms.includes('*')) return true
  return perms.includes(permission)
}

export function getMaxDiscount(role: UserRole): number {
  if (role === 'SUPER_ADMIN' || role === 'OWNER') return 100
  if (role === 'MANAGER') return 20
  if (role === 'CASHIER') return 10
  return 0
}
