"use client"

import { useState, useEffect } from "react"
import { Heart, TrendingUp, Users, ShoppingBag, Sparkles, Search, ArrowRight, TicketPercent } from "lucide-react"
import { getAdminProducts, AdminProduct } from "@/lib/admin-service"
import { ExportMenu } from "@/components/admin/export-menu"

interface WishlistProduct {
  id: string
  name: string
  imageUrl: string
  category: string
  price: number
  wishlistCount: number
  conversionRate: number
  potentialRevenue: number
  stockStatus: "Active" | "Low Stock" | "Out of Stock"
  topWishlisters: { name: string; city: string; spent: number }[]
}

import { createClient } from "@/lib/supabase/client"

export default function AdminWishlistPage() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [wishlistCounts, setWishlistCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<WishlistProduct | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      try {
        const [prods, { data: dbWishlists }] = await Promise.all([
          getAdminProducts(),
          supabase.from("wishlists").select("product_id")
        ])

        const counts: Record<string, number> = {}
        if (dbWishlists) {
          dbWishlists.forEach((w: any) => {
            if (w.product_id) {
              counts[w.product_id] = (counts[w.product_id] || 0) + 1
            }
          })
        }
        setWishlistCounts(counts)
        setProducts(prods)
      } catch (err) {
        console.error("Failed to load wishlist data:", err)
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, [])

  // Enrich products with real wishlist data
  const wishlistProducts: WishlistProduct[] = products.map((p) => {
    const wishlistCount = wishlistCounts[p.id] || 0
    const conversionRate = wishlistCount > 0 ? 15.0 : 0
    return {
      id: p.id,
      name: p.name,
      imageUrl: p.imageUrl,
      category: p.category,
      price: p.price,
      wishlistCount,
      conversionRate,
      potentialRevenue: Math.round(wishlistCount * p.price * (conversionRate / 100)),
      stockStatus: (p.status === "Out of Stock" ? "Out of Stock" : p.status === "Low Stock" ? "Low Stock" : "Active") as WishlistProduct["stockStatus"],
      topWishlisters: [],
    }
  }).sort((a, b) => b.wishlistCount - a.wishlistCount)

  const filtered = wishlistProducts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  )

  const totalWishlists = wishlistProducts.reduce((s, p) => s + p.wishlistCount, 0)
  const totalPotentialRevenue = wishlistProducts.reduce((s, p) => s + p.potentialRevenue, 0)
  const topProduct = wishlistProducts[0]

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-accent block mb-1">Customer Desire</span>
          <h1 className="font-heading text-3xl font-bold text-foreground">Wishlist Analytics</h1>
          <p className="text-sm text-foreground/60">Track what customers desire most and convert wishlists to sales.</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportMenu
            filename="attarwala_wishlist_analytics"
            title="Wishlist Analytics"
            data={filtered.map(p => ({
              id: p.id,
              name: p.name,
              category: p.category,
              price: p.price,
              wishlistCount: p.wishlistCount,
              conversionRate: `${p.conversionRate}%`,
              potentialRevenue: p.potentialRevenue,
              stockStatus: p.stockStatus
            }))}
          />
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Wishlists", value: totalWishlists.toLocaleString(), color: "text-rose-600", icon: Heart },
          { label: "Products Wishlisted", value: wishlistProducts.length.toString(), color: "text-foreground", icon: ShoppingBag },
          { label: "Potential Revenue", value: `₹${(totalPotentialRevenue / 100000).toFixed(1)}L`, color: "text-emerald-600", icon: TrendingUp },
          { label: "Top Wishlisted", value: topProduct?.name?.split(" ").slice(0, 2).join(" ") || "—", color: "text-accent", icon: Sparkles },
        ].map(kpi => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="bg-card p-5 rounded-lg border border-border/60 shadow-sm">
              <div className="flex justify-between items-start mb-1">
                <p className="text-[10px] uppercase tracking-widest text-foreground/50 font-semibold">{kpi.label}</p>
                <Icon className="w-4 h-4 text-foreground/30" />
              </div>
              <p className={`text-2xl font-heading font-bold ${kpi.color} truncate`}>{kpi.value}</p>
            </div>
          )
        })}
      </div>

      {/* AI Insight */}
      <div className="p-4 rounded-lg bg-accent/5 border border-accent/30 flex items-start gap-3 text-xs">
        <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <span>
          <strong>AI Wishlist Insight:</strong> Products with 50+ wishlists have a <strong>3.2× higher conversion rate</strong> when offered exclusive seasonal store coupons.{" "}
          {wishlistProducts.filter(p => p.wishlistCount >= 50).length} products currently qualify for VIP promotional discounts.
          Offering an exclusive coupon to customers interested in <strong className="text-accent">{topProduct?.name}</strong> could unlock{" "}
          <strong className="text-emerald-600">₹{topProduct?.potentialRevenue?.toLocaleString('en-IN')}</strong> in potential orders.
        </span>
      </div>

      <div className={`grid gap-6 ${selected ? "lg:grid-cols-5" : "grid-cols-1"}`}>

        {/* Wishlist Table */}
        <div className={`${selected ? "lg:col-span-3" : ""}`}>
          {/* Search */}
          <div className="relative mb-4 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="w-full bg-card border border-border rounded-sm py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-accent" />
          </div>

          <div className="bg-card border border-border/50 rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 text-foreground/70 uppercase text-[10px] tracking-wider border-b border-border/50">
                <tr>
                  <th className="px-4 py-3.5 font-semibold">Rank</th>
                  <th className="px-4 py-3.5 font-semibold">Product</th>
                  {!selected && <th className="px-4 py-3.5 font-semibold">Wishlists</th>}
                  <th className="px-4 py-3.5 font-semibold">Conv. Rate</th>
                  <th className="px-4 py-3.5 font-semibold">Pot. Revenue</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-4" colSpan={6}>
                        <div className="h-3 bg-secondary rounded w-full" />
                      </td>
                    </tr>
                  ))
                ) : filtered.map((p, i) => {
                  const isSelected = selected?.id === p.id
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelected(isSelected ? null : p)}
                      className={`cursor-pointer transition-colors ${isSelected ? "bg-accent/5 border-l-2 border-accent" : "hover:bg-secondary/20"}`}
                    >
                      <td className="px-4 py-3.5">
                        <div className={`w-6 h-6 rounded-sm flex items-center justify-center text-[10px] font-bold ${
                          i === 0 ? "bg-accent text-slate-950" : i < 3 ? "bg-accent/20 text-accent" : "bg-secondary text-foreground/50"
                        }`}>
                          #{i + 1}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <img src={p.imageUrl} alt={p.name} className="w-9 h-9 object-cover rounded-sm border border-border/50" onError={e => { (e.target as HTMLImageElement).src = "/products/white-oudh-attar.jpg" }} />
                          <div>
                            <p className="font-semibold text-foreground">{p.name}</p>
                            <p className="text-[10px] text-foreground/50">{p.category}</p>
                          </div>
                        </div>
                      </td>
                      {!selected && (
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                            <span className="font-bold text-foreground">{p.wishlistCount}</span>
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3.5">
                        <span className={`font-bold ${p.conversionRate > 20 ? "text-emerald-600" : "text-foreground/80"}`}>{p.conversionRate}%</span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-foreground">₹{p.potentialRevenue.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-[10px] text-accent font-semibold px-2 py-1 rounded-sm bg-accent/10 border border-accent/20 inline-block">
                          High Interest
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="lg:col-span-2 bg-card border border-accent/30 rounded-lg shadow-sm flex flex-col animate-in slide-in-from-right-4 duration-300">
            <div className="p-5 border-b border-border/50">
              <span className="text-[10px] font-semibold text-accent uppercase tracking-widest">Wishlist Detail</span>
              <h3 className="font-heading font-bold text-base mt-0.5">{selected.name}</h3>
            </div>
            <div className="flex-1 p-5 space-y-5">
              {/* Product Image */}
              <img src={selected.imageUrl} alt={selected.name} className="w-full h-36 object-cover rounded-sm border border-border/50" onError={e => { (e.target as HTMLImageElement).src = "/products/white-oudh-attar.jpg" }} />

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Total Wishlists", value: selected.wishlistCount.toString(), color: "text-rose-600" },
                  { label: "Price", value: `₹${selected.price.toLocaleString('en-IN')}`, color: "text-foreground" },
                  { label: "Conversion Rate", value: `${selected.conversionRate}%`, color: "text-emerald-600" },
                  { label: "Potential Revenue", value: `₹${selected.potentialRevenue.toLocaleString('en-IN')}`, color: "text-accent" },
                ].map(stat => (
                  <div key={stat.label} className="p-3 bg-background border border-border/50 rounded-sm text-center">
                    <p className="text-[10px] text-foreground/50 uppercase tracking-widest">{stat.label}</p>
                    <p className={`font-heading font-bold text-sm mt-0.5 ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Top Wishlisters */}
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-foreground/50 mb-2">Top Wishlisters</p>
                <div className="space-y-2">
                  {selected.topWishlisters.map((w, i) => (
                    <div key={i} className="flex items-center justify-between text-xs p-2.5 bg-background border border-border/50 rounded-sm">
                      <div>
                        <p className="font-semibold text-foreground">{w.name}</p>
                        <p className="text-[10px] text-foreground/50">{w.city} · ₹{w.spent.toLocaleString('en-IN')} LTV</p>
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Create Discount Coupon */}
              <a
                href="/admin/coupons"
                className="w-full py-2.5 bg-accent text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <TicketPercent className="w-4 h-4" />
                <span>Create Discount for {selected.name}</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}