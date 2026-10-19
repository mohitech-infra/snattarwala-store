"use client"

import { useState, useEffect } from "react"
import { 
  Search, Users, TrendingUp, Star, Phone, Mail,
  MapPin, ShoppingBag, X, Crown, Heart, ArrowRight,
  Filter, Download, Sparkles, RefreshCw
} from "lucide-react"
import { getAdminCustomers, AdminCustomer } from "@/lib/admin-service"
import { ExportMenu } from "@/components/admin/export-menu"

type Segment = "All" | "VIP" | "High Value" | "Returning" | "New" | "At Risk"

const segmentConfig: Record<string, { color: string; icon?: string }> = {
  "VIP":         { color: "bg-accent/20 text-accent border border-accent/40" },
  "High Value":  { color: "bg-purple-500/15 text-purple-600 border border-purple-500/30" },
  "Returning":   { color: "bg-blue-500/15 text-blue-600 border border-blue-500/30" },
  "New":         { color: "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30" },
  "At Risk":     { color: "bg-rose-500/15 text-rose-600 border border-rose-500/30" }
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [segment, setSegment] = useState<Segment>("All")
  const [selected, setSelected] = useState<AdminCustomer | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const data = await getAdminCustomers() as AdminCustomer[]
      setCustomers(data)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = customers.filter(c => {
    const matchSearch = 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || "").includes(search) ||
      (c.city || "").toLowerCase().includes(search.toLowerCase())
    const matchSeg = segment === "All" || c.segment === segment
    return matchSearch && matchSeg
  })

  const segmentCounts: Record<string, number> = {}
  customers.forEach(c => { segmentCounts[c.segment] = (segmentCounts[c.segment] || 0) + 1 })

  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0)
  const avgLtv = customers.length > 0 ? Math.round(totalRevenue / customers.length) : 0

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-accent block mb-1">Customer Intelligence</span>
          <h1 className="font-heading text-3xl font-bold text-foreground">Customer CRM</h1>
          <p className="text-sm text-foreground/60">Manage relationships with your {customers.length.toLocaleString()} registered buyers.</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportMenu
            filename="attarwala_customers_crm"
            title="Customer Profiles & CRM"
            buttonLabel="Export CRM"
            data={customers.map(c => ({
              "Customer Name": c.name,
              "Phone": c.phone,
              "Email": c.email,
              "City": c.city,
              "Segment": c.segment,
              "Total Orders": c.totalOrders,
              "Total Spent (INR)": c.totalSpent,
              "Loyalty Points": c.loyaltyPoints,
              "Status": c.status
            }))}
            headers={["Name", "Phone", "City", "Segment", "Orders", "Spent (₹)", "Status"]}
            printRows={customers.map(c => [
              c.name,
              c.phone,
              c.city,
              c.segment,
              c.totalOrders,
              `₹${c.totalSpent.toLocaleString("en-IN")}`,
              c.status
            ])}
          />
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card p-5 rounded-lg border border-border/60 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-foreground/50 font-semibold">Total Customers</p>
          <p className="text-2xl font-heading font-bold text-foreground mt-1">{customers.length.toLocaleString()}</p>
          <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">+9.8% this month</p>
        </div>
        <div className="bg-card p-5 rounded-lg border border-accent/30 shadow-sm bg-accent/5">
          <p className="text-[10px] uppercase tracking-widest text-accent font-semibold">VIP Customers</p>
          <p className="text-2xl font-heading font-bold text-accent mt-1">{segmentCounts["VIP"] || 0}</p>
          <p className="text-[10px] text-foreground/50 mt-0.5">41% of monthly revenue</p>
        </div>
        <div className="bg-card p-5 rounded-lg border border-border/60 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-foreground/50 font-semibold">Avg. Lifetime Value</p>
          <p className="text-2xl font-heading font-bold text-foreground mt-1">₹{avgLtv.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-foreground/50 mt-0.5">Per customer</p>
        </div>
        <div className="bg-card p-5 rounded-lg border border-rose-500/30 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-rose-600 font-semibold">At Risk</p>
          <p className="text-2xl font-heading font-bold text-rose-600 mt-1">{segmentCounts["At Risk"] || 0}</p>
          <p className="text-[10px] text-foreground/50 mt-0.5">Need re-engagement</p>
        </div>
      </div>

      {/* AI Segment Insight */}
      <div className="p-4 rounded-lg bg-accent/5 border border-accent/30 flex items-center gap-3 text-xs">
        <Sparkles className="w-4 h-4 text-accent shrink-0" />
        <span>
          <strong>AI Segmentation Insight:</strong> Your VIP customers (Farhan Ansari, Vikram Malhotra) generate 41% of revenue from only 8% of your customer base. 
          Issue exclusive early access to your upcoming Taif Rose collection via private WhatsApp to maximize retention.
        </span>
      </div>

      {/* Filters */}
      <div className="bg-card p-4 rounded-lg border border-border/50 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, phone, city..."
            className="w-full bg-background border border-border rounded-sm py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-accent text-foreground"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {(["All", "VIP", "High Value", "Returning", "New", "At Risk"] as Segment[]).map(s => (
            <button
              key={s}
              onClick={() => setSegment(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-sm uppercase tracking-wider transition-colors ${
                segment === s ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              {s} {s !== "All" && segmentCounts[s] ? `(${segmentCounts[s]})` : ""}
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout: Table + Profile Drawer */}
      <div className={`grid gap-6 ${selected ? "lg:grid-cols-5" : "grid-cols-1"}`}>

        {/* Customer Table */}
        <div className={`${selected ? "lg:col-span-3" : "col-span-1"} bg-card border border-border/50 rounded-lg shadow-sm overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 text-foreground/70 uppercase text-[10px] tracking-wider border-b border-border/50">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Customer</th>
                  <th className="px-5 py-3.5 font-semibold">Segment</th>
                  <th className="px-5 py-3.5 font-semibold">City</th>
                  {!selected && <th className="px-5 py-3.5 font-semibold">Total Orders</th>}
                  <th className="px-5 py-3.5 font-semibold">LTV (Spent)</th>
                  {!selected && <th className="px-5 py-3.5 font-semibold">Last Purchase</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map(customer => {
                  const isSelected = selected?.id === customer.id
                  const segCfg = segmentConfig[customer.segment] || { color: "bg-secondary text-foreground" }
                  return (
                    <tr
                      key={customer.id}
                      className={`cursor-pointer transition-colors ${isSelected ? "bg-accent/5 border-l-2 border-accent" : "hover:bg-secondary/20"}`}
                      onClick={() => setSelected(isSelected ? null : customer)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-sm flex items-center justify-center font-heading font-bold text-xs shrink-0 ${
                            customer.segment === "VIP" ? "bg-accent text-slate-950" : "bg-secondary text-foreground"
                          }`}>
                            {customer.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground flex items-center gap-1">
                              {customer.name}
                              {customer.segment === "VIP" && <Crown className="w-3 h-3 text-accent" />}
                            </p>
                            <p className="text-[10px] text-foreground/50">{customer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-semibold ${segCfg.color}`}>
                          {customer.segment}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-foreground/70">{customer.city}</td>
                      {!selected && <td className="px-5 py-3.5 font-semibold text-foreground">{customer.totalOrders}</td>}
                      <td className="px-5 py-3.5 font-bold text-foreground">₹{customer.totalSpent.toLocaleString('en-IN')}</td>
                      {!selected && <td className="px-5 py-3.5 text-foreground/60">{customer.lastPurchaseDate}</td>}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Profile Drawer */}
        {selected && (
          <div className="lg:col-span-2 bg-card border border-accent/30 rounded-lg shadow-sm overflow-hidden animate-in slide-in-from-right-4 duration-300 flex flex-col">

            <div className="p-5 border-b border-border/50 bg-background/50 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-accent">Customer Profile</span>
                <h3 className="font-heading font-bold text-base">{selected.name}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-secondary rounded-sm">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
              
              {/* Segment Badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-sm text-xs font-bold ${segmentConfig[selected.segment]?.color}`}>
                  {selected.segment} Customer
                </span>
                {selected.segment === "VIP" && (
                  <span className="text-[10px] text-accent font-semibold flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Exclusive Member
                  </span>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-foreground/80">
                  <Phone className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>{selected.phone}</span>
                </div>
                <div className="flex items-center space-x-2 text-foreground/80">
                  <Mail className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>{selected.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-foreground/80">
                  <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>{selected.address}</span>
                </div>
              </div>

              {/* Purchase Stats */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/40">
                <div className="text-center p-3 bg-background rounded-sm border border-border/50">
                  <p className="text-[10px] text-foreground/50 uppercase tracking-widest">Orders</p>
                  <p className="font-heading font-bold text-lg text-foreground">{selected.totalOrders}</p>
                </div>
                <div className="text-center p-3 bg-background rounded-sm border border-border/50">
                  <p className="text-[10px] text-foreground/50 uppercase tracking-widest">LTV</p>
                  <p className="font-heading font-bold text-lg text-accent">₹{selected.totalSpent.toLocaleString('en-IN')}</p>
                </div>
                <div className="text-center p-3 bg-background rounded-sm border border-border/50">
                  <p className="text-[10px] text-foreground/50 uppercase tracking-widest">Reviews</p>
                  <p className="font-heading font-bold text-lg text-foreground">{selected.reviewsCount ?? 0}</p>
                </div>
              </div>

              {/* Favourite Fragrances */}
              {selected.favoriteProducts && selected.favoriteProducts.length > 0 && (
                <div className="pt-3 border-t border-border/40">
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-foreground/50 mb-2.5">
                    Favourite Fragrances
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selected.favoriteProducts.map((f, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-sm bg-accent/10 text-accent border border-accent/30 text-[11px] font-medium flex items-center gap-1">
                        <Heart className="w-2.5 h-2.5 fill-accent" />
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Purchase History */}
              <div className="pt-3 border-t border-border/40">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-foreground/50 mb-2.5">
                  Recent Orders
                </p>
                <div className="space-y-2">
                  {selected.purchaseHistory?.slice(0, 3).map((h, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-background rounded-sm border border-border/50 text-xs">
                      <div>
                        <p className="font-semibold text-foreground">{h.orderId}</p>
                        <p className="text-[10px] text-foreground/50">{h.date} • {h.items} items</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">₹{h.total.toLocaleString('en-IN')}</p>
                        <span className="text-[10px] text-emerald-600 font-semibold">{h.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* CRM Actions */}
            <div className="p-4 border-t border-border/50 bg-background/50 space-y-2">
              <button className="w-full py-2.5 bg-emerald-600/10 border border-emerald-600/30 text-emerald-700 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-emerald-600/20 transition-colors flex items-center justify-center gap-2">
                <Phone className="w-3.5 h-3.5" />
                Send WhatsApp Message
              </button>
              {selected.segment === "At Risk" && (
                <button className="w-full py-2.5 bg-accent text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-accent/90 transition-colors">
                  Send Re-engagement Offer
                </button>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
