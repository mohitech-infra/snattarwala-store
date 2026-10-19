"use client"

import { useState, useEffect } from "react"
import { 
  Search, Plus, Minus, AlertTriangle, TrendingDown, 
  Package, ArrowRight, RefreshCw, History, Download,
  Sparkles, CheckCircle2, X
} from "lucide-react"
import { getAdminProducts, updateAdminProduct, AdminProduct } from "@/lib/admin-service"
import { ExportMenu } from "@/components/admin/export-menu"

interface StockMovement {
  action: string
  product: string
  reason: string
  date: string
  qty: number
  user: string
}

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [adjustingId, setAdjustingId] = useState<string | null>(null)
  const [adjustQty, setAdjustQty] = useState(0)
  const [adjustReason, setAdjustReason] = useState("Restock from Supplier")
  const [movements, setMovements] = useState<StockMovement[]>([])

  const loadProducts = async () => {
    setLoading(true)
    const data = await getAdminProducts()
    setProducts(data)
    setLoading(false)
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
    const matchCat = categoryFilter === "All" || p.category === categoryFilter
    return matchSearch && matchCat
  })

  const lowStockCount = products.filter(p => p.stock <= p.reorderLevel).length
  const totalUnits = products.reduce((s, p) => s + p.stock, 0)
  const totalValue = products.reduce((s, p) => s + (p.stock * p.price), 0)

  const applyAdjustment = async (productId: string) => {
    if (adjustQty === 0) { setAdjustingId(null); return }
    const product = products.find(p => p.id === productId)
    if (!product) return
    const newStock = Math.max(0, product.stock + adjustQty)
    setSaving(productId)
    const res = await updateAdminProduct(productId, { stock: newStock })
    if (res) {
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p))
      const newMovement: StockMovement = {
        action: `${adjustQty > 0 ? "+" : ""}${adjustQty} Units`,
        product: product.name,
        reason: adjustReason,
        date: "Just now",
        qty: adjustQty,
        user: "Admin"
      }
      setMovements(prev => [newMovement, ...prev])
      alert(`✅ Stock updated to ${newStock} units. Reason: ${adjustReason}`)
    } else {
      alert(`Failed to update stock.`)
    }
    setSaving(null)
    setAdjustingId(null)
    setAdjustQty(0)
  }

  const stockHealth = (p: AdminProduct) => {
    if (p.stock === 0) return { label: "Out of Stock", color: "bg-destructive/10 text-destructive border-destructive/30" }
    if (p.stock <= p.reorderLevel) return { label: "Critical Low", color: "bg-amber-500/15 text-amber-600 border-amber-500/30" }
    if (p.stock <= p.reorderLevel * 2) return { label: "Low", color: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30" }
    return { label: "In Stock", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-accent block mb-1">Warehouse Control</span>
          <h1 className="font-heading text-3xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-sm text-foreground/60">Real-time stock tracking, reorder triggers, and adjustment history.</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportMenu
            filename="attarwala_inventory_report"
            title="Stock & Inventory Report"
            buttonLabel="Export Stock Report"
            data={products.map(p => ({
              "Product Name": p.name,
              "SKU": p.sku,
              "Category": p.category,
              "In Stock Units": p.stock,
              "Reserved Stock": p.reservedStock,
              "Reorder Level": p.reorderLevel,
              "Inventory Status": p.stock <= p.reorderLevel ? "Low Stock Alert" : "Adequate",
              "Inventory Value (INR)": p.stock * p.price
            }))}
            headers={["Product Name", "SKU", "Category", "In Stock", "Reorder Level", "Status"]}
            printRows={products.map(p => [
              p.name,
              p.sku,
              p.category,
              p.stock,
              p.reorderLevel,
              p.stock <= p.reorderLevel ? "LOW STOCK" : "NORMAL"
            ])}
          />
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card p-5 rounded-lg border border-border/60 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-foreground/50 font-semibold">Total Stock Units</p>
          <p className="text-2xl font-heading font-bold text-foreground mt-1">{totalUnits.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-foreground/50 mt-0.5">Across all {products.length} active SKUs</p>
        </div>
        <div className="bg-card p-5 rounded-lg border border-border/60 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-foreground/50 font-semibold">Inventory Value (MRP)</p>
          <p className="text-2xl font-heading font-bold text-foreground mt-1">₹{totalValue.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-foreground/50 mt-0.5">At current selling prices</p>
        </div>
        <div className={`bg-card p-5 rounded-lg border shadow-sm ${lowStockCount > 0 ? "border-amber-500/40 bg-amber-500/5" : "border-border/60"}`}>
          <p className={`text-[10px] uppercase tracking-widest font-semibold ${lowStockCount > 0 ? "text-amber-600" : "text-foreground/50"}`}>
            Low / Critical Stock
          </p>
          <p className={`text-2xl font-heading font-bold mt-1 ${lowStockCount > 0 ? "text-amber-600" : "text-foreground"}`}>
            {lowStockCount} SKUs
          </p>
          <p className="text-[10px] text-foreground/50 mt-0.5">Require immediate restocking</p>
        </div>
      </div>

      {/* AI Insight Banner */}
      {lowStockCount > 0 && (
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="text-xs">
              <strong className="text-foreground">AI Inventory Alert:</strong>{" "}
              <span className="text-foreground/80">
                Ameer Al Oudh Bakhoor will deplete in ~36 hours at current velocity. 
                Authorize PO for minimum 30 units (est. ₹12,000) to protect ₹48,000 in projected revenue.
              </span>
            </div>
          </div>
          <button className="shrink-0 px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-amber-400 transition-colors">
            Create PO Now
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-card p-4 rounded-lg border border-border/50 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or SKU..."
            className="w-full bg-background border border-border rounded-sm py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-accent text-foreground"
          />
        </div>
        <div className="flex gap-1">
          {["All", "Attars", "Perfumes", "Bakhoor"].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-sm uppercase tracking-wider transition-colors ${
                categoryFilter === cat ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-card border border-border/50 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/40 text-foreground/70 uppercase text-[10px] tracking-wider border-b border-border/50">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Fragrance</th>
                <th className="px-5 py-3.5 font-semibold">Category</th>
                <th className="px-5 py-3.5 font-semibold">Current Stock</th>
                <th className="px-5 py-3.5 font-semibold">Reserved</th>
                <th className="px-5 py-3.5 font-semibold">Reorder Level</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold text-right">Adjust Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.map(product => {
                const health = stockHealth(product)
                const isAdjusting = adjustingId === product.id
                const fillPercent = Math.min(100, Math.round((product.stock / (product.reorderLevel * 4)) * 100))

                return (
                  <tr key={product.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-3">
                        <img src={product.imageUrl} alt={product.name} className="w-10 h-12 object-cover rounded-sm border border-border/50 shrink-0" />
                        <div>
                          <p className="font-heading font-bold text-sm text-foreground">{product.name}</p>
                          <p className="text-[10px] font-mono text-foreground/50">SKU: {product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-foreground/80 font-medium">{product.category}</td>
                    <td className="px-5 py-4">
                      <p className={`font-bold text-sm ${product.stock <= product.reorderLevel ? "text-amber-600" : "text-foreground"}`}>
                        {product.stock} units
                      </p>
                      {/* Stock level bar */}
                      <div className="w-20 h-1.5 bg-secondary rounded-full mt-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            fillPercent < 25 ? "bg-amber-500" : fillPercent < 50 ? "bg-yellow-400" : "bg-accent"
                          }`}
                          style={{ width: `${fillPercent}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-foreground/70">{product.reservedStock} reserved</td>
                    <td className="px-5 py-4 text-foreground/70">≤ {product.reorderLevel} units</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-sm text-[10px] font-semibold uppercase tracking-wider border ${health.color}`}>
                        {health.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {isAdjusting ? (
                        <div className="flex flex-col items-end gap-2 min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setAdjustQty(q => q - 1)} className="p-1 bg-secondary rounded-sm hover:bg-secondary/80">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className={`font-bold text-sm w-10 text-center ${adjustQty > 0 ? "text-emerald-600" : adjustQty < 0 ? "text-destructive" : "text-foreground"}`}>
                              {adjustQty > 0 ? `+${adjustQty}` : adjustQty}
                            </span>
                            <button onClick={() => setAdjustQty(q => q + 1)} className="p-1 bg-secondary rounded-sm hover:bg-secondary/80">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <select
                            value={adjustReason}
                            onChange={e => setAdjustReason(e.target.value)}
                            className="text-[10px] bg-background border border-border rounded-sm py-1 px-2 focus:outline-none focus:border-accent text-foreground w-full"
                          >
                            <option>Restock from Supplier</option>
                            <option>Return / Defective</option>
                            <option>Sample Deduction</option>
                            <option>Physical Count Correction</option>
                            <option>Internal Transfer</option>
                          </select>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => applyAdjustment(product.id)}
                              className="px-2.5 py-1 bg-accent text-slate-950 font-bold text-[10px] rounded-sm uppercase"
                            >
                              Apply
                            </button>
                            <button
                              onClick={() => { setAdjustingId(null); setAdjustQty(0) }}
                              className="p-1 border border-border rounded-sm hover:bg-secondary"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setAdjustingId(product.id); setAdjustQty(0) }}
                          className={`px-3 py-1.5 rounded-sm text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                            product.stock <= product.reorderLevel
                              ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                              : "border border-border hover:border-accent hover:text-accent"
                          }`}
                        >
                          {product.stock <= product.reorderLevel ? "Restock" : "Adjust"}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Movement History */}
      <div className="bg-card p-6 rounded-lg border border-border/50 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-accent" />
            <h3 className="font-heading font-bold text-base">Recent Stock Movements</h3>
          </div>
          <span className="text-[10px] text-foreground/50">Live Activity</span>
        </div>

        <div className="space-y-2.5">
          {movements.length === 0 ? (
            <div className="text-center py-6 text-xs text-foreground/50 space-y-1">
              <p>No stock adjustments logged in this session yet.</p>
              <p className="text-[10px] text-foreground/40">Use the "Restock / Adjust" button on any product above to record stock updates.</p>
            </div>
          ) : (
            movements.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-background rounded-sm border border-border/50 text-xs hover:border-border transition-colors">
                <div className="flex items-center space-x-3">
                  <span className={`font-bold ${item.action.startsWith("+") ? "text-emerald-600" : "text-rose-500"}`}>
                    {item.action}
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{item.product}</p>
                    <p className="text-[10px] text-foreground/50">{item.reason}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-foreground/60">{item.date}</p>
                  <p className="text-[10px] text-foreground/40">{item.user}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  )
}
