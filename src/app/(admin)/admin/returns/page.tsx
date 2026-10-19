"use client"

import { useState } from "react"
import {
  RotateCcw, Search, Check, X, Eye, Clock,
  AlertTriangle, MessageSquareShare, Package, DollarSign
} from "lucide-react"
import { ExportMenu } from "@/components/admin/export-menu"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface Return {
  id: string
  orderNumber: string
  customerName: string
  phone: string
  product: string
  quantity: number
  price: number
  reason: string
  reasonCode: "damaged" | "wrong_item" | "not_as_described" | "changed_mind" | "quality_issue"
  status: "Pending Review" | "Approved" | "Rejected" | "Refunded" | "Replacement Sent"
  requestedAt: string
  timeAgo: string
  imageUrl: string
}

const reasonLabels: Record<Return["reasonCode"], string> = {
  damaged: "Damaged / Broken",
  wrong_item: "Wrong Item Sent",
  not_as_described: "Not as Described",
  changed_mind: "Changed Mind",
  quality_issue: "Quality Issue",
}

const statusConfig: Record<Return["status"], { bg: string; text: string }> = {
  "Pending Review":    { bg: "bg-amber-500/15", text: "text-amber-600" },
  "Approved":          { bg: "bg-blue-500/15", text: "text-blue-600" },
  "Rejected":          { bg: "bg-destructive/10", text: "text-destructive" },
  "Refunded":          { bg: "bg-emerald-500/15", text: "text-emerald-600" },
  "Replacement Sent":  { bg: "bg-accent/15", text: "text-accent" },
}

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<Return[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Return | null>(null)
  const supabase = createClient()

  const loadReturns = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("returns")
        .select("*")
        .order("created_at", { ascending: false })

      if (!error && data) {
        setReturns(data.map((r: any) => ({
          id: r.id,
          orderNumber: r.order_number?.startsWith("#") ? r.order_number : `#${r.order_number || 'ATW'}`,
          customerName: r.customer_name || "Customer",
          phone: r.phone || "",
          product: r.product_name || "Fragrance",
          quantity: Number(r.quantity) || 1,
          price: Number(r.price) || 0,
          reason: r.reason || "Return requested",
          reasonCode: (r.reason_code || "changed_mind") as Return["reasonCode"],
          status: (r.status || "Pending Review") as Return["status"],
          requestedAt: r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Recently",
          timeAgo: r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN") : "Recently",
          imageUrl: r.image_url || "/products/white-oudh-attar.jpg"
        })))
      }
    } catch (err) {
      console.error("Failed to load returns:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReturns()
  }, [])

  const filtered = returns.filter(r =>
    r.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    r.customerName.toLowerCase().includes(search.toLowerCase()) ||
    r.product.toLowerCase().includes(search.toLowerCase())
  )

  const updateStatus = async (id: string, status: Return["status"]) => {
    const { error } = await supabase
      .from("returns")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (!error) {
      setReturns(prev => prev.map(r => r.id === id ? { ...r, status } : r))
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : prev)
    } else {
      alert("Failed to update return status in database.")
    }
  }

  const pendingCount = returns.filter(r => r.status === "Pending Review").length
  const totalRefunded = returns.filter(r => r.status === "Refunded").reduce((s, r) => s + r.price, 0)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-accent block mb-1">Post-Sale</span>
          <h1 className="font-heading text-3xl font-bold text-foreground">Returns & Refunds</h1>
          <p className="text-sm text-foreground/60">Review and process customer return requests and refund claims.</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <div className="px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-600 text-xs font-bold uppercase tracking-wider rounded-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {pendingCount} Pending Review
            </div>
          )}
          <ExportMenu
            filename="attarwala_returns_and_refunds"
            title="Returns & Refunds"
            data={filtered.map(r => ({
              id: r.id,
              orderNumber: r.orderNumber,
              customerName: r.customerName,
              phone: r.phone,
              product: r.product,
              quantity: r.quantity,
              price: r.price,
              reason: r.reason,
              status: r.status,
              requestedAt: r.requestedAt
            }))}
          />
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Returns", value: returns.length, color: "text-foreground" },
          { label: "Pending Review", value: pendingCount, color: "text-amber-600" },
          { label: "Approved / Refunded", value: returns.filter(r => r.status === "Refunded" || r.status === "Approved").length, color: "text-emerald-600" },
          { label: "Total Refunded", value: `₹${totalRefunded.toLocaleString('en-IN')}`, color: "text-rose-600" },
        ].map(kpi => (
          <div key={kpi.label} className="bg-card p-5 rounded-lg border border-border/60 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest text-foreground/50 font-semibold">{kpi.label}</p>
            <p className={`text-2xl font-heading font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search order, customer, or product..."
          className="w-full bg-card border border-border rounded-sm py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-accent"
        />
      </div>

      {/* Main Grid */}
      <div className={`grid gap-6 ${selected ? "lg:grid-cols-5" : "grid-cols-1"}`}>

        {/* Returns List */}
        <div className={`${selected ? "lg:col-span-3" : ""} bg-card border border-border/50 rounded-lg shadow-sm overflow-hidden`}>
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/40 text-foreground/70 uppercase text-[10px] tracking-wider border-b border-border/50">
              <tr>
                <th className="px-4 py-3.5 font-semibold">Order</th>
                <th className="px-4 py-3.5 font-semibold">Customer</th>
                {!selected && <th className="px-4 py-3.5 font-semibold">Reason</th>}
                <th className="px-4 py-3.5 font-semibold">Amount</th>
                <th className="px-4 py-3.5 font-semibold">Status</th>
                <th className="px-4 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={selected ? 5 : 6} className="text-center py-12 text-foreground/50">
                    <RotateCcw className="w-8 h-8 mx-auto mb-2 text-foreground/30 opacity-60" />
                    <p className="font-semibold text-sm">No return requests found</p>
                    <p className="text-xs mt-1 text-foreground/40">Customer return or refund requests will appear here live from the database.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(ret => {
                  const sCfg = statusConfig[ret.status] || statusConfig["Pending Review"]
                  const isSelected = selected?.id === ret.id
                  return (
                    <tr
                      key={ret.id}
                      className={`cursor-pointer transition-colors ${isSelected ? "bg-accent/5 border-l-2 border-accent" : "hover:bg-secondary/20"}`}
                      onClick={() => setSelected(isSelected ? null : ret)}
                    >
                      <td className="px-4 py-3.5 font-mono font-bold text-foreground">{ret.orderNumber}</td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-foreground">{ret.customerName}</p>
                        <p className="text-[10px] text-foreground/50">{ret.timeAgo}</p>
                      </td>
                      {!selected && (
                        <td className="px-4 py-3.5 text-foreground/70 max-w-[180px] truncate">{reasonLabels[ret.reasonCode]}</td>
                      )}
                      <td className="px-4 py-3.5 font-bold text-foreground">₹{ret.price.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-semibold ${sCfg.bg} ${sCfg.text}`}>{ret.status}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Eye className={`w-4 h-4 ml-auto ${isSelected ? "text-accent" : "text-foreground/40"}`} />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="lg:col-span-2 bg-card border border-accent/30 rounded-lg shadow-sm flex flex-col animate-in slide-in-from-right-4 duration-300">
            <div className="p-5 border-b border-border/50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-accent uppercase tracking-widest">Return Detail</span>
                <h3 className="font-heading font-bold text-base">{selected.orderNumber}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-secondary rounded-sm"><X className="w-4 h-4" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Product */}
              <div className="flex items-center gap-3 p-3 bg-background border border-border/50 rounded-sm">
                <img src={selected.imageUrl} alt={selected.product} className="w-12 h-12 object-cover rounded-sm border border-border/50" onError={e => { (e.target as HTMLImageElement).src = "/products/white-oudh-attar.jpg" }} />
                <div>
                  <p className="font-semibold text-foreground text-sm">{selected.product}</p>
                  <p className="text-xs text-foreground/50">Qty: {selected.quantity} · ₹{selected.price.toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Customer */}
              <div className="space-y-1.5 text-xs">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-foreground/50">Customer</p>
                <p className="font-semibold text-foreground">{selected.customerName}</p>
                <p className="text-foreground/60">{selected.phone}</p>
              </div>

              {/* Reason */}
              <div className="space-y-1.5 text-xs">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-foreground/50">Return Reason</p>
                <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-sm text-[10px] font-semibold">{reasonLabels[selected.reasonCode]}</span>
                <p className="text-foreground/70 mt-2 leading-relaxed">{selected.reason}</p>
              </div>

              {/* Current Status */}
              <div className="space-y-1.5 text-xs">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-foreground/50">Current Status</p>
                <span className={`px-3 py-1.5 rounded-sm text-xs font-bold ${statusConfig[selected.status].bg} ${statusConfig[selected.status].text}`}>{selected.status}</span>
              </div>
            </div>

            {/* Action Footer */}
            {selected.status === "Pending Review" && (
              <div className="p-4 border-t border-border/50 space-y-2">
                <button onClick={() => updateStatus(selected.id, "Approved")} className="w-full py-2.5 bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> Approve Return
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => updateStatus(selected.id, "Replacement Sent")} className="py-2 border border-accent/30 text-accent text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-accent/10 flex items-center justify-center gap-1.5">
                    <Package className="w-3.5 h-3.5" /> Replacement
                  </button>
                  <button onClick={() => updateStatus(selected.id, "Rejected")} className="py-2 border border-destructive/30 text-destructive text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-destructive/10 flex items-center justify-center gap-1.5">
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
                <button className="w-full py-2.5 bg-emerald-600/10 border border-emerald-600/30 text-emerald-700 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-emerald-600/20 transition-colors flex items-center justify-center gap-2">
                  <MessageSquareShare className="w-4 h-4" /> WhatsApp Customer
                </button>
              </div>
            )}
            {selected.status === "Approved" && (
              <div className="p-4 border-t border-border/50">
                <button onClick={() => updateStatus(selected.id, "Refunded")} className="w-full py-2.5 bg-accent text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-accent/90 transition-colors flex items-center justify-center gap-2">
                  <DollarSign className="w-4 h-4" /> Process Refund ₹{selected.price.toLocaleString('en-IN')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}