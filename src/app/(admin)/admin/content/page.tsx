"use client"

import { useState, useEffect } from "react"
import { 
  FileText, Save, Check, Eye, EyeOff, Edit, RefreshCw,
  ImageIcon, Type, Megaphone, Plus, Star, Sparkles, Flame,
  Layers, ArrowUp, ArrowDown, Search, ExternalLink, X,
  Trash2, MoveUp, MoveDown, Grid
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { 
  getAdminProducts, 
  updateAdminProduct, 
  getAdminCategories, 
  createAdminCategory, 
  AdminProduct, 
  AdminCategory 
} from "@/lib/admin-service"

interface ContentBlock {
  id: string
  type: "hero_banner" | "announcement_bar" | "promotional_strip" | "section_heading"
  title: string
  body: string
  cta?: string
  ctaLink?: string
  isActive: boolean
  lastModified: string
}

type TabType = "featured_arrivals" | "categories" | "banners"

const typeConfig = {
  hero_banner:        { label: "Hero Banner", icon: ImageIcon, color: "text-accent" },
  announcement_bar:   { label: "Announcement Bar", icon: Megaphone, color: "text-emerald-600" },
  promotional_strip:  { label: "Promo Strip", icon: Megaphone, color: "text-amber-600" },
  section_heading:    { label: "Section Heading", icon: Type, color: "text-blue-600" },
}

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState<TabType>("featured_arrivals")

  // Content Blocks state
  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [editBody, setEditBody] = useState("")
  const [editCta, setEditCta] = useState("")

  // Products state for Featured & New Arrivals
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [productSearch, setProductSearch] = useState("")
  const [selectedProductCategory, setSelectedProductCategory] = useState("All")
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(null)
  const [showcaseMode, setShowcaseMode] = useState<"featured" | "new_arrivals">("featured")

  // Categories state for Homepage Categories
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [newCatName, setNewCatName] = useState("")
  const [newCatSlug, setNewCatSlug] = useState("")
  const [newCatDesc, setNewCatDesc] = useState("")
  const [newCatImage, setNewCatImage] = useState("")
  const [savingCategory, setSavingCategory] = useState(false)

  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [
        { data: blockData },
        prods,
        cats
      ] = await Promise.all([
        supabase.from("content_blocks").select("*").order("sort_order", { ascending: true }),
        getAdminProducts(),
        getAdminCategories()
      ])

      if (blockData && blockData.length > 0) {
        setBlocks(blockData.map((b: any) => ({
          id: b.id,
          type: b.type,
          title: b.title,
          body: b.body,
          cta: b.cta || "",
          ctaLink: b.cta_link || "",
          isActive: b.is_active !== false,
          lastModified: b.updated_at ? new Date(b.updated_at).toISOString().split("T")[0] : "Recently"
        })))
      }

      if (prods) setProducts(prods)
      if (cats) setCategories(cats)
    } catch (err) {
      console.error("Failed to load content builder data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [])

  // --- Content Blocks Handlers ---
  const startEdit = (block: ContentBlock) => {
    setEditingId(block.id)
    setEditBody(block.body)
    setEditCta(block.cta || "")
  }

  const saveEdit = async (id: string) => {
    const { error } = await supabase
      .from("content_blocks")
      .update({
        body: editBody,
        cta: editCta || null,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)

    if (!error) {
      setBlocks(prev => prev.map(b =>
        b.id === id ? { ...b, body: editBody, cta: editCta || b.cta, lastModified: new Date().toISOString().split("T")[0] } : b
      ))
      setEditingId(null)
      setSavedId(id)
      setTimeout(() => setSavedId(null), 2000)
    } else {
      alert("Failed to save content update to database.")
    }
  }

  const toggleBlock = async (id: string) => {
    const block = blocks.find(b => b.id === id)
    if (!block) return
    const newActive = !block.isActive
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, isActive: newActive } : b))
    await supabase.from("content_blocks").update({ is_active: newActive, updated_at: new Date().toISOString() }).eq("id", id)
  }

  // --- Products Flag Toggle Handlers ---
  const handleToggleProductFlag = async (
    productId: string, 
    field: "isFeatured" | "isNewArrival" | "isBestseller"
  ) => {
    const prod = products.find(p => p.id === productId)
    if (!prod) return
    const nextVal = !prod[field]

    setUpdatingProductId(productId)

    // Optimistic UI update
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, [field]: nextVal } : p
    ))

    const ok = await updateAdminProduct(productId, { [field]: nextVal })
    if (!ok) {
      // Revert on failure
      setProducts(prev => prev.map(p =>
        p.id === productId ? { ...p, [field]: !nextVal } : p
      ))
      alert(`Could not update product status in database.`)
    }
    setUpdatingProductId(null)
  }

  // Move product up/down in current showcase display
  const moveProductInShowcase = (index: number, direction: "up" | "down", field: "isFeatured" | "isNewArrival") => {
    const subset = products.filter(p => p[field])
    if (direction === "up" && index === 0) return
    if (direction === "down" && index === subset.length - 1) return

    const targetIndex = direction === "up" ? index - 1 : index + 1
    const itemA = subset[index]
    const itemB = subset[targetIndex]

    // Swap in the main products array
    setProducts(prev => {
      const idxA = prev.findIndex(p => p.id === itemA.id)
      const idxB = prev.findIndex(p => p.id === itemB.id)
      if (idxA === -1 || idxB === -1) return prev
      const copy = [...prev]
      const temp = copy[idxA]
      copy[idxA] = copy[idxB]
      copy[idxB] = temp
      return copy
    })
  }

  // --- Category Handlers ---
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return

    setSavingCategory(true)
    const slug = newCatSlug.trim() || newCatName.trim().toLowerCase().replace(/\s+/g, "-")
    const img = newCatImage.trim() || "/products/white-oudh-attar.jpg"

    const ok = await createAdminCategory({
      name: newCatName.trim(),
      slug,
      description: newCatDesc.trim(),
      imageUrl: img
    })

    if (ok) {
      setNewCatName("")
      setNewCatSlug("")
      setNewCatDesc("")
      setNewCatImage("")
      setIsCreatingCategory(false)
      const freshCats = await getAdminCategories()
      setCategories(freshCats)
    } else {
      alert("Failed to create category. Please check your database connection.")
    }
    setSavingCategory(false)
  }

  const moveCategory = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return
    if (direction === "down" && index === categories.length - 1) return

    const targetIndex = direction === "up" ? index - 1 : index + 1
    setCategories(prev => {
      const copy = [...prev]
      const temp = copy[index]
      copy[index] = copy[targetIndex]
      copy[targetIndex] = temp
      return copy
    })
  }

  const toggleCategoryActive = (id: string) => {
    setCategories(prev => prev.map(c =>
      c.id === id ? { ...c, isActive: !c.isActive } : c
    ))
  }

  // Filtered products list
  const filteredProducts = products.filter(p => {
    const matchSearch = 
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()))
    const matchCat = selectedProductCategory === "All" || p.category.toLowerCase() === selectedProductCategory.toLowerCase()
    return matchSearch && matchCat
  })

  const featuredList = products.filter(p => p.isFeatured)
  const newArrivalList = products.filter(p => p.isNewArrival)
  const bestsellerList = products.filter(p => p.isBestseller)
  const categoryNames = ["All", ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))]

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-accent block mb-1">Storefront Customizer</span>
          <h1 className="font-heading text-3xl font-bold text-foreground">Homepage Builder</h1>
          <p className="text-sm text-foreground/60">
            Organize Featured Fragrances, curate New Arrivals, manage storefront categories, and update promotional banners.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 border border-border hover:border-accent text-foreground/80 hover:text-accent rounded-sm text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Live Store</span>
          </a>
          <button
            onClick={loadAllData}
            className="p-2.5 rounded-sm border border-border hover:border-accent text-foreground/60 hover:text-accent transition-colors"
            title="Refresh All"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border/60 gap-2 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab("featured_arrivals")}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 shrink-0 ${
            activeTab === "featured_arrivals"
              ? "border-accent text-accent bg-accent/5"
              : "border-transparent text-foreground/60 hover:text-foreground hover:bg-secondary/40"
          }`}
        >
          <Star className="w-4 h-4" />
          <span>Featured & New Arrivals</span>
          <span className="px-1.5 py-0.5 bg-secondary text-[10px] rounded-full font-mono">
            {featuredList.length + newArrivalList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("categories")}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 shrink-0 ${
            activeTab === "categories"
              ? "border-accent text-accent bg-accent/5"
              : "border-transparent text-foreground/60 hover:text-foreground hover:bg-secondary/40"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Homepage Categories</span>
          <span className="px-1.5 py-0.5 bg-secondary text-[10px] rounded-full font-mono">
            {categories.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("banners")}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 shrink-0 ${
            activeTab === "banners"
              ? "border-accent text-accent bg-accent/5"
              : "border-transparent text-foreground/60 hover:text-foreground hover:bg-secondary/40"
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Banners & Announcements</span>
          <span className="px-1.5 py-0.5 bg-secondary text-[10px] rounded-full font-mono">
            {blocks.filter(b => b.isActive).length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FEATURED & NEW ARRIVALS MANAGER */}
      {/* ========================================================================= */}
      {activeTab === "featured_arrivals" && (
        <div className="space-y-6">

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card p-5 rounded-lg border border-accent/30 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-foreground/50 font-semibold flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-accent" /> Featured on Homepage
                </p>
                <p className="text-2xl font-heading font-bold mt-1 text-accent">{featuredList.length} Products</p>
                <p className="text-[10px] text-foreground/60 mt-0.5">Displayed under 'Featured Fragrances'</p>
              </div>
              <button 
                onClick={() => setShowcaseMode("featured")}
                className={`px-3 py-1.5 rounded-sm text-xs font-semibold ${showcaseMode === "featured" ? "bg-accent text-slate-950 font-bold" : "border border-border text-foreground/70"}`}
              >
                Arrange
              </button>
            </div>

            <div className="bg-card p-5 rounded-lg border border-border/60 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-foreground/50 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> New Arrivals
                </p>
                <p className="text-2xl font-heading font-bold mt-1 text-emerald-600">{newArrivalList.length} Products</p>
                <p className="text-[10px] text-foreground/60 mt-0.5">Displayed under 'New Arrivals' section</p>
              </div>
              <button 
                onClick={() => setShowcaseMode("new_arrivals")}
                className={`px-3 py-1.5 rounded-sm text-xs font-semibold ${showcaseMode === "new_arrivals" ? "bg-accent text-slate-950 font-bold" : "border border-border text-foreground/70"}`}
              >
                Arrange
              </button>
            </div>

            <div className="bg-card p-5 rounded-lg border border-border/60 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-foreground/50 font-semibold flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-600" /> Bestsellers
                </p>
                <p className="text-2xl font-heading font-bold mt-1 text-amber-600">{bestsellerList.length} Products</p>
                <p className="text-[10px] text-foreground/60 mt-0.5">Marked with hot bestseller badges</p>
              </div>
            </div>
          </div>

          {/* Section: Live Showcase Arranger */}
          <div className="bg-card border border-accent/40 rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-sm bg-accent/10 border border-accent/20 text-accent">
                    Sequence & Ordering
                  </span>
                  <h3 className="font-heading font-bold text-base text-foreground">
                    {showcaseMode === "featured" ? "Arrange Featured Fragrances" : "Arrange New Arrivals"}
                  </h3>
                </div>
                <p className="text-xs text-foreground/60 mt-0.5">
                  Use the arrows to organize which products appear first on the live customer storefront.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowcaseMode("featured")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition-colors ${
                    showcaseMode === "featured" ? "bg-accent text-slate-950 font-bold" : "bg-secondary text-foreground/70 hover:text-foreground"
                  }`}
                >
                  Featured ({featuredList.length})
                </button>
                <button
                  onClick={() => setShowcaseMode("new_arrivals")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition-colors ${
                    showcaseMode === "new_arrivals" ? "bg-accent text-slate-950 font-bold" : "bg-secondary text-foreground/70 hover:text-foreground"
                  }`}
                >
                  New Arrivals ({newArrivalList.length})
                </button>
              </div>
            </div>

            {/* List of items in current showcase */}
            {(showcaseMode === "featured" ? featuredList : newArrivalList).length === 0 ? (
              <div className="p-8 text-center text-foreground/50 space-y-2 border border-dashed border-border rounded-md">
                <p className="text-sm font-semibold">No products currently added to this section.</p>
                <p className="text-xs">Scroll down to the Catalog Table below and toggle the Star or Lightning icon to add products.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {(showcaseMode === "featured" ? featuredList : newArrivalList).map((prod, idx, arr) => (
                  <div key={prod.id} className="bg-background border border-border/60 rounded-md p-3 relative group flex flex-col justify-between shadow-sm">
                    <div className="flex items-start gap-3">
                      <img 
                        src={prod.imageUrl || "/products/white-oudh-attar.jpg"} 
                        alt={prod.name} 
                        className="w-12 h-12 rounded object-cover border border-border/50 shrink-0" 
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-mono font-bold text-accent">#{idx + 1}</span>
                          <span className="text-[10px] text-foreground/50 truncate uppercase tracking-wider">{prod.category}</span>
                        </div>
                        <h4 className="font-semibold text-xs text-foreground truncate mt-0.5">{prod.name}</h4>
                        <p className="font-bold text-accent text-xs mt-0.5">₹{prod.price.toLocaleString("en-IN")}</p>
                      </div>
                    </div>

                    {/* Arrange & Remove controls */}
                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/40">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveProductInShowcase(idx, "up", showcaseMode === "featured" ? "isFeatured" : "isNewArrival")}
                          disabled={idx === 0}
                          className="p-1 rounded bg-secondary hover:bg-accent/20 hover:text-accent disabled:opacity-30 transition-colors"
                          title="Move earlier on homepage"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveProductInShowcase(idx, "down", showcaseMode === "featured" ? "isFeatured" : "isNewArrival")}
                          disabled={idx === arr.length - 1}
                          className="p-1 rounded bg-secondary hover:bg-accent/20 hover:text-accent disabled:opacity-30 transition-colors"
                          title="Move later on homepage"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleToggleProductFlag(prod.id, showcaseMode === "featured" ? "isFeatured" : "isNewArrival")}
                        className="text-[10px] font-semibold text-destructive hover:underline flex items-center gap-0.5"
                        title="Remove from this homepage showcase"
                      >
                        <X className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Catalog Table: Toggle Flags for any Product */}
          <div className="bg-card border border-border/60 rounded-lg shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border/40 bg-background/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-heading font-bold text-base text-foreground">Catalog Showcase Selector</h3>
                <p className="text-xs text-foreground/60 mt-0.5">
                  Toggle products to instantly include or exclude them from <strong>Featured</strong>, <strong>New Arrivals</strong>, and <strong>Bestsellers</strong>.
                </p>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    placeholder="Search catalog by name or SKU..."
                    className="w-full sm:w-64 bg-background border border-border rounded-sm py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:border-accent text-foreground"
                  />
                  <Search className="w-3.5 h-3.5 text-foreground/40 absolute left-2.5 top-2 pointer-events-none" />
                </div>

                <select
                  value={selectedProductCategory}
                  onChange={e => setSelectedProductCategory(e.target.value)}
                  className="bg-background border border-border rounded-sm py-1.5 px-3 text-xs focus:outline-none focus:border-accent text-foreground"
                >
                  {categoryNames.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/40 text-foreground/60 border-b border-border/50 uppercase tracking-widest font-semibold text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3 text-center">★ Featured</th>
                    <th className="px-4 py-3 text-center">⚡ New Arrival</th>
                    <th className="px-4 py-3 text-center">🔥 Bestseller</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredProducts.map(product => {
                    const isUpdating = updatingProductId === product.id

                    return (
                      <tr key={product.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.imageUrl || "/products/white-oudh-attar.jpg"}
                              alt={product.name}
                              className="w-9 h-9 rounded object-cover border border-border/50 shrink-0"
                            />
                            <div>
                              <p className="font-semibold text-foreground">{product.name}</p>
                              <p className="text-[10px] text-foreground/50 font-mono">{product.sku || "SN-ATTAR"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-secondary text-[10px] rounded font-semibold text-foreground/70">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-foreground">
                          ₹{product.price.toLocaleString("en-IN")}
                        </td>

                        {/* Toggle Featured */}
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleToggleProductFlag(product.id, "isFeatured")}
                            className={`px-3 py-1.5 rounded-sm text-[11px] font-bold transition-all inline-flex items-center gap-1.5 ${
                              product.isFeatured
                                ? "bg-accent text-slate-950 shadow-sm"
                                : "bg-secondary text-foreground/50 hover:text-foreground hover:bg-secondary/70"
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${product.isFeatured ? "fill-slate-950" : ""}`} />
                            <span>{product.isFeatured ? "Featured" : "Add"}</span>
                          </button>
                        </td>

                        {/* Toggle New Arrival */}
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleToggleProductFlag(product.id, "isNewArrival")}
                            className={`px-3 py-1.5 rounded-sm text-[11px] font-bold transition-all inline-flex items-center gap-1.5 ${
                              product.isNewArrival
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "bg-secondary text-foreground/50 hover:text-foreground hover:bg-secondary/70"
                            }`}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{product.isNewArrival ? "Arrival" : "Add"}</span>
                          </button>
                        </td>

                        {/* Toggle Bestseller */}
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleToggleProductFlag(product.id, "isBestseller")}
                            className={`px-3 py-1.5 rounded-sm text-[11px] font-bold transition-all inline-flex items-center gap-1.5 ${
                              product.isBestseller
                                ? "bg-amber-600 text-white shadow-sm"
                                : "bg-secondary text-foreground/50 hover:text-foreground hover:bg-secondary/70"
                            }`}
                          >
                            <Flame className="w-3.5 h-3.5" />
                            <span>{product.isBestseller ? "Bestseller" : "Add"}</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HOMEPAGE CATEGORIES & CREATOR */}
      {/* ========================================================================= */}
      {activeTab === "categories" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 border border-border/60 rounded-lg">
            <div>
              <h3 className="font-heading font-bold text-lg text-foreground">Homepage Fragrance Categories</h3>
              <p className="text-xs text-foreground/60 mt-0.5">
                Rearrange order of categories on the homepage and create new categories directly below.
              </p>
            </div>
            <button
              onClick={() => setIsCreatingCategory(true)}
              className="px-4 py-2.5 bg-accent text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-accent/90 transition-all flex items-center gap-2 shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Category</span>
            </button>
          </div>

          {/* CREATE NEW CATEGORY MODAL / FORM */}
          {isCreatingCategory && (
            <div className="bg-card border border-accent/40 rounded-lg p-6 shadow-md animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-accent/15 flex items-center justify-center text-accent">
                    <Plus className="w-4 h-4" />
                  </div>
                  <h4 className="font-heading font-bold text-base text-foreground">Create New Storefront Category</h4>
                </div>
                <button onClick={() => setIsCreatingCategory(false)} className="p-1 hover:bg-secondary rounded text-foreground/60">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/80 block mb-1">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCatName}
                      onChange={e => {
                        setNewCatName(e.target.value)
                        if (!newCatSlug) {
                          setNewCatSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))
                        }
                      }}
                      placeholder="e.g. Oud Royale, Solid Attars, Royal Bakhoor"
                      className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/80 block mb-1">
                      URL Slug *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCatSlug}
                      onChange={e => setNewCatSlug(e.target.value)}
                      placeholder="e.g. oud-royale"
                      className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground font-mono"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/80 block mb-1">
                      Banner / Image URL
                    </label>
                    <input
                      type="text"
                      value={newCatImage}
                      onChange={e => setNewCatImage(e.target.value)}
                      placeholder="e.g. /categories/oud-royale.jpg or https://..."
                      className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground text-[11px]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/80 block mb-1">
                      Short Description
                    </label>
                    <textarea
                      rows={2}
                      value={newCatDesc}
                      onChange={e => setNewCatDesc(e.target.value)}
                      placeholder="e.g. Rare and aged artisanal distillations crafted for connoisseurs."
                      className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/40">
                  <button
                    type="button"
                    onClick={() => setIsCreatingCategory(false)}
                    className="px-4 py-2 border border-border hover:bg-secondary rounded-sm text-xs font-semibold text-foreground/70"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingCategory}
                    className="px-5 py-2 bg-accent text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-accent/90 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {savingCategory ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>{savingCategory ? "Creating..." : "Save Category"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ARRANGED CATEGORIES GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {categories.map((cat, idx) => (
              <div 
                key={cat.id || cat.slug} 
                className={`bg-card border rounded-lg overflow-hidden shadow-sm flex flex-col justify-between transition-all ${
                  cat.isActive ? "border-border/60" : "border-border/30 opacity-60"
                }`}
              >
                <div className="relative h-44 bg-secondary/30">
                  <img
                    src={cat.imageUrl || "/products/white-oudh-attar.jpg"}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-heading font-bold text-lg">{cat.name}</span>
                      <span className="px-2 py-0.5 bg-accent text-slate-950 text-[10px] font-bold rounded-sm">
                        Position #{idx + 1}
                      </span>
                    </div>
                    <p className="text-white/70 text-[11px] font-mono mt-0.5">/{cat.slug}</p>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground/50">Products Assigned:</span>
                    <span className="font-bold text-foreground font-mono">{cat.productsCount} items</span>
                  </div>

                  {cat.description && (
                    <p className="text-xs text-foreground/70 line-clamp-2">{cat.description}</p>
                  )}

                  {/* Move Up / Move Down Reordering */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/40">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => moveCategory(idx, "up")}
                        disabled={idx === 0}
                        className="px-2.5 py-1 bg-secondary hover:bg-accent/20 hover:text-accent rounded text-xs font-semibold disabled:opacity-30 transition-colors flex items-center gap-1"
                        title="Move category earlier on homepage"
                      >
                        <MoveUp className="w-3.5 h-3.5" /> Move Up
                      </button>
                      <button
                        onClick={() => moveCategory(idx, "down")}
                        disabled={idx === categories.length - 1}
                        className="px-2.5 py-1 bg-secondary hover:bg-accent/20 hover:text-accent rounded text-xs font-semibold disabled:opacity-30 transition-colors flex items-center gap-1"
                        title="Move category later on homepage"
                      >
                        <MoveDown className="w-3.5 h-3.5" /> Move Down
                      </button>
                    </div>

                    <button
                      onClick={() => toggleCategoryActive(cat.id)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-sm border transition-colors ${
                        cat.isActive 
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600" 
                          : "bg-secondary border-border text-foreground/50"
                      }`}
                    >
                      {cat.isActive ? "● Live" : "○ Hidden"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BANNERS & CONTENT BLOCKS */}
      {/* ========================================================================= */}
      {activeTab === "banners" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-base text-foreground">Content Blocks & Announcements</h2>
            <span className="text-xs text-foreground/50">Click edit icon to customize message and CTA buttons</span>
          </div>

          {blocks.map(block => {
            const cfg = typeConfig[block.type]
            const Icon = cfg.icon
            const isEditing = editingId === block.id
            const isSaved = savedId === block.id

            return (
              <div
                key={block.id}
                className={`bg-card border rounded-lg shadow-sm transition-all ${
                  block.isActive ? "border-border/60" : "border-border/30 opacity-60"
                } ${isEditing ? "border-accent/40 ring-1 ring-accent/20" : "hover:border-accent/30"}`}
              >
                {/* Block Header */}
                <div className="flex items-center justify-between p-5 border-b border-border/40">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-sm bg-secondary flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-semibold text-sm text-foreground">{block.title}</h3>
                        <span className="px-2 py-0.5 bg-secondary text-[9px] font-semibold text-foreground/60 rounded-sm uppercase tracking-wider">{cfg.label}</span>
                      </div>
                      <p className="text-[10px] text-foreground/40 mt-0.5">Last modified: {block.lastModified}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm ${block.isActive ? "text-emerald-600 bg-emerald-500/10" : "text-foreground/50 bg-secondary"}`}>
                      {block.isActive ? "● LIVE" : "○ HIDDEN"}
                    </span>

                    <button
                      onClick={() => toggleBlock(block.id)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${block.isActive ? "bg-emerald-500" : "bg-secondary border border-border"}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full shadow-sm transition-all ${block.isActive ? "left-[22px] bg-white" : "left-0.5 bg-foreground/30"}`} />
                    </button>

                    <button
                      onClick={() => isEditing ? saveEdit(block.id) : startEdit(block)}
                      className={`p-2 rounded-sm transition-colors ${isEditing ? "bg-accent text-slate-950" : "border border-border hover:border-accent text-foreground/60 hover:text-accent"}`}
                    >
                      {isSaved ? <Check className="w-4 h-4 text-emerald-500" /> : isEditing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Block Content */}
                <div className="p-5">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-semibold text-foreground/60 block mb-1.5">Content / Message</label>
                        <textarea
                          value={editBody}
                          onChange={e => setEditBody(e.target.value)}
                          rows={3}
                          className="w-full bg-background border border-border rounded-sm py-2.5 px-3 text-xs focus:outline-none focus:border-accent text-foreground resize-none"
                        />
                      </div>
                      {block.cta !== undefined && (
                        <div>
                          <label className="text-[10px] uppercase tracking-widest font-semibold text-foreground/60 block mb-1.5">CTA Button Text</label>
                          <input
                            value={editCta}
                            onChange={e => setEditCta(e.target.value)}
                            className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground"
                            placeholder="e.g. Shop Now"
                          />
                        </div>
                      )}
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => saveEdit(block.id)} className="px-4 py-2 bg-accent text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-accent/90 flex items-center gap-1.5">
                          <Save className="w-3.5 h-3.5" /> Save Changes
                        </button>
                        <button onClick={() => setEditingId(null)} className="px-3 py-2 border border-border text-xs rounded-sm hover:bg-secondary">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className={`p-3 rounded-sm border text-xs ${
                        block.type === "announcement_bar" ? "bg-accent/5 border-accent/20 text-foreground" :
                        block.type === "hero_banner" ? "bg-secondary/40 border-border/50 text-foreground" :
                        block.type === "promotional_strip" ? "bg-amber-500/5 border-amber-500/20 text-foreground" :
                        "bg-background border-border/50 text-foreground"
                      }`}>
                        <p className="font-medium">{block.body}</p>
                        {block.cta && <p className="mt-1.5 text-accent font-bold">[CTA: {block.cta}]</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}