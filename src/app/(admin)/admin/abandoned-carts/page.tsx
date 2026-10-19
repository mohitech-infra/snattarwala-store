"use client"

import { useState, useEffect } from "react"
import {
  ShoppingCart, Search, AlertTriangle, Clock,
  RefreshCw, Phone, Mail, DollarSign, Package,
  Layers, Check
} from "lucide-react"
import { getAdminAbandonedCarts, AdminAbandonedCart } from "@/lib/admin-service"
import { ExportMenu } from "@/components/admin/export-menu"

type PriorityFilter = "ALL" | "HIGH" | "MEDIUM" | "LOW"

export default function AdminAbandonedCartsPage() {
  const [carts, setCarts] = useState<AdminAbandonedCart[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("ALL")

  const loadCarts = async () => {
    setLoading(true)
    const data = await getAdminAbandonedCarts()
    setCarts(data)
    setLoading(false)
  }

  useEffect(() => { loadCarts() }, [])

  const activeCarts = carts
  const totalValue = activeCarts.reduce((s, c) => s + c.cartValue, 0)
  const totalAbandonedUnits = activeCarts.reduce(
    (sum, c) => sum + c.items.reduce((itemSum, item) => itemSum + (item.quantity || 1), 0),
    0
  )
  const totalDistinctProductLines = activeCarts.reduce(
    (sum, c) => sum + c.items.length,
    0
  )
  const highCount = activeCarts.filter(c => c.priority === "HIGH" || c.cartValue >= 3000).length

  const filtered = activeCarts.filter(c => {
    const matchPriority = priorityFilter === "ALL" || c.priority === priorityFilter
    const matchSearch =
      c.customerName.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.items.some(i => i.name.toLowerCase().includes(search.toLowerCase()))
    return matchPriority && matchSearch
  })

  const priorityCounts = {
    HIGH: activeCarts.filter(c => c.priority === "HIGH").length,
    MEDIUM: activeCarts.filter(c => c.priority === "MEDIUM").length,
    LOW: activeCarts.filter(c => c.priority === "LOW").length,
  }

  const priorityConfig = {
    HIGH:   { bg: "bg-rose-500/15 text-rose-600 border border-rose-500/30",  label: "HIGH VALUE",  dot: "bg-rose-500" },
    MEDIUM: { bg: "bg-amber-500/15 text-amber-600 border border-amber-500/30", label: "MEDIUM",     dot: "bg-amber-500" },
    LOW:    { bg: "bg-secondary text-foreground/60 border border-border",      label: "LOW",        dot: "bg-foreground/30" },
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-accent block mb-1">Inventory Analytics</span>
          <h1 className="font-heading text-3xl font-bold text-foreground">Abandoned Carts & Products</h1>
          <p className="text-sm text-foreground/60">
            Track unpurchased cart sessions and monitor total abandoned fragrance quantities across your store.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportMenu
            filename="attarwala_abandoned_products"
            title="Abandoned Products Report"
            data={filtered.map(c => ({
              "Cart ID": c.id,
              "Customer Name": c.customerName,
              "Phone": c.phone,
              "Email": c.email || "",
              "Cart Value (₹)": c.cartValue,
              "Total Items": c.items.reduce((sum, item) => sum + item.quantity, 0),
              "Abandoned Products": c.items.map(i => `${i.name} (${i.size}) x${i.quantity}`).join("; "),
              "Abandoned Date": c.abandonedAt
            }))}
            headers={["Customer", "Phone", "Abandoned Products", "Total Value (₹)", "Date"]}
            printRows={filtered.map(c => [
              c.customerName,
              c.phone,
              c.items.map(i => `${i.name} (${i.size}) x${i.quantity}`).join(", "),
              `₹${c.cartValue.toLocaleString("en-IN")}`,
              c.abandonedAt
            ])}
          />
          <button
            onClick={loadCarts}
            className="p-2.5 border border-border rounded-sm hover:border-accent hover:text-accent transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Total Abandoned Products */}
        <div className="bg-card p-5 rounded-lg border border-accent/40 bg-accent/5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] uppercase tracking-widest text-accent font-semibold">Total Abandoned Products</p>
            <Package className="w-4 h-4 text-accent" />
          </div>
          <p className="text-2xl font-heading font-bold text-foreground">{totalAbandonedUnits} Units</p>
          <p className="text-[10px] text-foreground/50 mt-0.5">{totalDistinctProductLines} distinct fragrance items</p>
        </div>

        {/* Abandoned Sessions */}
        <div className="bg-card p-5 rounded-lg border border-border/60 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] uppercase tracking-widest text-foreground/50 font-semibold">Abandoned Carts</p>
            <ShoppingCart className="w-4 h-4 text-foreground/70" />
          </div>
          <p className="text-2xl font-heading font-bold text-foreground">{activeCarts.length}</p>
          <p className="text-[10px] text-foreground/50 mt-0.5">Unfinished customer checkout sessions</p>
        </div>

        {/* Total Value */}
        <div className="bg-card p-5 rounded-lg border border-rose-500/30 bg-rose-500/5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] uppercase tracking-widest text-rose-600 font-semibold">Abandoned Value</p>
            <DollarSign className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-heading font-bold text-rose-600">₹{totalValue.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-foreground/50 mt-0.5">Gross value sitting in carts</p>
        </div>

        {/* High Value Carts */}
        <div className="bg-card p-5 rounded-lg border border-border/60 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] uppercase tracking-widest text-foreground/50 font-semibold">High Value Carts</p>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-heading font-bold text-amber-600">{highCount}</p>
          <p className="text-[10px] text-foreground/50 mt-0.5">Carts valued at ₹3,000 or more</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-lg bg-secondary/30 border border-border/50 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2.5">
          <Layers className="w-4 h-4 text-accent shrink-0" />
          <span className="text-foreground/80 leading-relaxed">
            <strong>Abandoned Inventory Status:</strong> Showing <strong>{totalAbandonedUnits} fragrance items</strong> across {activeCarts.length} abandoned sessions. External WhatsApp marketing triggers are deactivated to maintain zero messaging cost overheads.
          </span>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wider text-foreground/50 shrink-0">
          Read-Only Analytics
        </span>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Priority tabs */}
        <div className="flex gap-1 bg-secondary/40 p-1 rounded-sm border border-border/40">
          {(["ALL", "HIGH", "MEDIUM", "LOW"] as PriorityFilter[]).map(p => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all ${
                priorityFilter === p ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:text-foreground"
              }`}
            >
              {p === "ALL" ? `All (${activeCarts.length})` : `${p} (${priorityCounts[p as keyof typeof priorityCounts]})`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customer, phone, or fragrance..."
            className="w-full bg-card border border-border rounded-sm py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-accent text-foreground shadow-sm"
          />
        </div>
      </div>

      {/* Carts List */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card border border-border/50 rounded-lg p-6 animate-pulse space-y-3">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-secondary rounded-sm" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 bg-secondary rounded w-32" />
                  <div className="h-2 bg-secondary rounded w-48" />
                </div>
              </div>
              <div className="h-14 bg-secondary rounded" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border/50 rounded-lg p-12 text-center text-foreground/50">
            <Check className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
            <p className="font-heading font-bold text-lg">No Abandoned Carts Found</p>
            <p className="text-sm mt-1">All carts are either completed or match no filters.</p>
          </div>
        ) : (
          filtered.map(cart => {
            const priCfg = priorityConfig[cart.priority]
            const totalCartUnits = cart.items.reduce((s, i) => s + (i.quantity || 1), 0)

            return (
              <div key={cart.id} className="bg-card p-5 md:p-6 rounded-lg border border-border/60 hover:border-accent/40 shadow-sm space-y-4 transition-all">

                {/* Cart Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="w-9 h-9 rounded-sm bg-accent/15 border border-accent/30 flex items-center justify-center font-heading font-bold text-sm text-accent shrink-0">
                      {cart.customerName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-sm text-foreground">{cart.customerName}</h4>
                      <div className="flex items-center gap-3 text-[10px] text-foreground/50 mt-0.5">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{cart.phone}</span>
                        {cart.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{cart.email}</span>}
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-sm text-[9px] font-bold flex items-center gap-1.5 ${priCfg.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${priCfg.dot}`} />
                      {priCfg.label}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-sm text-[9px] font-bold bg-accent/10 text-accent border border-accent/20">
                      {totalCartUnits} {totalCartUnits === 1 ? "Product" : "Products"} Abandoned
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-foreground/60">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{cart.timeAgo}</span>
                    <span className="text-foreground/30">•</span>
                    <span className="text-foreground/50">{cart.abandonedAt}</span>
                  </div>
                </div>

                {/* Cart Abandoned Items List */}
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-foreground/50">
                    Abandoned Fragrance Products ({cart.items.length} unique {cart.items.length === 1 ? "item" : "items"}, {totalCartUnits} units)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {cart.items.map((item, i) => (
                      <div key={i} className="flex items-center space-x-3 p-3 bg-background rounded-sm border border-border/50 text-xs">
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          className="w-11 h-11 object-cover rounded-sm border border-border/50 shrink-0" 
                          onError={e => { (e.target as HTMLImageElement).src = "/products/white-oudh-attar.jpg" }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-xs truncate">{item.name}</p>
                          <p className="text-[10px] text-foreground/50">{item.size} • Qty: <strong>{item.quantity}</strong></p>
                          <p className="font-bold text-accent text-xs mt-0.5">
                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                            {item.quantity > 1 && (
                              <span className="text-[10px] text-foreground/40 font-normal ml-1">
                                (₹{item.price} each)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Value Row - Clean read-only */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/40">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-foreground/60">Total Cart Value:</span>
                    <span className="font-heading font-bold text-xl text-foreground">
                      ₹{cart.cartValue.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-foreground/50 italic">
                      Session recorded in database • No external messaging fees incurred
                    </span>
                  </div>
                </div>

              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
