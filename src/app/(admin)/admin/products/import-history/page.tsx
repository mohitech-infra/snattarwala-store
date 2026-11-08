"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  History, 
  UploadCloud, 
  Package, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Download, 
  RefreshCw, 
  Calendar, 
  User, 
  Boxes, 
  Image as ImageIcon,
  ArrowRight,
  ChevronDown,
  ChevronRight
} from "lucide-react"

interface ImportHistoryRecord {
  id: string
  file_name: string
  total_products: number
  total_variants: number
  total_images: number
  successful_products: number
  successful_variants: number
  successful_images: number
  failed_products: number
  status: "Completed" | "Completed with Warnings" | "Failed"
  admin_user: string
  created_at: string
  error_report_csv?: string
  notes?: string
}

export default function ImportHistoryPage() {
  const [history, setHistory] = useState<ImportHistoryRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchHistory = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/catalog/history")
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load import history.")
      }
      setHistory(data.history || [])
    } catch (err: any) {
      console.error("Error loading import history:", err)
      setError(err.message || "Failed to load history.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const handleDownloadReport = (record: ImportHistoryRecord) => {
    if (!record.error_report_csv) return
    const blob = new Blob([record.error_report_csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `import_errors_${record.id}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12" suppressHydrationWarning>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-accent mb-1">
            <span>Catalogue Management</span>
            <span>/</span>
            <span className="text-foreground/70">Import History</span>
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <History className="w-8 h-8 text-accent shrink-0" />
            Catalogue Import Audit Log
          </h1>
          <p className="text-sm text-foreground/60 mt-1">
            Audit logs and performance reports for all batch product catalogue uploads.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={fetchHistory}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 rounded-sm bg-secondary/80 border border-border/60 hover:bg-secondary text-foreground text-xs font-medium transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-accent" : ""}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/admin/products/bulk-upload"
            className="flex items-center gap-2 px-4 py-2 rounded-sm bg-accent text-slate-950 font-bold text-xs hover:bg-accent/90 transition-colors shadow-xs"
          >
            <UploadCloud className="w-4 h-4" />
            <span>New Bulk Upload</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-card border border-border/60 rounded-sm shadow-xs">
          <span className="text-[11px] text-foreground/50 block">Total Upload Batches</span>
          <span className="font-heading font-bold text-2xl text-foreground mt-0.5 block">
            {history.length}
          </span>
        </div>

        <div className="p-4 bg-card border border-border/60 rounded-sm shadow-xs">
          <span className="text-[11px] text-foreground/50 block">Total Products Imported</span>
          <span className="font-heading font-bold text-2xl text-accent mt-0.5 block">
            {history.reduce((sum, h) => sum + (h.successful_products || 0), 0)}
          </span>
        </div>

        <div className="p-4 bg-card border border-border/60 rounded-sm shadow-xs">
          <span className="text-[11px] text-foreground/50 block">Variants Generated</span>
          <span className="font-heading font-bold text-2xl text-emerald-400 mt-0.5 block">
            {history.reduce((sum, h) => sum + (h.successful_variants || 0), 0)}
          </span>
        </div>

        <div className="p-4 bg-card border border-border/60 rounded-sm shadow-xs">
          <span className="text-[11px] text-foreground/50 block">Photos Attached</span>
          <span className="font-heading font-bold text-2xl text-foreground mt-0.5 block">
            {history.reduce((sum, h) => sum + (h.successful_images || 0), 0)}
          </span>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-sm bg-destructive/10 border border-destructive/40 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* History Table */}
      <div className="bg-card border border-border/60 rounded-sm overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold text-sm text-foreground">
              Past Catalogue Upload Sessions
            </h3>
            <p className="text-[11px] text-foreground/50">
              Detailed tracking of each import session with file names, dates, and execution stats
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-foreground/50 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-accent" />
            <span>Loading import audit logs...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">No Catalogue Imports Recorded Yet</p>
            <p className="text-xs text-foreground/50 max-w-sm mx-auto">
              You haven't run any bulk catalogue uploads yet. Upload your first fragrance workbook to view audit records here.
            </p>
            <Link
              href="/admin/products/bulk-upload"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-accent text-slate-950 font-bold text-xs hover:bg-accent/90 transition-colors shadow-xs"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Start First Bulk Upload</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {history.map((record) => {
              const isExpanded = expandedId === record.id
              const dateStr = new Date(record.created_at).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })

              return (
                <div key={record.id} className="p-4 transition-colors hover:bg-secondary/15">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Meta */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-sm bg-secondary/80 border border-border/70 flex items-center justify-center text-accent shrink-0">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-heading font-bold text-sm text-foreground">
                            {record.file_name}
                          </span>
                          <span className="font-mono text-[10px] text-foreground/50 px-1.5 py-0.5 rounded bg-secondary">
                            #{record.id.slice(0, 8)}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-foreground/50 mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-accent" />
                            {dateStr}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-accent" />
                            {record.admin_user}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Metrics */}
                    <div className="grid grid-cols-3 gap-3 text-center sm:text-left">
                      <div>
                        <span className="text-[10px] text-foreground/50 block">Fragrances</span>
                        <span className="font-heading font-bold text-xs text-foreground">
                          {record.successful_products} / {record.total_products}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-foreground/50 block">Variants</span>
                        <span className="font-heading font-bold text-xs text-foreground">
                          {record.successful_variants} / {record.total_variants}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-foreground/50 block">Photos</span>
                        <span className="font-heading font-bold text-xs text-accent">
                          {record.successful_images} / {record.total_images}
                        </span>
                      </div>
                    </div>

                    {/* Right: Status & Actions */}
                    <div className="flex items-center gap-2 justify-between md:justify-end">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          record.status === "Completed"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : record.status === "Completed with Warnings"
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            : "bg-destructive/15 text-destructive border border-destructive/30"
                        }`}
                      >
                        {record.status}
                      </span>

                      {record.error_report_csv && (
                        <button
                          onClick={() => handleDownloadReport(record)}
                          className="p-1.5 rounded bg-secondary hover:bg-secondary/80 text-foreground/70 hover:text-accent border border-border/50 text-xs transition-colors"
                          title="Download session error report"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => toggleExpand(record.id)}
                        className="p-1.5 rounded hover:bg-secondary text-foreground/50 hover:text-foreground transition-colors"
                      >
                        <ChevronDown className={`w-4 h-4 transform transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Audit Details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border/40 text-xs text-foreground/70 space-y-2 bg-secondary/10 p-3 rounded-sm">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <p><strong>Session ID:</strong> <span className="font-mono text-accent">{record.id}</span></p>
                        <p><strong>Source File:</strong> {record.file_name}</p>
                        <p><strong>Executed By:</strong> {record.admin_user}</p>
                        <p><strong>Timestamp:</strong> {new Date(record.created_at).toISOString()}</p>
                        <p><strong>Failed Records:</strong> <span className={record.failed_products > 0 ? "text-destructive font-bold" : "text-emerald-500 font-bold"}>{record.failed_products}</span></p>
                        <p><strong>Status Notes:</strong> {record.notes || "Standard bulk upload session"}</p>
                      </div>

                      {record.error_report_csv && (
                        <div className="pt-2">
                          <button
                            onClick={() => handleDownloadReport(record)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-card border border-border text-foreground hover:border-accent font-semibold text-xs transition-colors"
                          >
                            <Download className="w-3.5 h-3.5 text-accent" />
                            <span>Download Full Session Error Report (CSV)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
