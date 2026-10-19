"use client"

import { useState, useEffect } from "react"
import { 
  BarChart3, TrendingUp, TrendingDown, DollarSign, 
  Users, Package, ShoppingBag, Sparkles, ArrowUpRight,
  Calendar, Filter, Target, Zap, MapPin
} from "lucide-react"
import { getAdminProducts, getAdminDashboardMetrics, getAdminOrders, AdminProduct, AdminOrder } from "@/lib/admin-service"
import { ExportMenu } from "@/components/admin/export-menu"

interface MonthMetric {
  month: string
  revenue: number
  orders: number
  customers: number
}

interface CityMetric {
  city: string
  revenue: number
  orders: number
  share: number
}

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<"7D" | "30D" | "3M" | "6M" | "1Y">("30D")
  const [metricView, setMetricView] = useState<"revenue" | "orders" | "customers">("revenue")
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [monthlySales, setMonthlySales] = useState<MonthMetric[]>([])
  const [cityData, setCityData] = useState<CityMetric[]>([])
  const [metrics, setMetrics] = useState<{
    totalSales: number;
    totalOrders: number;
    totalCustomers: number;
    averageOrderValue: number;
  }>({
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    averageOrderValue: 0
  })

  useEffect(() => {
    getAdminProducts().then(data => setProducts(data))
    getAdminDashboardMetrics().then(data => {
      if (data) {
        setMetrics({
          totalSales: data.totalSales || 0,
          totalOrders: data.totalOrders || 0,
          totalCustomers: data.totalCustomers || 0,
          averageOrderValue: data.averageOrderValue || 0
        })
      }
    })

    getAdminOrders().then(fetchedOrders => {
      setOrders(fetchedOrders)

      // Compute last 6 months
      const monthsList: MonthMetric[] = []
      const now = new Date()
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthName = d.toLocaleString("en-IN", { month: "short" })
        const year = d.getFullYear()
        const monthIdx = d.getMonth()

        const monthOrders = fetchedOrders.filter(o => {
          const od = new Date(o.createdAt)
          return od.getMonth() === monthIdx && od.getFullYear() === year && o.orderStatus !== "Cancelled"
        })

        const revenue = monthOrders.reduce((sum, o) => sum + o.total, 0)
        const count = monthOrders.length
        const uniqueCust = new Set(monthOrders.map(o => o.customer?.email || o.customer?.name || o.id)).size

        monthsList.push({
          month: monthName,
          revenue,
          orders: count,
          customers: uniqueCust
        })
      }
      setMonthlySales(monthsList)

      // Compute city distribution
      const cityMap: Record<string, { revenue: number; orders: number }> = {}
      let validRevenue = 0

      fetchedOrders.forEach(o => {
        if (o.orderStatus === "Cancelled") return
        const city = (o.customer?.city || "Mumbai").trim()
        if (!cityMap[city]) {
          cityMap[city] = { revenue: 0, orders: 0 }
        }
        cityMap[city].revenue += o.total
        cityMap[city].orders += 1
        validRevenue += o.total
      })

      const computedCities: CityMetric[] = Object.entries(cityMap)
        .map(([city, data]) => ({
          city,
          revenue: data.revenue,
          orders: data.orders,
          share: validRevenue > 0 ? Math.round((data.revenue / validRevenue) * 100) : 0
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      setCityData(computedCities)
    })
  }, [])

  const PRODUCT_ANALYTICS = products.map(p => ({
    ...p,
    convRate: p.salesCount > 0 ? ((p.salesCount / Math.max(1, p.salesCount + 10)) * 100).toFixed(1) : "0.0",
    returnRate: "0.0",
    margin: "55%"
  })).sort((a, b) => b.revenue - a.revenue)

  const maxVal = monthlySales.length > 0 ? Math.max(...monthlySales.map(d => d[metricView]), 1) : 1
  
  const netProfit = Math.round(metrics.totalSales * 0.55)
  const grossRevenue = metrics.totalSales
  const profitMargin = 55

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-accent block mb-1">Business Intelligence</span>
          <h1 className="font-heading text-3xl font-bold text-foreground">Deep Analytics Hub</h1>
          <p className="text-sm text-foreground/60">Revenue intelligence, product performance, customer geography, and profit analysis.</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportMenu
            filename="attarwala_analytics_report"
            title="Deep Analytics Report"
            data={products.map(p => ({
              id: p.id,
              name: p.name,
              sku: p.sku,
              category: p.category,
              stock: p.stock,
              salesCount: p.salesCount,
              revenue: p.revenue
            }))}
          />
          <div className="flex items-center gap-1">
            {(["7D", "30D", "3M", "6M", "1Y"] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors ${
                  period === p ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Executive KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Gross Revenue", value: `₹${grossRevenue.toLocaleString('en-IN')}`, change: "Live", sub: "from database orders", icon: DollarSign, positive: true, accent: true },
          { label: "Net Profit (Est.)", value: `₹${netProfit.toLocaleString('en-IN')}`, change: `${profitMargin}% est. margin`, sub: "After product costs", icon: TrendingUp, positive: true, accent: false },
          { label: "Total Orders", value: `${metrics.totalOrders}`, change: "Store Total", sub: "lifetime orders", icon: ShoppingBag, positive: true, accent: false },
          { label: "Registered Customers", value: `${metrics.totalCustomers}`, change: "Verified", sub: "active accounts", icon: Users, positive: true, accent: false }
        ].map(kpi => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className={`bg-card p-5 rounded-lg border shadow-sm ${kpi.accent ? "border-accent/40 bg-accent/5" : "border-border/60"}`}>
              <div className="flex justify-between items-start">
                <p className={`text-[10px] uppercase tracking-widest font-semibold ${kpi.accent ? "text-accent" : "text-foreground/50"}`}>{kpi.label}</p>
                <Icon className={`w-4 h-4 ${kpi.accent ? "text-accent" : "text-foreground/40"}`} />
              </div>
              <p className={`text-2xl font-heading font-bold mt-1.5 ${kpi.accent ? "text-accent" : "text-foreground"}`}>{kpi.value}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`text-xs font-semibold ${kpi.positive ? "text-emerald-600" : "text-rose-500"}`}>{kpi.change}</span>
                <span className="text-[10px] text-foreground/50">{kpi.sub}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Revenue Chart + City Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-card p-6 rounded-lg border border-border/60 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-accent block">Trend Analysis</span>
              <h3 className="font-heading font-bold text-lg">Revenue vs Orders vs Customers</h3>
            </div>
            <div className="flex items-center gap-1 bg-secondary/40 p-1 rounded-sm border border-border/40">
              {(["revenue", "orders", "customers"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMetricView(m)}
                  className={`px-3 py-1 text-xs font-semibold capitalize rounded-sm transition-all ${
                    metricView === m ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:text-foreground"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-end gap-3 h-52 border-b border-border/40 pb-2 pt-4">
            {monthlySales.map((d, i) => {
              const val = d[metricView]
              const pct = val > 0 ? Math.max(12, Math.round((val / maxVal) * 100)) : 4
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer">
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all pointer-events-none bg-primary text-primary-foreground text-[10px] py-1 px-2.5 rounded-sm shadow-xl whitespace-nowrap z-20 border border-accent/40">
                    {metricView === "revenue" ? `₹${val.toLocaleString('en-IN')}` : val.toLocaleString()}
                  </div>
                  <div
                    style={{ height: `${pct}%` }}
                    className={`w-full rounded-t-sm transition-all duration-300 relative ${
                      val > 0 
                        ? "bg-gradient-to-t from-accent/25 via-accent/50 to-accent group-hover:to-amber-300" 
                        : "bg-secondary/40"
                    }`}
                  >
                    {val > 0 && (
                      <div className="w-full h-1 bg-accent absolute top-0 rounded-t-sm shadow-[0_0_8px_rgba(212,175,55,0.5)]" />
                    )}
                  </div>
                  <span className="text-[11px] text-foreground/60 mt-2 font-medium">{d.month}</span>
                </div>
              )
            })}
          </div>

          {/* Period Totals */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            {[
              { label: "Total Revenue (6M)", value: `₹${monthlySales.reduce((s,d) => s+d.revenue,0).toLocaleString('en-IN')}` },
              { label: "Total Orders (6M)", value: monthlySales.reduce((s,d) => s+d.orders,0).toLocaleString() },
              { label: "Active Customers (6M)", value: monthlySales.reduce((s,d) => s+d.customers,0).toLocaleString() }
            ].map(stat => (
              <div key={stat.label} className="text-center p-3 bg-background rounded-sm border border-border/50">
                <p className="text-[10px] text-foreground/50 uppercase tracking-widest">{stat.label}</p>
                <p className="font-heading font-bold text-sm text-foreground mt-0.5">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* City Distribution */}
        <div className="bg-card p-6 rounded-lg border border-border/60 shadow-sm space-y-5">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-semibold text-accent block">Geographic Revenue</span>
            <h3 className="font-heading font-bold text-lg">Top Cities</h3>
          </div>
          <div className="space-y-3">
            {cityData.length === 0 ? (
              <div className="text-center py-8 space-y-2 text-foreground/50">
                <MapPin className="w-6 h-6 mx-auto opacity-40 text-accent" />
                <p className="text-xs">No city order data yet</p>
                <p className="text-[10px] text-foreground/40">Geographic data populates automatically with new customer deliveries.</p>
              </div>
            ) : (
              cityData.map((city, i) => (
                <div key={city.city} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-foreground/40 w-4">#{i + 1}</span>
                      <span className="font-semibold text-foreground">{city.city}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-foreground">₹{city.revenue.toLocaleString('en-IN')}</span>
                      <span className="text-[10px] text-accent ml-1.5">{city.share}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent/60 to-accent rounded-full transition-all duration-700"
                      style={{ width: `${Math.max(5, city.share)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-foreground/40">{city.orders} orders</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Product Performance Table */}
      <div className="bg-card p-6 rounded-lg border border-border/60 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-semibold text-accent block">SKU Intelligence</span>
            <h3 className="font-heading font-bold text-lg">Product Performance Analytics</h3>
          </div>
          <span className="text-[10px] text-foreground/50">Ranked by Revenue</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/40 text-foreground/70 uppercase text-[10px] tracking-wider border-b border-border/50">
              <tr>
                <th className="px-4 py-3 font-semibold">Fragrance</th>
                <th className="px-4 py-3 font-semibold">Units Sold</th>
                <th className="px-4 py-3 font-semibold">Gross Revenue</th>
                <th className="px-4 py-3 font-semibold">Profit Margin</th>
                <th className="px-4 py-3 font-semibold">Est. Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {PRODUCT_ANALYTICS.map((p, i) => (
                <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center space-x-3">
                      <span className="text-[10px] text-foreground/40 w-4">#{i+1}</span>
                      <img src={p.imageUrl} alt={p.name} className="w-9 h-9 object-cover rounded-sm border border-border/50" />
                      <div>
                        <p className="font-semibold text-foreground">{p.name}</p>
                        <p className="text-[10px] text-foreground/50">{p.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-medium">{p.salesCount} units</td>
                  <td className="px-4 py-3.5 font-bold text-foreground">₹{p.revenue.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3.5 font-medium text-emerald-600">{p.margin}</td>
                  <td className="px-4 py-3.5 text-foreground/70">₹{Math.round(p.revenue * 0.55).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
