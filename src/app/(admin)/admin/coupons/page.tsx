"use client"

import { useState, useEffect } from "react"
import { 
  TicketPercent, Plus, Edit, Trash2, Copy, Check, 
  Calendar, Tag, Users, TrendingUp, Sparkles, X, RefreshCw
} from "lucide-react"
import { getAdminCoupons, createAdminCoupon, toggleAdminCoupon, deleteAdminCoupon, AdminCoupon } from "@/lib/admin-service"
import { getStoreSettings, saveStoreSettings } from "@/lib/store-settings-service"
import { ExportMenu } from "@/components/admin/export-menu"

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [offerBarEnabled, setOfferBarEnabled] = useState(true)
  const [togglingBanner, setTogglingBanner] = useState(false)
  const [newCoupon, setNewCoupon] = useState({
    code: "", type: "Percentage", value: 10, minOrder: 1500,
    validFrom: "", validUntil: "", maxUses: 100
  })

  const loadCoupons = async () => {
    setLoading(true)
    const [data, settings] = await Promise.all([
      getAdminCoupons(),
      getStoreSettings()
    ])
    setCoupons(data)
    if (settings) {
      setOfferBarEnabled(settings.showOfferBar !== false)
    }
    setLoading(false)
  }

  useEffect(() => { loadCoupons() }, [])

  const handleToggleOfferBar = async () => {
    setTogglingBanner(true)
    const nextVal = !offerBarEnabled
    await saveStoreSettings({ showOfferBar: nextVal })
    setOfferBarEnabled(nextVal)
    setTogglingBanner(false)
  }

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleCoupon = async (id: string) => {
    const coupon = coupons.find(c => c.id === id)
    if (!coupon) return
    const newActive = coupon.status !== "Active"
    const ok = await toggleAdminCoupon(id, newActive)
    if (ok) {
      setCoupons(prev => prev.map(c =>
        c.id === id ? { ...c, status: newActive ? "Active" as const : "Disabled" as const } : c
      ))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon permanently?")) return
    const ok = await deleteAdminCoupon(id)
    if (ok) setCoupons(prev => prev.filter(c => c.id !== id))
    else alert("Could not delete coupon")
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await createAdminCoupon({
      code: newCoupon.code.toUpperCase(),
      type: newCoupon.type as "Percentage" | "Fixed",
      value: Number(newCoupon.value),
      minOrderValue: Number(newCoupon.minOrder),
      validFrom: newCoupon.validFrom,
      validUntil: newCoupon.validUntil,
      maxUses: Number(newCoupon.maxUses) || undefined,
    })
    if (res.success) {
      setIsCreating(false)
      setNewCoupon({
        code: "", type: "Percentage", value: 10, minOrder: 1500,
        validFrom: "", validUntil: "", maxUses: 100
      })
      await loadCoupons()
      alert(`✅ Coupon "${newCoupon.code.toUpperCase()}" created and activated!`)
    } else {
      alert(`Failed to create coupon: ${res.error || "Please check if code already exists."}`)
    }
  }

  const statusColor = (s: string) =>
    s === "Active" ? "bg-emerald-500/15 text-emerald-600" :
    s === "Scheduled" ? "bg-blue-500/15 text-blue-600" :
    s === "Expired" ? "bg-secondary text-foreground/50" :
    "bg-secondary text-foreground/60"

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-accent block mb-1">Promotions</span>
          <h1 className="font-heading text-3xl font-bold text-foreground">Coupons & Discounts</h1>
          <p className="text-sm text-foreground/60">Create, manage, and analyze discount codes for your store campaigns.</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportMenu
            filename="attarwala_coupons_and_discounts"
            title="Coupons & Discounts"
            data={coupons.map(c => ({
              id: c.id,
              code: c.code,
              type: c.type,
              value: c.value,
              minOrderValue: c.minOrderValue,
              usedCount: c.usedCount,
              status: c.status,
              validUntil: c.validUntil
            }))}
          />
          <button
            onClick={loadCoupons}
            className="p-2.5 border border-border rounded-sm hover:border-accent hover:text-accent transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="px-5 py-2.5 bg-accent text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-accent/90 transition-all flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Coupon
          </button>
        </div>
      </div>

      {/* Storefront Top Offer Bar Toggle Banner */}
      <div className="p-4 bg-card border border-border/60 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-sm ${offerBarEnabled ? "bg-accent/15 text-accent" : "bg-destructive/15 text-destructive"}`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-heading font-bold text-xs uppercase tracking-wider text-foreground">
                Top Home Screen Offer Panel
              </p>
              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs ${
                offerBarEnabled ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30" : "bg-destructive/15 text-destructive border border-destructive/30"
              }`}>
                {offerBarEnabled ? "Currently Visible" : "Completely Disabled"}
              </span>
            </div>
            <p className="text-[11px] text-foreground/60 mt-0.5">
              {offerBarEnabled 
                ? "The top promotional ticker rotates active coupons on the customer website." 
                : "The top offer banner is hidden from customers across the entire store."}
            </p>
          </div>
        </div>
        <button
          onClick={handleToggleOfferBar}
          disabled={togglingBanner}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer shadow-xs disabled:opacity-50 shrink-0 ${
            offerBarEnabled 
              ? "bg-secondary text-foreground hover:bg-destructive hover:text-white" 
              : "bg-accent text-slate-950 hover:bg-accent/90"
          }`}
        >
          {offerBarEnabled ? "Disable Offer Bar" : "Enable Offer Bar"}
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active Coupons", value: coupons.filter(c => c.status === "Active").length, color: "text-emerald-600" },
          { label: "Total Redemptions", value: coupons.reduce((s,c) => s+c.usedCount, 0).toLocaleString(), color: "text-foreground" },
          { 
            label: "Avg Discount", 
            value: coupons.filter(c => c.type === "Percentage").length > 0
              ? `${Math.round(coupons.filter(c=>c.type==="Percentage").reduce((s,c)=>s+c.value,0) / coupons.filter(c=>c.type==="Percentage").length)}%`
              : "0%", 
            color: "text-accent" 
          },
          { label: "Revenue via Coupons", value: `₹${coupons.reduce((s,c) => s+c.revenueGenerated, 0).toLocaleString('en-IN')}`, color: "text-foreground" }
        ].map(kpi => (
          <div key={kpi.label} className="bg-card p-5 rounded-lg border border-border/60 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest text-foreground/50 font-semibold">{kpi.label}</p>
            <p className={`text-2xl font-heading font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Coupons Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-foreground/50 space-y-3 bg-card rounded-lg border border-border/60">
          <RefreshCw className="w-6 h-6 animate-spin text-accent" />
          <p className="text-xs uppercase tracking-wider font-semibold">Loading live coupons from database...</p>
        </div>
      ) : coupons.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-foreground/50 space-y-3 border border-dashed border-border/70 rounded-lg bg-card/50">
          <TicketPercent className="w-10 h-10 text-foreground/30" />
          <p className="text-sm font-bold text-foreground">No coupons found in database</p>
          <p className="text-xs text-foreground/50">Create your first coupon campaign using the button above.</p>
          <button
            onClick={() => setIsCreating(true)}
            className="mt-2 px-4 py-2 bg-accent text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-accent/90 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Coupon
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coupons.map(coupon => {
            const usagePercent = coupon.maxUses > 0 ? Math.min(100, Math.round((coupon.usedCount / coupon.maxUses) * 100)) : 0
            const hasValidExpiry = coupon.validUntil && !isNaN(new Date(coupon.validUntil).getTime())
            return (
              <div key={coupon.id} className="bg-card p-5 rounded-lg border border-border/60 hover:border-accent/40 shadow-sm space-y-4 transition-all">
                
                {/* Coupon Code Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-2 rounded-sm bg-primary font-mono font-bold text-base tracking-widest text-accent border border-accent/30 shadow-sm">
                      {coupon.code}
                    </div>
                    <button
                      onClick={() => copyCode(coupon.id, coupon.code)}
                      className="p-1.5 hover:bg-secondary rounded-sm text-foreground/60 hover:text-accent transition-colors"
                      title="Copy code"
                    >
                      {copiedId === coupon.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className={`px-2.5 py-1 rounded-sm text-[10px] font-semibold uppercase tracking-wider ${statusColor(coupon.status)}`}>
                    {coupon.status}
                  </span>
                </div>

                {/* Details Row */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-background rounded-sm border border-border/50">
                    <p className="text-[10px] text-foreground/50 uppercase tracking-widest">Discount</p>
                    <p className="font-bold text-foreground mt-0.5">
                      {coupon.type === "Percentage" ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                    </p>
                  </div>
                  <div className="p-2.5 bg-background rounded-sm border border-border/50">
                    <p className="text-[10px] text-foreground/50 uppercase tracking-widest">Min. Order</p>
                    <p className="font-bold text-foreground mt-0.5">₹{coupon.minOrderValue.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {/* Usage Bar */}
                {coupon.maxUses > 0 ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-foreground/60">
                      <span>Usage: {coupon.usedCount} / {coupon.maxUses}</span>
                      <span className="font-semibold">{usagePercent}% used</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${usagePercent > 80 ? "bg-rose-500" : usagePercent > 50 ? "bg-amber-500" : "bg-accent"}`}
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[10px] text-foreground/60 py-1">
                    <span>Redemptions: <strong className="text-foreground">{coupon.usedCount}</strong></span>
                    <span className="text-foreground/40 font-medium">Unlimited Uses</span>
                  </div>
                )}

                {/* Validity + Revenue */}
                <div className="flex items-center justify-between text-[10px] text-foreground/50 pt-2 border-t border-border/40">
                  <span>
                    {hasValidExpiry ? `Expires: ${new Date(coupon.validUntil!).toLocaleDateString('en-IN')}` : "No expiry date"}
                  </span>
                  <span className="font-semibold text-accent">
                    {coupon.revenueGenerated > 0 ? `₹${coupon.revenueGenerated.toLocaleString('en-IN')} revenue` : "0 orders yet"}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => toggleCoupon(coupon.id)}
                    className={`flex-1 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      coupon.status === "Active" 
                        ? "bg-secondary hover:bg-secondary/80 text-foreground/70" 
                        : "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border border-emerald-500/30"
                    }`}
                  >
                    {coupon.status === "Active" ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => handleDelete(coupon.id)}
                    className="p-1.5 rounded-sm hover:bg-destructive/10 text-foreground/60 hover:text-destructive transition-colors"
                    title="Delete coupon"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Coupon Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsCreating(false)} className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-card border border-border rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-border/50 flex items-center justify-between">
              <h3 className="font-heading font-bold text-base">Create New Coupon</h3>
              <button onClick={() => setIsCreating(false)} className="p-1.5 hover:bg-secondary rounded-sm">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest font-semibold text-foreground/60 block mb-1.5">Coupon Code *</label>
                <input
                  required
                  value={newCoupon.code}
                  onChange={e => setNewCoupon({...newCoupon, code: e.target.value})}
                  placeholder="e.g. ROYALEID15"
                  className="w-full bg-background border border-border rounded-sm py-2.5 px-3 text-sm font-mono font-bold focus:outline-none focus:border-accent text-foreground uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-semibold text-foreground/60 block mb-1.5">Type</label>
                  <select
                    value={newCoupon.type}
                    onChange={e => setNewCoupon({...newCoupon, type: e.target.value})}
                    className="w-full bg-background border border-border rounded-sm py-2.5 px-3 text-xs focus:outline-none focus:border-accent text-foreground"
                  >
                    <option value="Percentage">Percentage %</option>
                    <option value="Fixed">Fixed Amount ₹</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-semibold text-foreground/60 block mb-1.5">Value</label>
                  <input
                    type="number"
                    value={newCoupon.value}
                    onChange={e => setNewCoupon({...newCoupon, value: Number(e.target.value)})}
                    className="w-full bg-background border border-border rounded-sm py-2.5 px-3 text-xs focus:outline-none focus:border-accent text-foreground"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-semibold text-foreground/60 block mb-1.5">Min. Order (₹)</label>
                  <input
                    type="number"
                    value={newCoupon.minOrder}
                    onChange={e => setNewCoupon({...newCoupon, minOrder: Number(e.target.value)})}
                    className="w-full bg-background border border-border rounded-sm py-2.5 px-3 text-xs focus:outline-none focus:border-accent text-foreground"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-semibold text-foreground/60 block mb-1.5">Max Uses</label>
                  <input
                    type="number"
                    value={newCoupon.maxUses}
                    onChange={e => setNewCoupon({...newCoupon, maxUses: Number(e.target.value)})}
                    className="w-full bg-background border border-border rounded-sm py-2.5 px-3 text-xs focus:outline-none focus:border-accent text-foreground"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-semibold text-foreground/60 block mb-1.5">Valid From</label>
                  <input
                    type="date"
                    value={newCoupon.validFrom}
                    onChange={e => setNewCoupon({...newCoupon, validFrom: e.target.value})}
                    className="w-full bg-background border border-border rounded-sm py-2.5 px-3 text-xs focus:outline-none focus:border-accent text-foreground"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-semibold text-foreground/60 block mb-1.5">Valid Until</label>
                  <input
                    type="date"
                    value={newCoupon.validUntil}
                    onChange={e => setNewCoupon({...newCoupon, validUntil: e.target.value})}
                    className="w-full bg-background border border-border rounded-sm py-2.5 px-3 text-xs focus:outline-none focus:border-accent text-foreground"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-2.5 border border-border rounded-sm text-xs font-semibold uppercase tracking-wider hover:bg-secondary transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-accent text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-accent/90 transition-colors shadow-sm">
                  Create & Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
