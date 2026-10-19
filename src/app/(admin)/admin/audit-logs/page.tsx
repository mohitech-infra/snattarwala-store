"use client"

import { useState } from "react"
import { Clock, Shield, User, Package, ShoppingCart, RefreshCw, Search, Filter, AlertTriangle, Check, Eye, Download } from "lucide-react"

import { useEffect } from "react"
import { getAdminAuditLogs, AdminAuditLog } from "@/lib/admin-service"
import { ExportMenu } from "@/components/admin/export-menu"

const severityConfig = {
  info:     { bg: "bg-blue-500/10 text-blue-600 border border-blue-500/20",     dot: "bg-blue-500",    label: "Info" },
  success:  { bg: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20", dot: "bg-emerald-500", label: "Success" },
  warning:  { bg: "bg-amber-500/10 text-amber-600 border border-amber-500/20",  dot: "bg-amber-500",   label: "Warning" },
  critical: { bg: "bg-rose-500/10 text-rose-600 border border-rose-500/20",     dot: "bg-rose-500",    label: "Critical" },
}

const actionIcons: Record<string, any> = {
  ORDER_STATUS_UPDATED: Package,
  PRODUCT_STOCK_UPDATED: RefreshCw,
  COUPON_CREATED: Check,
  PRODUCT_DELETED: AlertTriangle,
  ADMIN_LOGIN: Shield,
  ORDER_REFUND_ISSUED: AlertTriangle,
  REVIEW_APPROVED: Check,
  FAILED_LOGIN_ATTEMPT: AlertTriangle,
  SETTINGS_UPDATED: Shield,
  BULK_WHATSAPP_SENT: Package,
  PRODUCT_CREATED: Check,
  INVENTORY_ALERT_TRIGGERED: AlertTriangle,
}

function getTimeAgo(isoStr: string) {
  const diffMs = Date.now() - new Date(isoStr).getTime()
  const m = Math.floor(diffMs / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

type SeverityFilter = "all" | "info" | "warning" | "critical" | "success"

export default function AuditLogsPage() {
  const [search, setSearch] = useState("")
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [logs, setLogs] = useState<AdminAuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminAuditLogs().then(data => {
      setLogs(data)
      setLoading(false)
    })
  }, [])

  const filtered = logs.filter(log => {
    const matchSeverity = severityFilter === "all" || log.severity === severityFilter
    const matchSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.entity.toLowerCase().includes(search.toLowerCase()) ||
      log.entityId.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase())
    return matchSeverity && matchSearch
  })

  const counts = {
    all: logs.length,
    info: logs.filter(l => l.severity === "info").length,
    success: logs.filter(l => l.severity === "success").length,
    warning: logs.filter(l => l.severity === "warning").length,
    critical: logs.filter(l => l.severity === "critical").length,
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-accent block mb-1">Admin Panel</span>
          <h1 className="font-heading text-3xl font-bold text-foreground">Audit Trail</h1>
          <p className="text-sm text-foreground/60 mt-1">Track all admin actions, system events, and access logs.</p>
        </div>
        <ExportMenu
          filename="attarwala_audit_logs"
          title="Security & System Audit Logs"
          buttonLabel="Export Logs"
          data={logs.map(l => ({
            "Event Action": l.action,
            "Target Entity": l.entity,
            "Target ID": l.entityId,
            "Admin User": l.admin,
            "Severity": l.severity,
            "IP Address": l.ip,
            "Details": l.details,
            "Timestamp": l.timestamp
          }))}
          headers={["Action", "Entity", "Admin", "Severity", "IP", "Timestamp"]}
          printRows={logs.map(l => [
            l.action,
            l.entity,
            l.admin,
            l.severity.toUpperCase(),
            l.ip,
            l.timestamp
          ])}
        />
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Events", value: logs.length, color: "text-foreground" },
          { label: "Warnings", value: counts.warning, color: "text-amber-600" },
          { label: "Critical Alerts", value: counts.critical, color: "text-rose-600" },
          { label: "Successful Actions", value: counts.success, color: "text-emerald-600" },
        ].map(kpi => (
          <div key={kpi.label} className="bg-card p-5 rounded-lg border border-border/60 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest text-foreground/50 font-semibold">{kpi.label}</p>
            <p className={`text-2xl font-heading font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-1 bg-secondary/40 p-1 rounded-sm border border-border/40 overflow-x-auto">
          {(["all", "info", "success", "warning", "critical"] as SeverityFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`shrink-0 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all ${
                severityFilter === s ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:text-foreground"
              }`}
            >
              {s === "all" ? `All (${counts.all})` : `${s} (${counts[s]})`}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search actions, entities..."
            className="w-full bg-card border border-border rounded-sm py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-accent text-foreground"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-card border border-border/50 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/40 text-foreground/70 uppercase text-[10px] tracking-wider border-b border-border/50">
              <tr>
                <th className="px-4 py-3.5 font-semibold">Severity</th>
                <th className="px-4 py-3.5 font-semibold">Action</th>
                <th className="px-4 py-3.5 font-semibold">Entity / ID</th>
                <th className="px-4 py-3.5 font-semibold">Admin</th>
                <th className="px-4 py-3.5 font-semibold">IP</th>
                <th className="px-4 py-3.5 font-semibold">Time</th>
                <th className="px-4 py-3.5 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.map(log => {
                const cfg = severityConfig[log.severity]
                const Icon = actionIcons[log.action] || Shield
                const isExpanded = expandedId === log.id
                return (
                  <>
                    <tr
                      key={log.id}
                      className={`hover:bg-secondary/20 transition-colors cursor-pointer ${log.severity === "critical" ? "bg-rose-500/5" : ""}`}
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    >
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit ${cfg.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 text-foreground/50 shrink-0" />
                          <span className="font-mono text-foreground/80 text-[10px]">{log.action}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-foreground">{log.entity}</p>
                        <p className="text-[10px] text-foreground/50 font-mono">{log.entityId}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-foreground">{log.admin}</p>
                        <p className="text-[10px] text-foreground/50">{log.adminRole}</p>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-foreground/60">{log.ip}</td>
                      <td className="px-4 py-3.5 text-foreground/60 whitespace-nowrap">
                        <p>{getTimeAgo(log.timestamp)}</p>
                        <p className="text-[10px] text-foreground/40">{new Date(log.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Eye className={`w-4 h-4 ml-auto transition-colors ${isExpanded ? "text-accent" : "text-foreground/40 hover:text-accent"}`} />
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${log.id}-detail`} className="bg-secondary/10">
                        <td colSpan={7} className="px-6 py-3">
                          <div className="flex items-start gap-3 text-xs text-foreground/70">
                            <span className="font-semibold text-foreground/50 shrink-0">Details:</span>
                            <span>{log.details}</span>
                            <span className="ml-auto text-foreground/40 shrink-0">{new Date(log.timestamp).toLocaleString("en-IN")}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-foreground/50 text-sm">No logs match your filter.</div>
        )}
      </div>
    </div>
  )
}