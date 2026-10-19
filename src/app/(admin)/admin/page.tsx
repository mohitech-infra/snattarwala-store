"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  DollarSign, 
  AlertTriangle, 
  Boxes, 
  Sparkles, 
  ArrowUpRight, 
  ArrowRight, 
  Eye, 
  FileText, 
  Clock, 
  CheckCircle2, 
  Filter,
  Flame,
  ChevronRight,
  ShieldCheck,
  Zap,
  RefreshCw
} from "lucide-react"
import { getAdminDashboardMetrics, AdminProduct, AdminOrder } from "@/lib/admin-service"
import { ADMIN_AI_INSIGHTS } from "@/lib/admin-ai"

export default function ExecutiveDashboard() {
  const [chartMetric, setChartMetric] = useState<"revenue" | "orders" | "aov">("revenue")
  const [chartPeriod, setChartPeriod] = useState<"7D" | "30D" | "3M" | "6M" | "1Y">("30D")
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<any>(null)

  const loadData = async () => {
    setLoading(true)
    const data = await getAdminDashboardMetrics()
    setMetrics(data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const products: AdminProduct[] = metrics?.products || []
  const orders: AdminOrder[] = metrics?.orders || []
  const totalSales = metrics?.totalSales || 0
  const totalOrders = metrics?.totalOrders || orders.length
  const totalCustomers = metrics?.totalCustomers || 0
  const aov = metrics?.averageOrderValue || 0
  const lowStockCount = metrics?.lowStockCount || products.filter(p => p.stock <= p.reorderLevel).length

  // Real orders grouped across the last 7 days
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const chartData7D = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dayName = days[d.getDay()]
    const dateStr = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" })
    
    const dayOrders = orders.filter(o => {
      const od = new Date(o.createdAt)
      return od.toDateString() === d.toDateString() && o.orderStatus !== "Cancelled"
    })

    const dayRevenue = dayOrders.reduce((sum, o) => sum + o.total, 0)
    const dayCount = dayOrders.length
    const dayAov = dayCount > 0 ? Math.round(dayRevenue / dayCount) : 0

    return {
      day: dayName,
      date: dateStr,
      revenue: dayRevenue,
      orders: dayCount,
      aov: dayAov
    }
  })

  const maxVal = Math.max(...chartData7D.map(d => d[chartMetric]), 1)
  const peakDay = [...chartData7D].sort((a, b) => b.revenue - a.revenue)[0]

  const topSellingProducts = [...products].sort((a, b) => b.salesCount - a.salesCount).slice(0, 4)
  const lowStockProducts = products.filter(p => p.stock <= p.reorderLevel).slice(0, 3)
  const recentOrders = orders.slice(0, 5)

  const dynamicInsights = [
    ...(lowStockCount > 0 ? [{
      id: "low-stock",
      type: "CRITICAL" as const,
      title: `${lowStockCount} Products Low on Stock`,
      description: `${lowStockProducts.map(p => p.name).join(", ")} is at or below reorder threshold. Restock warehouse soon to prevent missed sales.`,
      actionButtonLabel: "Restock Now",
      actionTarget: "/admin/inventory",
      impact: `${lowStockCount} SKUs critical`,
      metric: "Stockout Risk"
    }] : []),
    ...(orders.length > 0 ? [{
      id: "orders-flow",
      type: "HIGH" as const,
      title: `${orders.length} Real Orders Recorded`,
      description: `Lifetime gross revenue of ₹${totalSales.toLocaleString('en-IN')} with average basket size of ₹${aov.toLocaleString('en-IN')}. Track fulfillment in Shipping & Courier.`,
      actionButtonLabel: "View Orders",
      actionTarget: "/admin/orders",
      impact: `₹${totalSales.toLocaleString('en-IN')} volume`,
      metric: "Active Sales"
    }] : []),
    {
      id: "catalog-status",
      type: "OPPORTUNITY" as const,
      title: `Catalog Health: ${products.length} Active SKUs`,
      description: `All catalog fragrances are live and active in the database. Use Coupons & Discounts to drive traffic during festive seasons.`,
      actionButtonLabel: "Manage Coupons",
      actionTarget: "/admin/coupons",
      impact: "Zero API cost",
      metric: `${products.length} Fragrances`
    }
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Welcome Banner & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-accent block mb-1">
            Executive Command Suite
          </span>
          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Good morning, SN Attarwala
          </h1>
          <p className="text-sm text-foreground/60 mt-1 font-light">
            Here's what's happening across your Mumbai boutiques & online operations today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="px-4 py-2.5 bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-wider rounded-sm hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-accent" />
            <span>Process {totalOrders > 0 ? `${totalOrders} Orders` : "Orders"}</span>
          </Link>
          <Link
            href="/admin/inventory"
            className="px-4 py-2.5 border border-border bg-card text-foreground text-xs font-semibold uppercase tracking-wider rounded-sm hover:border-accent hover:text-accent transition-colors"
          >
            <span>Restock Inventory</span>
          </Link>
        </div>
      </div>

      {/* TODAY'S AI DAILY BRIEF */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-card via-card to-accent/10 border border-accent/40 p-6 md:p-8 shadow-[0_10px_30px_rgba(212,175,55,0.08)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center space-x-2.5">
              <span className="px-2.5 py-1 rounded-full bg-accent text-slate-950 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3 h-3 fill-slate-950" />
                Today's AI Daily Brief
              </span>
              <span className="text-xs text-foreground/50">Updated 5 minutes ago</span>
            </div>

            <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground leading-snug">
              {totalOrders > 0 
                ? `"Store volume is stable. ${lowStockCount} low-stock SKUs require attention."`
                : `"Awaiting first orders. Store is ready for business."`}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="flex items-center space-x-2 text-foreground/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Gross Sales: <strong>₹{totalSales.toLocaleString('en-IN')}</strong> ({totalOrders} orders)</span>
              </div>
              <div className="flex items-center space-x-2 text-foreground/80">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Inventory: <strong>{lowStockCount} SKUs low</strong></span>
              </div>
              <div className="flex items-center space-x-2 text-foreground/80">
                <Flame className="w-4 h-4 text-rose-500 shrink-0" />
                <span><strong>0 Carts</strong> waiting recovery</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
            <Link
              href="/admin/abandoned-carts"
              className="px-5 py-3 bg-accent text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-accent/90 transition-all text-center flex items-center justify-center gap-2 shadow-sm"
            >
              <span>View Abandoned Carts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/admin/inventory"
              className="px-5 py-3 border border-border hover:border-accent text-foreground text-xs font-semibold uppercase tracking-wider rounded-sm hover:bg-secondary transition-colors text-center"
            >
              <span>Restock Low SKUs</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* Total Sales */}
        <div className="bg-card p-5 rounded-lg border border-border/60 hover:border-accent/60 transition-all duration-300 shadow-sm flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-semibold text-foreground/50 uppercase tracking-widest">Total Sales</span>
            <div className="p-1.5 rounded bg-accent/10 text-accent">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold font-heading text-foreground">₹{totalSales.toLocaleString('en-IN')}</h3>
            <div className="flex items-center space-x-1.5 text-xs text-emerald-600 font-medium mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Live Synced</span>
              <span className="text-foreground/40 font-normal text-[10px]">via Razorpay & DB</span>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-card p-5 rounded-lg border border-border/60 hover:border-accent/60 transition-all duration-300 shadow-sm flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-semibold text-foreground/50 uppercase tracking-widest">Total Orders</span>
            <div className="p-1.5 rounded bg-primary/10 text-primary">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold font-heading text-foreground">{totalOrders.toLocaleString()}</h3>
            <div className="flex items-center space-x-1.5 text-xs text-emerald-600 font-medium mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>100% tracked</span>
            </div>
          </div>
        </div>

        {/* Customers */}
        <div className="bg-card p-5 rounded-lg border border-border/60 hover:border-accent/60 transition-all duration-300 shadow-sm flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-semibold text-foreground/50 uppercase tracking-widest">Total Customers</span>
            <div className="p-1.5 rounded bg-secondary text-foreground">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold font-heading text-foreground">{totalCustomers.toLocaleString()}</h3>
            <div className="flex items-center space-x-1.5 text-xs text-emerald-600 font-medium mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Registered & Active</span>
            </div>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-card p-5 rounded-lg border border-border/60 hover:border-accent/60 transition-all duration-300 shadow-sm flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-semibold text-foreground/50 uppercase tracking-widest">Avg Order Value</span>
            <div className="p-1.5 rounded bg-accent/10 text-accent">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold font-heading text-foreground">₹{aov.toLocaleString('en-IN')}</h3>
            <div className="flex items-center space-x-1.5 text-xs text-emerald-600 font-medium mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Per transaction</span>
            </div>
          </div>
        </div>

        {/* Low Stock */}
        <Link href="/admin/inventory" className="bg-card p-5 rounded-lg border border-amber-500/30 hover:border-amber-500 transition-all duration-300 shadow-sm flex flex-col justify-between group cursor-pointer">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-widest">Low Stock Alert</span>
            <div className="p-1.5 rounded bg-amber-500/10 text-amber-500">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold font-heading text-amber-600">{lowStockCount} SKUs</h3>
            <div className="flex items-center space-x-1.5 text-xs text-amber-600 font-medium mt-1">
              <span>Restock trigger active</span>
              <ChevronRight className="w-3 h-3 ml-auto opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </Link>

        {/* Pending Orders */}
        <Link href="/admin/orders" className="bg-card p-5 rounded-lg border border-border/60 hover:border-accent/60 transition-all duration-300 shadow-sm flex flex-col justify-between group cursor-pointer">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-semibold text-foreground/50 uppercase tracking-widest">Active Orders</span>
            <div className="p-1.5 rounded bg-secondary text-foreground">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold font-heading text-foreground">{orders.length} Orders</h3>
            <div className="flex items-center space-x-1.5 text-xs text-accent font-medium mt-1">
              <span>View fulfillment</span>
              <ChevronRight className="w-3 h-3 ml-auto opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </Link>

      </div>

      {/* SALES OVERVIEW CHART & AI ADVISOR WIDGET */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Interactive Chart (2 Columns) */}
        <div className="lg:col-span-2 bg-card p-6 md:p-8 rounded-lg border border-border/60 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
            <div>
              <span className="text-[10px] font-semibold text-accent uppercase tracking-widest block">Revenue Analytics</span>
              <h3 className="font-heading text-xl font-bold text-foreground">Sales & Volume Overview</h3>
            </div>

            {/* Metric Selector */}
            <div className="flex items-center space-x-1 bg-secondary/50 p-1 rounded-sm border border-border/40">
              <button
                onClick={() => setChartMetric("revenue")}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-sm transition-all ${
                  chartMetric === "revenue" ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/70 hover:text-foreground"
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setChartMetric("orders")}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-sm transition-all ${
                  chartMetric === "orders" ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/70 hover:text-foreground"
                }`}
              >
                Orders
              </button>
              <button
                onClick={() => setChartMetric("aov")}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-sm transition-all ${
                  chartMetric === "aov" ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/70 hover:text-foreground"
                }`}
              >
                AOV
              </button>
            </div>
          </div>

          {/* Interactive Chart Canvas */}
          <div className="pt-6">
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <span className="text-3xl md:text-4xl font-heading font-bold text-foreground">
                  {chartMetric === "revenue" ? `₹${totalSales.toLocaleString('en-IN')}` : chartMetric === "orders" ? `${totalOrders.toLocaleString()} Orders` : `₹${aov.toLocaleString('en-IN')}`}
                </span>
                <span className="text-xs text-emerald-600 font-semibold ml-3">Live Synced from Database</span>
              </div>
              <div className="flex gap-1">
                {(["7D", "30D", "3M", "6M", "1Y"] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setChartPeriod(p)}
                    className={`px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-sm transition-colors ${
                      chartPeriod === p ? "text-accent bg-accent/15 border border-accent/30" : "text-foreground/50 hover:text-foreground"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom SVG Bar / Area Chart */}
            <div className="h-64 w-full flex items-end gap-2 sm:gap-3 pt-6 border-b border-border/40 pb-2">
              {chartData7D.map((item, idx) => {
                const val = item[chartMetric]
                const heightPercent = val > 0 ? Math.max(15, Math.round((val / maxVal) * 100)) : 5
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer">
                    
                    {/* Tooltip */}
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none bg-primary text-primary-foreground text-[10px] py-1 px-2.5 rounded-sm shadow-xl whitespace-nowrap z-20 font-sans border border-accent/40">
                      <p className="font-bold">{item.day} ({item.date}): {chartMetric === "revenue" ? `₹${item.revenue.toLocaleString('en-IN')}` : chartMetric === "orders" ? `${item.orders} Orders` : `₹${item.aov}`}</p>
                    </div>

                    {/* Bar */}
                    <div 
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-sm transition-all duration-300 relative ${
                        val > 0
                          ? "bg-gradient-to-t from-accent/30 via-accent/60 to-accent group-hover:from-accent group-hover:to-amber-300"
                          : "bg-secondary/40"
                      }`}
                    >
                      {val > 0 && (
                        <div className="w-full h-1 bg-accent absolute top-0 rounded-t-sm shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                      )}
                    </div>

                    <span className="text-[10px] text-foreground/40 mt-2 font-mono hidden sm:block">
                      {item.day}
                    </span>
                  </div>
                )
              })}
            </div>
            
            <div className="flex justify-between items-center text-[11px] text-foreground/50 pt-3">
              <span>{chartData7D[0]?.date}</span>
              <span className="font-semibold text-foreground/80">
                Peak: {peakDay?.day} ({peakDay?.date}) — ₹{peakDay?.revenue.toLocaleString('en-IN')}
              </span>
              <span>{chartData7D[chartData7D.length - 1]?.date}</span>
            </div>
          </div>
        </div>

        {/* ATTARWALA AI ADVISOR WIDGET (1 Column) */}
        <div className="bg-card p-6 md:p-8 rounded-lg border border-accent/40 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-accent/5 rounded-full blur-2xl pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-sm bg-accent text-slate-950 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm">ATTARWALA AI ADVISOR</h4>
                  <p className="text-[10px] text-accent uppercase tracking-wider font-semibold">Store Intelligence</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-500 font-semibold">Live Analyzed</span>
            </div>

            {/* AI Insights List */}
            <div className="mt-5 space-y-4 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
              {dynamicInsights.map((insight) => (
                <div 
                  key={insight.id}
                  className="p-4 rounded-sm bg-background border border-border/70 hover:border-accent transition-all space-y-2.5 text-left group"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${
                      insight.type === 'CRITICAL' ? 'bg-rose-500/15 text-rose-600 border border-rose-500/30' :
                      insight.type === 'HIGH' ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30' :
                      'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                    }`}>
                      {insight.type}
                    </span>
                    {insight.metric && (
                      <span className="text-[10px] font-semibold text-foreground/60">{insight.metric}</span>
                    )}
                  </div>

                  <h5 className="font-heading font-bold text-xs text-foreground group-hover:text-accent transition-colors leading-tight">
                    {insight.title}
                  </h5>

                  <p className="text-[11px] text-foreground/70 leading-relaxed font-sans">
                    {insight.description}
                  </p>

                  <div className="pt-2 border-t border-border/30 flex items-center justify-between">
                    <span className="text-[10px] text-accent font-semibold">{insight.impact}</span>
                    <Link
                      href={insight.actionTarget}
                      className="inline-flex items-center space-x-1 text-[11px] font-semibold text-primary hover:text-accent uppercase tracking-wider transition-colors"
                    >
                      <span>{insight.actionButtonLabel}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border/40 mt-4">
            <Link
              href="/admin/analytics"
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-sm bg-secondary/50 hover:bg-secondary border border-border text-xs font-semibold text-foreground transition-colors uppercase tracking-wider"
            >
              <span>Explore All Store Insights</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

      {/* RECENT ORDERS & TOP PRODUCTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Orders (2 Columns) */}
        <div className="lg:col-span-2 bg-card p-6 md:p-8 rounded-lg border border-border/60 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border/50">
            <div>
              <span className="text-[10px] font-semibold text-accent uppercase tracking-widest block">Live Fulfillment</span>
              <h3 className="font-heading text-xl font-bold">Recent Customer Orders</h3>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-accent hover:underline uppercase tracking-wider flex items-center gap-1"
            >
              <span>View All ({orders.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 text-foreground/70 uppercase text-[10px] tracking-wider border-b border-border/50">
                <tr>
                  <th className="px-4 py-3 font-semibold">Order ID</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Products</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3.5 font-bold font-mono text-foreground">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-foreground">{order.customer.name}</p>
                      <p className="text-[10px] text-foreground/50">{order.customer.city}</p>
                    </td>
                    <td className="px-4 py-3.5 text-foreground/80 max-w-[200px] truncate">
                      {order.items.map(i => `${i.name} (${i.size})`).join(", ")}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-foreground">
                      ₹{order.total.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-sm text-[10px] font-semibold uppercase tracking-wider ${
                        order.orderStatus === 'Delivered' ? 'bg-emerald-500/15 text-emerald-600' :
                        order.orderStatus === 'Shipped' || order.orderStatus === 'Out for Delivery' ? 'bg-blue-500/15 text-blue-600' :
                        order.orderStatus === 'Processing' || order.orderStatus === 'Packed' ? 'bg-amber-500/15 text-amber-600' :
                        'bg-primary/10 text-foreground'
                      }`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/admin/orders?order=${order.orderNumber}`}
                        className="p-1.5 rounded-sm hover:bg-secondary text-foreground/60 hover:text-accent transition-colors inline-block"
                        title="View Order Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TOP SELLING & LOW STOCK (1 Column) */}
        <div className="space-y-8">
          
          {/* Top Selling Products */}
          <div className="bg-card p-6 rounded-lg border border-border/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <h4 className="font-heading font-bold text-sm uppercase tracking-wider">Top Selling Fragrances</h4>
              <Link href="/admin/products" className="text-[10px] text-accent font-semibold hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {topSellingProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-sm hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center space-x-3">
                    <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-sm object-cover border border-border/50" />
                    <div>
                      <h5 className="font-semibold text-xs text-foreground leading-snug">{p.name}</h5>
                      <p className="text-[10px] text-foreground/50">{p.salesCount} bottles sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xs text-foreground">₹{p.revenue.toLocaleString('en-IN')}</p>
                    <span className="text-[10px] text-emerald-600 font-medium">{p.stock} in stock</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-card p-6 rounded-lg border border-amber-500/30 shadow-sm space-y-4 bg-gradient-to-br from-card to-amber-500/5">
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h4 className="font-heading font-bold text-sm text-foreground uppercase tracking-wider">Critical Low Stock</h4>
              </div>
              <Link href="/admin/inventory" className="text-[10px] text-accent font-semibold hover:underline">
                Manage Stock
              </Link>
            </div>

            <div className="space-y-3">
              {lowStockProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-sm bg-background border border-amber-500/20">
                  <div className="flex items-center space-x-2.5">
                    <img src={p.imageUrl} alt={p.name} className="w-9 h-9 rounded-sm object-cover border border-border/50" />
                    <div>
                      <p className="font-semibold text-xs text-foreground">{p.name}</p>
                      <p className="text-[10px] text-amber-600 font-medium">Only {p.stock} bottles remaining</p>
                    </div>
                  </div>
                  <Link
                    href={`/admin/inventory?restock=${p.id}`}
                    className="px-2.5 py-1 rounded-sm bg-amber-500 text-slate-950 text-[10px] font-bold uppercase tracking-wider hover:bg-amber-400 transition-colors"
                  >
                    Restock
                  </Link>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
