"use client"

import { useState, useEffect } from "react"
import { 
  CreditCard, Search, Download, RefreshCw, TrendingUp,
  CheckCircle2, XCircle, Clock, AlertCircle
} from "lucide-react"
import { getAdminPayments, AdminPayment } from "@/lib/admin-service"
import { ExportMenu } from "@/components/admin/export-menu"

const statusConfig: Record<string, { icon: React.ElementType; bg: string; text: string; label: string }> = {
  "Paid":      { icon: CheckCircle2, bg: "bg-emerald-500/15", text: "text-emerald-600", label: "Paid" },
  "Pending":   { icon: Clock,        bg: "bg-amber-500/15",   text: "text-amber-600",   label: "Pending" },
  "Failed":    { icon: XCircle,      bg: "bg-rose-500/15",    text: "text-rose-600",    label: "Failed" },
  "Refunded":  { icon: AlertCircle,  bg: "bg-blue-500/15",    text: "text-blue-600",    label: "Refunded" },
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")

  const loadPayments = async () => {
    setLoading(true)
    const data = await getAdminPayments()
    setPayments(data)
    setLoading(false)
  }

  useEffect(() => { loadPayments() }, [])

  const filtered = payments.filter(p => {
    const matchSearch =
      (p.orderNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.transactionId || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.customerName || "").toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "All" || p.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalRevenue = payments.filter(p => p.status === "Paid").reduce((s, p) => s + p.amount, 0)
  const successCount = payments.filter(p => p.status === "Paid").length
  const failedCount = payments.filter(p => p.status === "Failed").length
  const successRate = payments.length > 0 ? Math.round((successCount / payments.length) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-accent block mb-1">Razorpay Gateway</span>
          <h1 className="font-heading text-3xl font-bold text-foreground">Payments & Transactions</h1>
          <p className="text-sm text-foreground/60 mt-1">Live transaction log from Razorpay payment gateway.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadPayments}
            className="p-2.5 rounded-sm border border-border hover:border-accent text-foreground/60 hover:text-accent transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <ExportMenu
            filename="attarwala_payment_transactions"
            title="Payment Transactions"
            buttonLabel="Export CSV"
            data={payments.map(p => ({
              "Transaction ID": p.id,
              "Order ID": p.orderId,
              "Customer Name": p.customerName,
              "Amount (INR)": p.amount,
              "Payment Method": p.method,
              "Payment Status": p.status,
              "Gateway / Ref": p.gateway,
              "Date": p.date
            }))}
            headers={["Transaction ID", "Order ID", "Customer", "Amount (₹)", "Method", "Status", "Date"]}
            printRows={payments.map(p => [
              p.id,
              p.orderId,
              p.customerName,
              `₹${p.amount.toLocaleString("en-IN")}`,
              p.method,
              p.status,
              p.date
            ])}
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border/60 rounded-lg p-5 shadow-sm">
          <span className="text-[10px] font-semibold text-foreground/50 uppercase tracking-widest block">Total Revenue</span>
          <p className="text-2xl font-heading font-bold text-foreground mt-2">₹{totalRevenue.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">From {successCount} payments</p>
        </div>
        <div className="bg-card border border-border/60 rounded-lg p-5 shadow-sm">
          <span className="text-[10px] font-semibold text-foreground/50 uppercase tracking-widest block">Success Rate</span>
          <p className="text-2xl font-heading font-bold text-foreground mt-2">{successRate}%</p>
          <p className="text-[11px] text-foreground/50 font-medium mt-1">Gateway conversion</p>
        </div>
        <div className="bg-card border border-emerald-500/30 rounded-lg p-5 shadow-sm">
          <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest block">Successful</span>
          <p className="text-2xl font-heading font-bold text-emerald-600 mt-2">{successCount}</p>
          <p className="text-[11px] text-foreground/50 font-medium mt-1">Captured & paid</p>
        </div>
        <div className="bg-card border border-rose-500/30 rounded-lg p-5 shadow-sm">
          <span className="text-[10px] font-semibold text-rose-600 uppercase tracking-widest block">Failed</span>
          <p className="text-2xl font-heading font-bold text-rose-600 mt-2">{failedCount}</p>
          <p className="text-[11px] text-foreground/50 font-medium mt-1">Dropped payments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input
            type="text"
            placeholder="Search by order ID, payment ID, or customer…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-sm pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-accent"
          />
        </div>
        <div className="flex gap-1 bg-secondary/50 p-1 rounded-sm border border-border/40">
          {["All", "Paid", "Pending", "Failed", "Refunded"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-sm transition-all capitalize ${
                statusFilter === s ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/70 hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border/60 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-secondary/40 text-foreground/70 uppercase text-[10px] tracking-wider border-b border-border/50">
              <tr>
                <th className="px-4 py-3 font-semibold">Payment ID</th>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Method</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-3 bg-secondary rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-foreground/50 text-sm">
                    {payments.length === 0 ? "No payments recorded yet. Transactions will appear here after your first sale." : "No payments match your filters."}
                  </td>
                </tr>
              ) : (
                filtered.map(payment => {
                  const sc = statusConfig[payment.status] || { icon: AlertCircle, bg: "bg-secondary", text: "text-foreground/60", label: payment.status }
                  const Icon = sc.icon as any
                  return (
                    <tr key={payment.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-[11px] text-foreground/80">{payment.transactionId}</td>
                      <td className="px-4 py-3.5 font-bold font-mono text-foreground">{payment.orderId}</td>
                      <td className="px-4 py-3.5 text-foreground/80">{payment.customerName || "—"}</td>
                      <td className="px-4 py-3.5 font-bold text-foreground">₹{payment.amount.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3.5 capitalize text-foreground/70">{payment.method || "—"}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-semibold uppercase tracking-wider ${sc.bg} ${sc.text}`}>
                          <Icon className="w-3 h-3" />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-foreground/60">
                        {payment.date ? new Date(payment.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-border/40 flex justify-between items-center text-[11px] text-foreground/50">
            <span>Showing {filtered.length} of {payments.length} transactions</span>
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-600 font-semibold">₹{totalRevenue.toLocaleString('en-IN')}</span> captured
            </span>
          </div>
        )}
      </div>
    </div>
  )
}