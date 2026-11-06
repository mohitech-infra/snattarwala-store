"use client"

import { useState, useEffect } from "react"
import { 
  Tag, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Layers, 
  Check, 
  X, 
  Edit2, 
  Image as ImageIcon, 
  ExternalLink,
  Sparkles,
  Upload
} from "lucide-react"
import { 
  getAdminCategories, 
  createAdminCategory, 
  updateAdminCategory, 
  deleteAdminCategory, 
  AdminCategory 
} from "@/lib/admin-service"
import { ExportMenu } from "@/components/admin/export-menu"
import { ProductImageDropzone } from "@/components/admin/product-image-dropzone"

export default function CategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null)

  // Form State
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const loadCategories = async () => {
    setLoading(true)
    const data = await getAdminCategories()
    setCategories(data)
    setLoading(false)
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const openCreateModal = () => {
    setEditingCategory(null)
    setName("")
    setSlug("")
    setDescription("")
    setImageUrl("/categories/attars.jpg")
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (cat: AdminCategory) => {
    setEditingCategory(cat)
    setName(cat.name)
    setSlug(cat.slug)
    setDescription(cat.description || "")
    setImageUrl(cat.imageUrl || `/categories/${cat.slug}.jpg`)
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleNameChange = (val: string) => {
    setName(val)
    if (!editingCategory) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setFormError("Category name is required.")
      return
    }

    setSaving(true)
    setFormError(null)

    const finalSlug = slug.trim() || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    const finalImage = imageUrl.trim() || `/categories/${finalSlug}.jpg`

    if (editingCategory) {
      const ok = await updateAdminCategory(editingCategory.id, {
        name: name.trim(),
        slug: finalSlug,
        description: description.trim(),
        imageUrl: finalImage
      })

      if (ok) {
        setIsModalOpen(false)
        await loadCategories()
      } else {
        setFormError("Failed to update category. Please try again.")
      }
    } else {
      const ok = await createAdminCategory({
        name: name.trim(),
        slug: finalSlug,
        description: description.trim(),
        imageUrl: finalImage
      })

      if (ok) {
        setIsModalOpen(false)
        await loadCategories()
      } else {
        setFormError("Failed to create category. Please try again.")
      }
    }
    setSaving(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"? Products in this category may need to be reassigned.`)) return
    const res = await deleteAdminCategory(id)
    if (res.success) {
      setCategories(prev => prev.filter(c => c.id !== id))
    } else {
      alert(res.error || "Could not delete category.")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-accent block mb-1">
            Catalog Management
          </span>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Fragrance Categories
          </h1>
          <p className="text-sm text-foreground/60 mt-1">
            Manage Attars, Perfumes, Bakhoor, and category banner images that appear on the storefront.
          </p>
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
              photoUrl: c.imageUrl,
              productsCount: c.productsCount,
              status: c.isActive ? "Active" : "Inactive"
            }))}
          />
          <button
            onClick={loadCategories}
            className="p-2.5 rounded-sm border border-border hover:border-accent text-foreground/60 hover:text-accent transition-colors"
            title="Refresh categories"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-accent/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </div>

      {/* Categories Grid Showing Placed Photos */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card border border-border/40 rounded-lg overflow-hidden animate-pulse">
              <div className="h-44 bg-secondary" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-secondary rounded w-2/3" />
                <div className="h-3 bg-secondary rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-card border border-border/40 rounded-lg p-16 text-center space-y-3">
          <Layers className="w-10 h-10 text-foreground/30 mx-auto" />
          <p className="text-sm text-foreground/50">No categories found in store.</p>
          <button
            onClick={openCreateModal}
            className="mt-2 px-4 py-2 bg-accent text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-accent/90 transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Create First Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(cat => {
            const displayPhoto = cat.imageUrl || `/categories/${cat.slug || "attars"}.jpg`
            return (
              <div
                key={cat.id}
                className="bg-card border border-border/60 hover:border-accent/60 rounded-lg overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between group"
              >
                <div>
                  {/* Category Photo Placement Display */}
                  <div className="relative h-48 w-full overflow-hidden bg-secondary/30 border-b border-border/40">
                    <img
                      src={displayPhoto}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                    
                    {/* Top status badges */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
                      <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-sm text-[10px] font-semibold tracking-wider uppercase text-white flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {cat.productsCount ?? 0} Products
                      </span>
                      <span className="px-2 py-0.5 bg-accent/90 text-slate-950 font-mono text-[9px] font-bold rounded-sm uppercase tracking-wider">
                        Live on Store
                      </span>
                    </div>

                    {/* Bottom Photo Pill */}
                    <div className="absolute bottom-3 inset-x-3 z-10">
                      <div className="px-2.5 py-1.5 bg-black/75 backdrop-blur-md border border-white/15 rounded-sm flex items-center justify-between text-white">
                        <div className="flex items-center gap-2 truncate">
                          <ImageIcon className="w-3.5 h-3.5 text-accent shrink-0" />
                          <span className="text-[10px] font-mono text-white/80 truncate">
                            {displayPhoto}
                          </span>
                        </div>
                        <button
                          onClick={() => openEditModal(cat)}
                          className="shrink-0 text-[10px] font-semibold text-accent hover:underline flex items-center gap-0.5 ml-2"
                        >
                          Change Photo
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Category Details */}
                  <div className="p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading font-bold text-lg text-foreground group-hover:text-accent transition-colors">
                        {cat.name}
                      </h3>
                      <span className="text-[11px] font-mono text-foreground/40 bg-secondary/50 px-2 py-0.5 rounded">
                        /{cat.slug}
                      </span>
                    </div>

                    <p className="text-xs text-foreground/60 leading-relaxed min-h-[36px]">
                      {cat.description || "SN AttarWala signature fragrance collection."}
                    </p>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-5 pt-0 border-t border-border/30 mt-3 flex items-center justify-between gap-2">
                  <button
                    onClick={() => openEditModal(cat)}
                    className="flex-1 py-2 px-3 bg-secondary/60 hover:bg-accent/15 border border-border/60 hover:border-accent/40 rounded-sm text-xs font-semibold text-foreground hover:text-accent transition-all flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit & Photo</span>
                  </button>

                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="p-2 rounded-sm text-foreground/40 hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/30 transition-all"
                    title="Delete category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Category Modal with Photo Upload */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-accent/40 rounded-lg shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-border/50 bg-background/50 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-sm bg-accent/15 flex items-center justify-center text-accent">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-foreground">
                    {editingCategory ? "Edit Category & Photo" : "Add Fragrance Category"}
                  </h3>
                  <p className="text-[11px] text-foreground/50">
                    {editingCategory ? `Modifying "${editingCategory.name}"` : "Create a new fragrance collection"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-foreground/40 hover:text-foreground p-1.5 rounded-sm hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded text-xs text-destructive">
                  {formError}
                </div>
              )}

              {/* Name & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider block mb-1.5">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => handleNameChange(e.target.value)}
                    placeholder="e.g. Attars, Perfumes, Bakhoor"
                    className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-accent"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider block mb-1.5">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                    placeholder="e.g. attars"
                    className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm font-mono text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider block mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe this fragrance category for store visitors..."
                  rows={2}
                  className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-accent resize-none"
                />
              </div>

              {/* CATEGORY PHOTO SECTION */}
              <div className="border border-border/60 rounded-lg p-4 bg-secondary/10 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-accent" />
                    Category Photo Placement
                  </label>
                  <span className="text-[10px] text-accent font-semibold uppercase tracking-wider">
                    Homepage & Catalog Banner
                  </span>
                </div>

                {/* Currently Placed Photo Display */}
                {imageUrl && (
                  <div className="relative h-40 w-full rounded-md overflow-hidden border border-accent/40 bg-black shadow-inner group/prev">
                    <img
                      src={imageUrl}
                      alt="Placed category photo"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                    
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-emerald-500/90 text-slate-950 font-bold text-[9px] uppercase tracking-wider rounded-sm flex items-center gap-1">
                      <Check className="w-3 h-3" /> Currently Placed Photo
                    </div>

                    <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between text-white text-[11px]">
                      <span className="font-mono text-[10px] text-white/80 truncate">
                        {imageUrl}
                      </span>
                    </div>
                  </div>
                )}

                {/* Upload Photo Dropzone */}
                <div>
                  <ProductImageDropzone
                    value={imageUrl}
                    onChange={(newUrl) => setImageUrl(newUrl)}
                    label="Upload New Category Photo"
                    helpText="Upload banner image for this category (PNG, JPG, WEBP up to 10MB)"
                  />
                </div>

                {/* Quick Presets */}
                <div>
                  <span className="text-[10px] text-foreground/50 font-semibold uppercase tracking-wider block mb-2">
                    Or select brand signature preset:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { name: "Attars", path: "/categories/attars.jpg" },
                      { name: "Perfumes", path: "/categories/perfumes.jpg" },
                      { name: "Bakhoor", path: "/categories/bakhoor.jpg" },
                    ].map(preset => (
                      <button
                        type="button"
                        key={preset.name}
                        onClick={() => setImageUrl(preset.path)}
                        className={`p-2 rounded border text-left text-xs transition-all flex items-center gap-2 ${
                          imageUrl === preset.path 
                            ? "border-accent bg-accent/15 text-accent font-semibold" 
                            : "border-border/60 bg-background hover:border-accent/40 text-foreground/70"
                        }`}
                      >
                        <img src={preset.path} alt={preset.name} className="w-6 h-6 object-cover rounded-sm border border-border" />
                        <span className="truncate">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-sm text-xs font-semibold text-foreground/70 hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-accent text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-accent/90 transition-all disabled:opacity-60 flex items-center gap-2 shadow-sm"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingCategory ? "Update Category & Photo" : "Create Category"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
