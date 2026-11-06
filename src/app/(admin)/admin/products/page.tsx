"use client"

import { useState, useEffect } from "react"
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Filter, 
  Eye, 
  Copy, 
  Sparkles, 
  ArrowUpDown, 
  Check, 
  X, 
  Upload, 
  AlertTriangle,
  Layers,
  ChevronDown,
  RefreshCw,
  Star,
  Tag,
  Box
} from "lucide-react"
import { getAdminProducts, createAdminProduct, deleteAdminProduct, updateAdminProduct, clearAllAdminProducts, AdminProduct } from "@/lib/admin-service"
import { ExportMenu } from "@/components/admin/export-menu"
import { ProductImageDropzone } from "@/components/admin/product-image-dropzone"

interface VariantItem {
  size: string
  price: number
  compareAtPrice?: number | null
  stock: number
  sku?: string
  isDefault?: boolean
}

const CATEGORY_SIZE_PRESETS: Record<string, string[]> = {
  "Attars": ["3ml", "6ml", "12ml", "25ml"],
  "Perfumes": ["30ml", "50ml", "100ml"],
  "Bakhoor": ["40g", "50g", "100g", "250g"]
}

function ProductVariantsEditor({
  category,
  baseSku,
  basePrice,
  variants = [],
  onChange
}: {
  category: string
  baseSku: string
  basePrice: number
  variants?: VariantItem[]
  onChange: (updated: VariantItem[]) => void
}) {
  const [customSize, setCustomSize] = useState("")
  const presets = CATEGORY_SIZE_PRESETS[category] || CATEGORY_SIZE_PRESETS["Attars"]
  const currentVariants = Array.isArray(variants) ? variants : []

  const handleAddPreset = (sizeName: string) => {
    if (currentVariants.some(v => v.size.toLowerCase() === sizeName.toLowerCase())) return

    let price = basePrice || 1500
    if (sizeName === "3ml") price = Math.round(price * 0.55)
    else if (sizeName === "6ml") price = Math.round(price * 0.8)
    else if (sizeName === "12ml") price = price
    else if (sizeName === "25ml") price = Math.round(price * 1.85)
    else if (sizeName === "30ml") price = Math.round(price * 0.65)
    else if (sizeName === "50ml") price = Math.round(price * 0.85)
    else if (sizeName === "100ml") price = price
    else if (sizeName === "40g") price = Math.round(price * 0.8)
    else if (sizeName === "50g") price = price
    else if (sizeName === "100g") price = Math.round(price * 1.75)
    else if (sizeName === "250g") price = Math.round(price * 3.8)

    const cleanSku = (baseSku || "SNA").trim().toUpperCase()
    const skuCode = `${cleanSku}-${sizeName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}`
    const isFirst = currentVariants.length === 0

    onChange([
      ...currentVariants,
      {
        size: sizeName,
        price,
        compareAtPrice: Math.round(price * 1.25),
        stock: 20,
        sku: skuCode,
        isDefault: isFirst
      }
    ])
  }

  const handleAddCustom = () => {
    const trimmed = customSize.trim()
    if (!trimmed) return
    if (currentVariants.some(v => v.size.toLowerCase() === trimmed.toLowerCase())) {
      setCustomSize("")
      return
    }
    const cleanSku = (baseSku || "SNA").trim().toUpperCase()
    const skuCode = `${cleanSku}-${trimmed.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}`
    const price = basePrice || 1500
    const isFirst = currentVariants.length === 0

    onChange([
      ...currentVariants,
      {
        size: trimmed,
        price,
        compareAtPrice: Math.round(price * 1.25),
        stock: 20,
        sku: skuCode,
        isDefault: isFirst
      }
    ])
    setCustomSize("")
  }

  const handleUpdateVariant = (index: number, field: keyof VariantItem, value: any) => {
    const copy = [...currentVariants]
    if (field === "isDefault" && value === true) {
      copy.forEach((v, i) => { v.isDefault = i === index })
    } else {
      copy[index] = { ...copy[index], [field]: value }
    }
    onChange(copy)
  }

  const handleRemoveVariant = (index: number) => {
    const copy = currentVariants.filter((_, i) => i !== index)
    if (copy.length > 0 && !copy.some(v => v.isDefault)) {
      copy[0].isDefault = true
    }
    onChange(copy)
  }

  const totalStock = currentVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
  const defaultVar = currentVariants.find(v => v.isDefault) || currentVariants[0]

  return (
    <div className="space-y-4 bg-background/50 border border-border/80 rounded-md p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5" />
            <span>Product Sizes & Size-Specific Pricing *</span>
          </label>
          <p className="text-[11px] text-foreground/60 mt-0.5">
            Define individual fragrance sizes (e.g. 6ml, 12ml, 50ml, 100ml), selling prices, and stocks.
          </p>
        </div>
        {currentVariants.length > 0 && (
          <div className="flex items-center gap-2 text-[10px] font-mono bg-secondary px-2.5 py-1 rounded-sm border border-border">
            <span className="text-foreground/70">{currentVariants.length} Sizes Configured</span>
            <span>•</span>
            <span className="text-emerald-500 font-bold">{totalStock} Total Units</span>
          </div>
        )}
      </div>

      {/* 1-Click Quick Preset Pills */}
      <div>
        <span className="text-[10px] uppercase font-semibold tracking-wider text-foreground/60 block mb-1.5">
          1-Click Preset Sizes for {category}:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {presets.map((sizeName) => {
            const isAdded = currentVariants.some(v => v.size.toLowerCase() === sizeName.toLowerCase())
            return (
              <button
                key={sizeName}
                type="button"
                onClick={() => handleAddPreset(sizeName)}
                disabled={isAdded}
                className={`px-3 py-1 rounded text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                  isAdded
                    ? "bg-accent/20 text-accent border border-accent/40 opacity-70 cursor-not-allowed"
                    : "bg-secondary hover:bg-accent/15 hover:border-accent/50 text-foreground border border-border cursor-pointer"
                }`}
              >
                {isAdded ? <Check className="w-3 h-3 text-accent" /> : <Plus className="w-3 h-3" />}
                <span>+ {sizeName}</span>
              </button>
            )
          })}

          {/* Custom Size Form */}
          <div className="flex items-center gap-1.5 sm:ml-auto w-full sm:w-auto mt-2 sm:mt-0">
            <input
              type="text"
              value={customSize}
              onChange={(e) => setCustomSize(e.target.value)}
              placeholder="Custom size (e.g. 15ml, 250g)"
              className="bg-background border border-border rounded-sm py-1 px-2.5 text-xs text-foreground focus:outline-none focus:border-accent w-full sm:w-44"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCustom(); } }}
            />
            <button
              type="button"
              onClick={handleAddCustom}
              className="px-3 py-1 bg-secondary hover:bg-accent hover:text-slate-950 text-foreground border border-border rounded-sm text-xs font-semibold transition-colors shrink-0"
            >
              + Add Size
            </button>
          </div>
        </div>
      </div>

      {/* Variants Table / List */}
      {currentVariants.length === 0 ? (
        <div className="p-6 border border-dashed border-border/80 rounded-md text-center bg-secondary/10">
          <p className="text-xs text-foreground/70 mb-1.5 font-bold">No sizes added yet.</p>
          <p className="text-[11px] text-foreground/50 mb-3">Click any quick preset size button above to configure your first size.</p>
          <div className="flex justify-center gap-2">
            {presets.slice(0, 2).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleAddPreset(s)}
                className="px-3 py-1.5 bg-accent text-slate-950 rounded text-xs font-bold uppercase tracking-wider hover:bg-accent/90 transition-colors"
              >
                + Add {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-wider text-foreground/50 px-2">
            <div className="col-span-2">Size Name</div>
            <div className="col-span-3">Selling Price (₹) *</div>
            <div className="col-span-3">MRP (Compare ₹)</div>
            <div className="col-span-2">Stock (Units)</div>
            <div className="col-span-2 text-right">Default / Remove</div>
          </div>

          <div className="space-y-2">
            {currentVariants.map((v, idx) => {
              const discount = v.compareAtPrice && v.compareAtPrice > v.price
                ? Math.round(((v.compareAtPrice - v.price) / v.compareAtPrice) * 100)
                : 0

              return (
                <div
                  key={idx}
                  className={`p-3 sm:p-2.5 rounded-sm border transition-colors grid grid-cols-1 sm:grid-cols-12 gap-2 items-center ${
                    v.isDefault ? "border-accent/70 bg-accent/5 ring-1 ring-accent/30" : "border-border/70 bg-card hover:border-border"
                  }`}
                >
                  {/* Size Name */}
                  <div className="sm:col-span-2 flex items-center gap-1.5">
                    <span className="text-[10px] text-foreground/50 sm:hidden w-24">Size:</span>
                    <input
                      type="text"
                      required
                      value={v.size}
                      onChange={(e) => handleUpdateVariant(idx, "size", e.target.value)}
                      placeholder="e.g. 6ml"
                      className="w-full bg-background border border-border rounded-sm py-1.5 px-2.5 text-xs font-bold text-foreground focus:outline-none focus:border-accent"
                    />
                  </div>

                  {/* Selling Price */}
                  <div className="sm:col-span-3 flex items-center gap-1.5">
                    <span className="text-[10px] text-foreground/50 sm:hidden w-24">Selling Price:</span>
                    <div className="relative w-full">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground/50 text-xs">₹</span>
                      <input
                        type="number"
                        required
                        min="0"
                        value={v.price}
                        onChange={(e) => handleUpdateVariant(idx, "price", Number(e.target.value))}
                        className="w-full bg-background border border-border rounded-sm py-1.5 pl-6 pr-2.5 text-xs font-bold text-foreground focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  {/* Compare Price */}
                  <div className="sm:col-span-3 flex items-center gap-1.5">
                    <span className="text-[10px] text-foreground/50 sm:hidden w-24">MRP Price:</span>
                    <div className="relative w-full">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground/50 text-xs">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={v.compareAtPrice || ""}
                        onChange={(e) => handleUpdateVariant(idx, "compareAtPrice", e.target.value ? Number(e.target.value) : null)}
                        placeholder="MRP (Optional)"
                        className="w-full bg-background border border-border rounded-sm py-1.5 pl-6 pr-2.5 text-xs text-foreground focus:outline-none focus:border-accent"
                      />
                      {discount > 0 && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-emerald-500">
                          {discount}% off
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stock Quantity */}
                  <div className="sm:col-span-2 flex items-center gap-1.5">
                    <span className="text-[10px] text-foreground/50 sm:hidden w-24">Stock:</span>
                    <input
                      type="number"
                      min="0"
                      value={v.stock}
                      onChange={(e) => handleUpdateVariant(idx, "stock", Number(e.target.value))}
                      className="w-full bg-background border border-border rounded-sm py-1.5 px-2.5 text-xs text-foreground focus:outline-none focus:border-accent font-semibold"
                    />
                  </div>

                  {/* Default / Actions */}
                  <div className="sm:col-span-2 flex items-center justify-end gap-1.5 pt-1 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => handleUpdateVariant(idx, "isDefault", true)}
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 ${
                        v.isDefault
                          ? "bg-accent text-slate-950 shadow-xs"
                          : "bg-secondary text-foreground/60 hover:text-foreground hover:bg-secondary/80 border border-border"
                      }`}
                      title={v.isDefault ? "Default size shown first on store" : "Click to make this the default size"}
                    >
                      <Star className={`w-3 h-3 ${v.isDefault ? "fill-slate-950 text-slate-950" : ""}`} />
                      <span>{v.isDefault ? "Default" : "Make Default"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(idx)}
                      className="p-1.5 rounded hover:text-rose-500 hover:bg-rose-500/10 text-foreground/40 transition-colors"
                      title="Remove size"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Real-time Summary Box */}
          <div className="p-3 bg-secondary/30 rounded border border-border/50 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span className="text-foreground/80">
                Storefront Starting Price: <strong className="text-foreground">₹{defaultVar?.price ? defaultVar.price.toLocaleString("en-IN") : "0"}</strong>
              </span>
            </div>
            <div className="text-[11px] text-foreground/60 font-mono">
              Combined Inventory: <strong>{totalStock} units</strong> across {currentVariants.length} sizes
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedStatus, setSelectedStatus] = useState("All")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "active" | "low_stock" | "bestseller">("all")

  const loadProducts = async () => {
    setLoading(true)
    const data = await getAdminProducts()
    setProducts(data)
    setLoading(false)
  }

  useEffect(() => {
    loadProducts()
  }, [])

  // New Product Form State
  const [newProduct, setNewProduct] = useState<Partial<AdminProduct>>({
    name: "",
    slug: "",
    sku: "",
    category: "Attars",
    series: "",
    gender: "Unisex",
    fragranceFamily: "Oud",
    price: 1500,
    salePrice: 1800,
    costPrice: 500,
    stock: 20,
    reorderLevel: 5,
    status: "Active",
    imageUrl: "",
    description: "",
    shortDescription: "",
    notes: {
      top: ["Bergamot"],
      heart: ["Agarwood"],
      base: ["Amber"]
    },
    variants: [
      { size: "6ml", sku: "", price: 1500, stock: 12 },
      { size: "12ml", sku: "", price: 2800, stock: 8 }
    ]
  })

  // Dynamic tab counts based on real products
  const activeCount = products.filter(p => p.status === "Active").length
  const lowStockCount = products.filter(p => p.stock <= (p.reorderLevel || 5)).length
  const bestsellerCount = products.filter(p => p.isBestseller || p.salesCount >= 10).length

  // Filtering
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCat = selectedCategory === "All" || p.category === selectedCategory
    const matchesStatus = selectedStatus === "All" || p.status === selectedStatus
    
    if (activeTab === "low_stock") return matchesSearch && matchesCat && p.stock <= (p.reorderLevel || 5)
    if (activeTab === "bestseller") return matchesSearch && matchesCat && (p.isBestseller || p.salesCount >= 10)
    if (activeTab === "active") return matchesSearch && matchesCat && p.status === "Active"

    return matchesSearch && matchesCat && matchesStatus
  })

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Partial<AdminProduct> | null>(null)

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProduct.name) {
      alert("Please enter Fragrance Name")
      return
    }

    const variants = newProduct.variants && newProduct.variants.length > 0 ? newProduct.variants : []
    const defaultVar = variants.find(v => v.isDefault) || variants[0]
    const finalPrice = defaultVar ? defaultVar.price : (newProduct.price || 1500)
    const finalSalePrice = (defaultVar?.compareAtPrice !== undefined && defaultVar?.compareAtPrice !== null)
      ? defaultVar.compareAtPrice
      : (newProduct.salePrice || undefined)
    const totalStock = variants.length > 0
      ? variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
      : (newProduct.stock || 20)
    const sizeSummary = variants.length > 0 ? variants.map(v => v.size).join(", ") : (newProduct.size || "")

    const productToCreate = {
      ...newProduct,
      price: finalPrice,
      salePrice: finalSalePrice,
      stock: totalStock,
      size: sizeSummary,
      variants,
      category: newProduct.category || "Attars",
      sku: newProduct.sku?.trim() || `SNA-${newProduct.name.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      imageUrl: newProduct.imageUrl || "/products/white-oudh-attar.jpg",
      description: newProduct.description?.trim() || `Exquisite luxury ${newProduct.name} crafted by SN AttarWala.`,
      shortDescription: newProduct.shortDescription?.trim() || newProduct.name,
    }

    const res = await createAdminProduct(productToCreate)
    if (res.success) {
      setIsAddModalOpen(false)
      setNewProduct({
        name: "",
        slug: "",
        sku: "",
        category: "Attars",
        series: "",
        gender: "Unisex",
        fragranceFamily: "Oud",
        price: 1500,
        salePrice: 1800,
        costPrice: 500,
        stock: 20,
        reorderLevel: 5,
        status: "Active",
        imageUrl: "",
        description: "",
        shortDescription: "",
        notes: { top: ["Bergamot"], heart: ["Agarwood"], base: ["Amber"] },
        variants: [
          { size: "6ml", sku: "SNA-6ML", price: 1500, stock: 12, compareAtPrice: 1800, isDefault: true },
          { size: "12ml", sku: "SNA-12ML", price: 2800, stock: 8, compareAtPrice: 3200, isDefault: false }
        ]
      })
      await loadProducts()
      alert("✅ New luxury fragrance published to database successfully with size variants!")
    } else {
      alert(`Failed to save product: ${res.error}`)
    }
  }

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct || !editingProduct.id) return

    const variants = editingProduct.variants && editingProduct.variants.length > 0 ? editingProduct.variants : []
    const defaultVar = variants.find(v => v.isDefault) || variants[0]
    const finalPrice = defaultVar ? defaultVar.price : (editingProduct.price || 1500)
    const finalSalePrice = (defaultVar?.compareAtPrice !== undefined && defaultVar?.compareAtPrice !== null)
      ? defaultVar.compareAtPrice
      : (editingProduct.salePrice || undefined)
    const totalStock = variants.length > 0
      ? variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
      : (editingProduct.stock || 20)
    const sizeSummary = variants.length > 0 ? variants.map(v => v.size).join(", ") : (editingProduct.size || "")

    const productToUpdate = {
      ...editingProduct,
      price: finalPrice,
      salePrice: finalSalePrice,
      stock: totalStock,
      size: sizeSummary,
      variants
    }

    const ok = await updateAdminProduct(editingProduct.id, productToUpdate)
    if (ok) {
      setIsEditModalOpen(false)
      await loadProducts()
      alert("✅ Product and size pricing updated successfully!")
    } else {
      alert("Failed to update product. (Check Supabase RLS Policies)")
    }
  }

  const openEditModal = (product: AdminProduct) => {
    const initialVariants = product.variants && product.variants.length > 0
      ? product.variants
      : (product.size ? product.size.split(",").map((s, idx) => ({
          size: s.trim(),
          sku: `${product.sku}-${s.trim()}`,
          price: product.price,
          compareAtPrice: product.salePrice || null,
          stock: product.stock,
          isDefault: idx === 0
        })) : [
          { size: product.category === "Perfumes" ? "100ml" : "12ml", sku: `${product.sku}-STD`, price: product.price, stock: product.stock, compareAtPrice: product.salePrice || null, isDefault: true }
        ])

    setEditingProduct({
      ...product,
      variants: initialVariants
    })
    setIsEditModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to remove this fragrance from the store database?")) {
      const ok = await deleteAdminProduct(id)
      if (ok) {
        setProducts(products.filter(p => p.id !== id))
      } else {
        alert("Could not delete product from database")
      }
    }
  }

  const handleClearAll = async () => {
    if (confirm("⚠️ Are you sure you want to delete ALL products from your store database? This action cannot be undone.")) {
      setLoading(true)
      const ok = await clearAllAdminProducts()
      if (ok) {
        setProducts([])
        alert("✅ All products removed. Catalog count is now 0.")
      } else {
        alert("Could not clear products from database.")
      }
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-accent block mb-1">
            Shop Catalog
          </span>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
            Fragrance Products
          </h1>
          <p className="text-sm text-foreground/60">
            Manage your perfumes, pure attars, bakhoor incense, notes, and multi-tier pricing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportMenu
            filename="attarwala_products_catalog"
            title="Fragrance Catalog"
            buttonLabel="Export Products"
            data={products.map(p => ({
              "Product Name": p.name,
              "SKU": p.sku,
              "Category": p.category,
              "Gender": p.gender,
              "Price (INR)": p.price,
              "Stock Units": p.stock,
              "Rating": p.rating,
              "Status": p.status
            }))}
            headers={["Product Name", "SKU", "Category", "Price (₹)", "Stock", "Status"]}
            printRows={products.map(p => [
              p.name,
              p.sku,
              p.category,
              `₹${p.price.toLocaleString("en-IN")}`,
              p.stock,
              p.status
            ])}
          />
          {products.length > 0 && (
            <button 
              onClick={handleClearAll}
              className="px-4 py-2.5 bg-rose-500/10 text-rose-500 border border-rose-500/30 hover:bg-rose-500/20 text-xs font-semibold uppercase tracking-wider rounded-sm transition-all flex items-center gap-2 shadow-sm"
              title="Delete all products from store database"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Products</span>
            </button>
          )}
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 bg-accent text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-accent/90 transition-all flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Fragrance</span>
          </button>
        </div>
      </div>

      {/* AI Product Insight Banner */}
      <div className="p-4 rounded-lg bg-accent/5 border border-accent/30 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2.5">
          <Sparkles className="w-4 h-4 text-accent shrink-0" />
          <span className="text-foreground/90 leading-relaxed">
            <strong>AI Product Insight:</strong> Unisex Oud and Woody perfumes have a <strong>42% higher repeat-purchase rate</strong> than purely floral single notes. Consider bundling 'White Oudh' with 'Ameer Al Oudh Bakhoor'.
          </span>
        </div>
        <span className="text-accent font-semibold uppercase tracking-wider shrink-0 text-[10px]">
          +22% Basket Size Lift
        </span>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-card p-4 rounded-lg border border-border/50 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Tabs */}
          <div className="flex items-center space-x-1 border-b md:border-b-0 border-border/40 pb-2 md:pb-0 overflow-x-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors ${
                activeTab === "all" ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:text-foreground"
              }`}
            >
              All ({products.length})
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className={`px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors ${
                activeTab === "active" ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:text-foreground"
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setActiveTab("low_stock")}
              className={`px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors ${
                activeTab === "low_stock" ? "bg-amber-500 text-slate-950 font-bold" : "text-amber-600 hover:bg-amber-500/10"
              }`}
            >
              Low Stock ({lowStockCount})
            </button>
            <button
              onClick={() => setActiveTab("bestseller")}
              className={`px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors ${
                activeTab === "bestseller" ? "bg-accent text-slate-950 font-bold" : "text-accent hover:bg-accent/10"
              }`}
            >
              Bestsellers ({bestsellerCount})
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name or SKU..."
                className="w-full bg-background border border-border rounded-sm py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-accent text-foreground"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground font-medium"
            >
              <option value="All">All Categories</option>
              <option value="Attars">Attars</option>
              <option value="Perfumes">Perfumes</option>
              <option value="Bakhoor">Bakhoor</option>
            </select>
          </div>

        </div>
      </div>

      {/* Product Table */}
      <div className="bg-card border border-border/50 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/40 text-foreground/70 uppercase text-[10px] tracking-wider border-b border-border/50">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Fragrance</th>
                <th className="px-5 py-3.5 font-semibold">Category & Notes</th>
                <th className="px-5 py-3.5 font-semibold">Selling Price</th>
                <th className="px-5 py-3.5 font-semibold">Stock / Reserved</th>
                <th className="px-5 py-3.5 font-semibold">Sales & Profit</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-foreground/50">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-accent" />
                      <span>Loading products from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-foreground/50">
                    <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                      <Layers className="w-10 h-10 text-accent/50 mb-1" />
                      <p className="font-bold text-base text-foreground">Catalog is Clean & Ready</p>
                      <p className="text-xs text-foreground/60 leading-relaxed">
                        There are 0 products in your store database. You can now list your authentic artisanal fragrances one by one.
                      </p>
                      <div className="pt-2">
                        <button
                          onClick={() => setIsAddModalOpen(true)}
                          className="px-5 py-2.5 bg-accent text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-accent/90 transition-colors shadow-sm flex items-center gap-2"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Your First Fragrance</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const profitMargin = Math.round(((product.price - product.costPrice) / product.price) * 100)
                  return (
                    <tr key={product.id} className="hover:bg-secondary/20 transition-colors">
                      
                      {/* Product Name & SKU */}
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-3.5">
                          <img 
                            src={product.imageUrl} 
                            alt={product.name} 
                            className="w-12 h-14 object-cover rounded-sm border border-border/50 shrink-0 shadow-sm" 
                          />
                          <div>
                            <p className="font-heading font-bold text-sm text-foreground">{product.name}</p>
                            <p className="text-[10px] font-mono text-foreground/50 mt-0.5">SKU: {product.sku}</p>
                            <div className="flex gap-1 mt-1">
                              {product.isFeatured && <span className="px-1.5 py-0.2 rounded text-[9px] bg-accent/20 text-accent font-semibold">Featured</span>}
                              {product.isBestseller && <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/15 text-emerald-600 font-semibold">Bestseller</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category, Series & Notes */}
                      <td className="px-5 py-4">
                        <span className="font-semibold text-foreground">{product.category}</span>
                        {product.series && (
                          <span className={`block mt-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs w-fit ${
                            product.series === "Golden Series" 
                              ? "bg-[#d4af37]/15 text-[#997300] dark:text-[#f3d267] border border-[#d4af37]/30"
                              : product.series === "Diamond Series"
                              ? "bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-400/30"
                              : "bg-amber-600/15 text-amber-800 dark:text-amber-300 border border-amber-600/30"
                          }`}>
                            {product.series}
                          </span>
                        )}
                        <p className="text-[10px] text-foreground/50 mt-0.5">{product.gender} • {product.fragranceFamily}</p>
                        <p className="text-[10px] text-accent font-medium mt-1 truncate max-w-[150px]">
                          {product.notes.top.join(", ")}
                        </p>
                      </td>

                      {/* Price & Margin */}
                      <td className="px-5 py-4">
                        <p className="font-bold text-sm text-foreground">₹{product.price.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-foreground/50">Cost: ₹{product.costPrice} ({profitMargin}% margin)</p>
                      </td>

                      {/* Stock Level */}
                      <td className="px-5 py-4">
                        {product.stock <= (product.reorderLevel ?? 5) ? (
                          <div className="flex items-center space-x-1.5 text-amber-600 font-bold">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>{product.stock} Low Stock</span>
                          </div>
                        ) : (
                          <p className="text-emerald-600 font-semibold">{product.stock} in stock</p>
                        )}
                        <p className="text-[10px] text-foreground/50">{product.reservedStock} in carts / orders</p>
                      </td>

                      {/* Sales Count & Profit */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-foreground">{product.salesCount} sold</p>
                        <p className="text-[10px] font-bold text-emerald-500" title="Profit = (Selling Price - Cost Price) * Sales Count">
                          ₹{((product.price - (product.costPrice || 0)) * product.salesCount).toLocaleString('en-IN')}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-sm text-[10px] font-semibold uppercase tracking-wider ${
                          product.status === 'Active' ? 'bg-emerald-500/15 text-emerald-600' :
                          product.status === 'Low Stock' ? 'bg-amber-500/15 text-amber-600' :
                          'bg-secondary text-foreground/60'
                        }`}>
                          {product.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => openEditModal(product)}
                            className="p-1.5 rounded-sm hover:bg-secondary text-foreground/60 hover:text-accent transition-colors"
                            title="Edit Product"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)}
                            className="p-1.5 rounded-sm hover:bg-destructive/10 text-foreground/60 hover:text-destructive transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD PRODUCT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-10 flex items-center justify-center">
          <div onClick={() => setIsAddModalOpen(false)} className="fixed inset-0 bg-black/70 backdrop-blur-sm" />

          <div className="relative w-full max-w-3xl bg-card border border-border rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left my-8">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-border/50 bg-background/50 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-accent block">New Catalog Entry</span>
                <h3 className="font-heading font-bold text-xl">Create Luxury Fragrance</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-secondary rounded-sm">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleAddProduct} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto overscroll-contain custom-scrollbar" data-lenis-prevent>
              
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-heading font-bold text-sm uppercase tracking-wider text-accent border-b border-border/40 pb-2">
                  1. Basic Information
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70 block mb-1.5">Fragrance Name *</label>
                    <input
                      type="text"
                      required
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      placeholder="e.g. Royal Taif Rose Attar"
                      className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70 block mb-1.5">SKU Code *</label>
                    <input
                      type="text"
                      required
                      value={newProduct.sku}
                      onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                      placeholder="e.g. SNA-RTR-12"
                      className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70 block mb-1.5">Category</label>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                      className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground"
                    >
                      <option value="Attars">Attars</option>
                      <option value="Perfumes">Perfumes</option>
                      <option value="Bakhoor">Bakhoor</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-accent font-bold block mb-1.5">
                      Fragrance Series ⭐
                    </label>
                    <select
                      value={newProduct.series || ""}
                      onChange={(e) => setNewProduct({...newProduct, series: e.target.value || null})}
                      className="w-full bg-background border-2 border-accent/60 rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground font-semibold"
                    >
                      <option value="">None (Standard Catalog)</option>
                      <option value="Golden Series">👑 Golden Series (₹300 - ₹999)</option>
                      <option value="Diamond Series">💎 Diamond Series (₹549 - ₹1,999)</option>
                      <option value="Luxury Series">✨ Luxury Series (₹1,099 - ₹2,999)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70 block mb-1.5">Gender</label>
                    <select
                      value={newProduct.gender}
                      onChange={(e) => setNewProduct({...newProduct, gender: e.target.value})}
                      className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground"
                    >
                      <option value="Unisex">Unisex</option>
                      <option value="Men">Men</option>
                      <option value="Women">Women</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70 block mb-1.5">Fragrance Family</label>
                    <select
                      value={newProduct.fragranceFamily}
                      onChange={(e) => setNewProduct({...newProduct, fragranceFamily: e.target.value})}
                      className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground"
                    >
                      <option value="Oud">Oud</option>
                      <option value="Woody">Woody</option>
                      <option value="Floral">Floral</option>
                      <option value="Musk">Musk</option>
                      <option value="Amber">Amber</option>
                      <option value="Fresh">Fresh / Aquatic</option>
                      <option value="Oriental">Oriental</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4 pt-2 border-t border-border/30">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70 block mb-1.5">
                      Short Tagline / Overview
                    </label>
                    <input
                      type="text"
                      value={newProduct.shortDescription || ""}
                      onChange={(e) => setNewProduct({...newProduct, shortDescription: e.target.value})}
                      placeholder="e.g. Pure royal Taif rose hydro-distilled with aged Cambodian agarwood."
                      className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground"
                    />
                    <p className="text-[10px] text-foreground/50 mt-1">Brief punchy fragrance summary displayed on product cards.</p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70 block mb-1.5">
                      Full Product Description & Scent Story
                    </label>
                    <textarea
                      rows={4}
                      value={newProduct.description || ""}
                      onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                      placeholder="Enter the complete fragrance description, artisanal heritage notes, longevity expectations, projection, and application guide..."
                      className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground leading-relaxed resize-y"
                    />
                    <p className="text-[10px] text-foreground/50 mt-1">Detailed story shown in the 'Description' tab on the storefront product page.</p>
                  </div>
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="space-y-4">
                <h4 className="font-heading font-bold text-sm uppercase tracking-wider text-accent border-b border-border/40 pb-2">
                  2. Pricing & Inventory Control
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70 block mb-1.5">MRP (Compare at) (₹)</label>
                    <input
                      type="number"
                      value={newProduct.salePrice || ""}
                      onChange={(e) => setNewProduct({...newProduct, salePrice: Number(e.target.value)})}
                      className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70 block mb-1.5">Selling Price (₹) *</label>
                    <input
                      type="number"
                      required
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})}
                      className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70 block mb-1.5">Cost Price (₹)</label>
                    <input
                      type="number"
                      value={newProduct.costPrice}
                      onChange={(e) => setNewProduct({...newProduct, costPrice: Number(e.target.value)})}
                      className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70 block mb-1.5">Initial Stock (Units)</label>
                    <input
                      type="number"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({...newProduct, stock: Number(e.target.value)})}
                      className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* Fragrance Pyramid Notes */}
              <div className="space-y-4">
                <h4 className="font-heading font-bold text-sm uppercase tracking-wider text-accent border-b border-border/40 pb-2">
                  3. Olfactory Notes Pyramid
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70 block mb-1.5">Top Notes (comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Saffron, Bergamot"
                      value={newProduct.notes?.top?.join(", ") || ""}
                      onChange={(e) => setNewProduct({
                        ...newProduct,
                        notes: {
                          top: e.target.value.split(",").map(s => s.trim()).filter(Boolean),
                          heart: newProduct.notes?.heart || [],
                          base: newProduct.notes?.base || []
                        }
                      })}
                      className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70 block mb-1.5">Heart Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Damask Rose, Jasmine"
                      value={newProduct.notes?.heart?.join(", ") || ""}
                      onChange={(e) => setNewProduct({
                        ...newProduct,
                        notes: {
                          top: newProduct.notes?.top || [],
                          heart: e.target.value.split(",").map(s => s.trim()).filter(Boolean),
                          base: newProduct.notes?.base || []
                        }
                      })}
                      className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70 block mb-1.5">Base Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Assam Oud, Ambergris"
                      value={newProduct.notes?.base?.join(", ") || ""}
                      onChange={(e) => setNewProduct({
                        ...newProduct,
                        notes: {
                          top: newProduct.notes?.top || [],
                          heart: newProduct.notes?.heart || [],
                          base: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                        }
                      })}
                      className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* Product Image Asset with Drag & Drop */}
              <div className="space-y-4">
                <h4 className="font-heading font-bold text-sm uppercase tracking-wider text-accent border-b border-border/40 pb-2">
                  4. Media & Fragrance Photography
                </h4>

                <ProductImageDropzone
                  value={newProduct.imageUrl}
                  onChange={(url) => setNewProduct({ ...newProduct, imageUrl: url })}
                  label="Fragrance Bottle Photo"
                  helpText="Drag & drop bottle photo here, or click to browse (PNG, JPG, WEBP)"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-border/50 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 border border-border rounded-sm text-xs font-semibold uppercase tracking-wider hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-accent text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-accent/90 transition-colors shadow-sm"
                >
                  Save & Publish Fragrance
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-10 flex items-center justify-center">
          <div onClick={() => setIsEditModalOpen(false)} className="fixed inset-0 bg-black/70 backdrop-blur-sm" />

          <div className="relative w-full max-w-3xl bg-card border border-border rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left my-8">
            <div className="p-6 border-b border-border/50 bg-background/50 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-accent block">Update Entry</span>
                <h3 className="font-heading font-bold text-xl">Edit Fragrance</h3>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-secondary rounded-sm">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditProduct} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto overscroll-contain custom-scrollbar" data-lenis-prevent>
              <div className="space-y-4">
                <h4 className="font-heading font-bold text-sm uppercase tracking-wider text-accent border-b border-border/40 pb-2">1. Basic Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70 block mb-1.5">Fragrance Name *</label>
                    <input required type="text" value={editingProduct.name || ""} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70 block mb-1.5">SKU Code *</label>
                    <input required type="text" value={editingProduct.sku || ""} onChange={(e) => setEditingProduct({...editingProduct, sku: e.target.value})} className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground font-mono" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70 block mb-1.5">Category</label>
                    <select
                      value={editingProduct.category || "Attars"}
                      onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                      className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground"
                    >
                      <option value="Attars">Attars</option>
                      <option value="Perfumes">Perfumes</option>
                      <option value="Bakhoor">Bakhoor</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-accent font-bold block mb-1.5">
                      Fragrance Series ⭐
                    </label>
                    <select
                      value={editingProduct.series || ""}
                      onChange={(e) => setEditingProduct({...editingProduct, series: e.target.value || null})}
                      className="w-full bg-background border-2 border-accent/60 rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground font-semibold"
                    >
                      <option value="">None (Standard Catalog)</option>
                      <option value="Golden Series">👑 Golden Series (₹300 - ₹999)</option>
                      <option value="Diamond Series">💎 Diamond Series (₹549 - ₹1,999)</option>
                      <option value="Luxury Series">✨ Luxury Series (₹1,099 - ₹2,999)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70 block mb-1.5">Gender</label>
                    <select
                      value={editingProduct.gender || "Unisex"}
                      onChange={(e) => setEditingProduct({...editingProduct, gender: e.target.value})}
                      className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground"
                    >
                      <option value="Unisex">Unisex</option>
                      <option value="Men">Men</option>
                      <option value="Women">Women</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4 pt-2 border-t border-border/30">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70 block mb-1.5">
                      Short Tagline / Overview
                    </label>
                    <input
                      type="text"
                      value={editingProduct.shortDescription || ""}
                      onChange={(e) => setEditingProduct({...editingProduct, shortDescription: e.target.value})}
                      placeholder="e.g. Pure royal Taif rose hydro-distilled with aged Cambodian agarwood."
                      className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground"
                    />
                    <p className="text-[10px] text-foreground/50 mt-1">Brief punchy fragrance summary displayed on product cards.</p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70 block mb-1.5">
                      Full Product Description & Scent Story
                    </label>
                    <textarea
                      rows={4}
                      value={editingProduct.description || ""}
                      onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                      placeholder="Enter the complete fragrance description, artisanal heritage notes, longevity expectations, projection, and application guide..."
                      className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground leading-relaxed resize-y"
                    />
                    <p className="text-[10px] text-foreground/50 mt-1">Detailed story shown in the 'Description' tab on the storefront product page.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-heading font-bold text-sm uppercase tracking-wider text-accent border-b border-border/40 pb-2">2. Pricing & Inventory</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70 block mb-1.5">MRP (Compare at) (₹)</label>
                    <input type="number" value={editingProduct.salePrice || ""} onChange={(e) => setEditingProduct({...editingProduct, salePrice: Number(e.target.value)})} className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70 block mb-1.5">Selling Price (₹) *</label>
                    <input required type="number" value={editingProduct.price || 0} onChange={(e) => setEditingProduct({...editingProduct, price: Number(e.target.value)})} className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70 block mb-1.5">Cost Price (₹)</label>
                    <input type="number" value={editingProduct.costPrice || 0} onChange={(e) => setEditingProduct({...editingProduct, costPrice: Number(e.target.value)})} className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/70 block mb-1.5">Stock (Units)</label>
                    <input type="number" value={editingProduct.stock || 0} onChange={(e) => setEditingProduct({...editingProduct, stock: Number(e.target.value)})} className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground" />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-foreground mb-2">
                      <input type="checkbox" checked={editingProduct.is_active || false} onChange={(e) => setEditingProduct({...editingProduct, is_active: e.target.checked})} className="accent-accent w-4 h-4 rounded-sm border-border" />
                      <span>Active Product</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-heading font-bold text-sm uppercase tracking-wider text-accent border-b border-border/40 pb-2">3. Media & Product Photo</h4>
                <ProductImageDropzone
                  value={editingProduct.imageUrl}
                  onChange={(url) => setEditingProduct({ ...editingProduct, imageUrl: url })}
                  label="Fragrance Bottle Photo"
                  helpText="Drag & drop new photo to replace current image"
                />
              </div>

              <div className="pt-4 border-t border-border/50 flex items-center justify-end space-x-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2.5 border border-border rounded-sm text-xs font-semibold uppercase tracking-wider hover:bg-secondary transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-accent text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-accent/90 transition-colors shadow-sm">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
