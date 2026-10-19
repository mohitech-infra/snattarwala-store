"use client"

import { useState, useEffect } from "react"
import { Tag, Plus, Trash2, RefreshCw, Layers, Check, X } from "lucide-react"
import { getAdminCategories, createAdminCategory, deleteAdminCategory, AdminCategory } from "@/lib/admin-service"
import { ExportMenu } from "@/components/admin/export-menu"

export default function CategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [saving, setSaving] = useState(false)

  const loadCategories = async () => {
    setLoading(true)
    const data = await getAdminCategories()
    setCategories(data)
    setLoading(false)
  }

  useEffect(() => { loadCategories() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setSaving(true)
    const res = await createAdminCategory({
      name: newName.trim(),
      slug: newName.trim().toLowerCase().replace(/\s+/g, '-'),
      description: newDesc.trim()
    })
    if (res) {
      setNewName("")
      setNewDesc("")
      setIsCreating(false)
      await loadCategories()
    } else {
      alert(`Failed to create category`)
    }
    setSaving(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"? Products in this category will need to be reassigned.`)) return
    const ok = await deleteAdminCategory(id)
    if (ok) setCategories(prev => prev.filter(c => c.id !== id))
    else alert("Could not delete category — it may have products assigned to it.")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-accent block mb-1">Catalog Management</span>
          <h1 className="font-heading text-3xl font-bold text-foreground">Fragrance Categories</h1>
          <p className="text-sm text-foreground/60 mt-1">Manage Attars, Perfumes, and Bakhoor product categories.</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportMenu
            filename="attarwala_categories"
            title="Fragrance Categories"
            data={categories.map(c => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              description: c.description,
              productsCount: c.productsCount,
              status: c.isActive ? "Active" : "Inactive"
            }))}
          />
          <button
            onClick={loadCategories}
            className="p-2.5 rounded-sm border border-border hover:border-accent text-foreground/60 hover:text-accent transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-accent/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="bg-card border border-accent/40 rounded-lg p-6 shadow-sm">
          <h3 className="font-heading font-bold text-sm text-foreground mb-4 uppercase tracking-wider">New Category</h3>
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Category name (e.g. Attars)"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="flex-1 bg-background border border-border rounded-sm px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-accent"
              required
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              className="flex-1 bg-background border border-border rounded-sm px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-accent"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2.5 bg-accent text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-accent/90 disabled:opacity-60 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2.5 border border-border rounded-sm text-xs font-semibold text-foreground/70 hover:border-border/80 transition-colors flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card border border-border/40 rounded-lg p-6 animate-pulse space-y-3">
              <div className="h-4 bg-secondary rounded w-2/3" />
              <div className="h-3 bg-secondary rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-card border border-border/40 rounded-lg p-16 text-center space-y-3">
          <Layers className="w-10 h-10 text-foreground/30 mx-auto" />
          <p className="text-sm text-foreground/50">No categories yet. Add your first one above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div
              key={cat.id}
              className="bg-card border border-border/60 hover:border-accent/60 rounded-lg p-5 transition-all duration-200 shadow-sm group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-sm bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                    <Tag className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-foreground">{cat.name}</h3>
                    {cat.description && (
                      <p className="text-[11px] text-foreground/50 mt-0.5 leading-relaxed">{cat.description}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(cat.id, cat.name)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-sm text-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all"
                  title="Delete category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-4 flex items-center gap-3 pt-3 border-t border-border/40">
                <span className="text-[11px] font-semibold text-foreground/60">
                  {cat.productsCount ?? 0} Products
                </span>
                <span className="ml-auto text-[10px] text-foreground/30">
                  {cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}