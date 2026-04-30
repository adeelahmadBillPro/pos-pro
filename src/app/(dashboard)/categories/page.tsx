'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, FolderOpen } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/shared/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'

interface Category {
  id: string
  name: string
  slug: string
  parentId: string | null
  parent?: { id: string; name: string } | null
  sortOrder: number
  isActive: boolean
  _count: { products: number }
}

interface FormState {
  name: string
  parentId: string
  sortOrder: string
}

const INITIAL_FORM: FormState = { name: '', parentId: '', sortOrder: '0' }

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [saving, setSaving] = useState(false)

  async function fetchCategories() {
    try {
      const res = await fetch('/api/categories')
      const json = await res.json()
      if (json.success) setCategories(json.data)
    } catch {
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCategories() }, [])

  function openAdd() {
    setEditCategory(null)
    setForm(INITIAL_FORM)
    setDialogOpen(true)
  }

  function openEdit(cat: Category) {
    setEditCategory(cat)
    setForm({
      name: cat.name,
      parentId: cat.parentId || '',
      sortOrder: String(cat.sortOrder),
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('Category name is required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        parentId: form.parentId || undefined,
        sortOrder: parseInt(form.sortOrder) || 0,
      }

      const url = editCategory ? `/api/categories/${editCategory.id}` : '/api/categories'
      const method = editCategory ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (!json.success) {
        toast.error(json.error || 'Save failed')
        return
      }

      toast.success(editCategory ? 'Category updated' : 'Category created')
      setDialogOpen(false)
      fetchCategories()
    } catch {
      toast.error('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) {
        toast.error(json.error || 'Delete failed')
        return
      }
      toast.success('Category deleted')
      setDeleteId(null)
      fetchCategories()
    } catch {
      toast.error('An error occurred')
    }
  }

  async function toggleActive(cat: Category) {
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cat.name,
          parentId: cat.parentId || undefined,
          sortOrder: cat.sortOrder,
          isActive: !cat.isActive,
        }),
      })
      const json = await res.json()
      if (!json.success) { toast.error(json.error); return }
      fetchCategories()
    } catch {
      toast.error('Failed to update')
    }
  }

  // Flat list of root categories for parent dropdown
  const rootCategories = categories.filter((c) => !c.parentId)

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Organize your products into categories"
        actions={
          <Button onClick={openAdd} size="sm">
            <Plus className="w-4 h-4 mr-2" /> Add Category
          </Button>
        }
      />

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <TableSkeleton rows={5} cols={5} />
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 flex flex-col items-center gap-3">
          <FolderOpen className="w-12 h-12 text-gray-300" />
          <p className="font-medium text-gray-600">No categories yet</p>
          <p className="text-sm text-gray-400">Create your first category to organize products</p>
          <Button onClick={openAdd} size="sm">
            <Plus className="w-4 h-4 mr-2" /> Add Category
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Name', 'Parent', 'Products', 'Sort Order', 'Active', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {cat.parentId && <span className="text-gray-400 mr-2">↳</span>}
                      {cat.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {cat.parent ? (
                        <Badge variant="secondary" className="text-xs">{cat.parent.name}</Badge>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="font-medium">{cat._count.products}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{cat.sortOrder}</td>
                    <td className="px-4 py-3">
                      <Switch
                        checked={cat.isActive}
                        onCheckedChange={() => toggleActive(cat)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteId(cat.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {categories.map((cat) => (
              <div key={cat.id} className="p-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{cat.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {cat.parent && (
                      <Badge variant="secondary" className="text-xs">{cat.parent.name}</Badge>
                    )}
                    <span className="text-xs text-gray-500">{cat._count.products} products</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Switch checked={cat.isActive} onCheckedChange={() => toggleActive(cat)} />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700"
                    onClick={() => setDeleteId(cat.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Name *</Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Electronics"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Parent Category</Label>
              <Select
                value={form.parentId || '_none'}
                onValueChange={(v) => setForm((p) => ({ ...p, parentId: v === '_none' ? '' : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None (top-level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">None (top-level)</SelectItem>
                  {rootCategories
                    .filter((c) => c.id !== editCategory?.id)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sort-order">Sort Order</Label>
              <Input
                id="sort-order"
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editCategory ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm delete */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) handleDelete(deleteId) }}
        title="Delete Category?"
        description="This will permanently delete the category. Products in this category will become uncategorized."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
