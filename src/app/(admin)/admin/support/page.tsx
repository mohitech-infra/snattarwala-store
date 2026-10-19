"use client"

import { useState, useEffect } from "react"
import {
  MessageSquare, Search, Check, X, Eye, Clock,
  AlertTriangle, Send, RefreshCw, Phone, Mail,
  ChevronDown, MessageSquareShare, Filter
} from "lucide-react"
import { ExportMenu } from "@/components/admin/export-menu"
import { createClient } from "@/lib/supabase/client"

interface SupportTicket {
  id: string
  ticketNumber: string
  subject: string
  customerName: string
  phone: string
  email: string
  orderNumber?: string
  category: "Order Issue" | "Product Quality" | "Delivery" | "Refund" | "General" | "WhatsApp Query"
  priority: "High" | "Medium" | "Low"
  status: "Open" | "In Progress" | "Waiting on Customer" | "Resolved" | "Closed"
  messages: { sender: "customer" | "admin"; text: string; time: string }[]
  createdAt: string
  timeAgo: string
}

function getTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  return `${Math.floor(diffHrs / 24)}d ago`
}

const statusConfig: Record<SupportTicket["status"], { bg: string; text: string }> = {
  "Open":                 { bg: "bg-rose-500/15", text: "text-rose-600" },
  "In Progress":          { bg: "bg-amber-500/15", text: "text-amber-600" },
  "Waiting on Customer":  { bg: "bg-blue-500/15", text: "text-blue-600" },
  "Resolved":             { bg: "bg-emerald-500/15", text: "text-emerald-600" },
  "Closed":               { bg: "bg-secondary", text: "text-foreground/50" },
}

const priorityConfig: Record<SupportTicket["priority"], string> = {
  High:   "text-rose-600 bg-rose-500/10 border border-rose-500/20",
  Medium: "text-amber-600 bg-amber-500/10 border border-amber-500/20",
  Low:    "text-foreground/60 bg-secondary border border-border",
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selected, setSelected] = useState<SupportTicket | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [replyText, setReplyText] = useState("")
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadTickets = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false })

      if (!error && Array.isArray(data)) {
        const formatted: SupportTicket[] = data.map((row: any) => {
          const createdAtDate = row.created_at ? new Date(row.created_at) : new Date()
          return {
            id: row.id,
            ticketNumber: row.ticket_number || `#TKT-${row.id.slice(0, 4).toUpperCase()}`,
            subject: row.subject || "Customer Inquiry",
            customerName: row.customer_name || "Customer",
            phone: row.phone || "—",
            email: row.email || "—",
            orderNumber: row.order_number || undefined,
            category: row.category || "General",
            priority: (row.priority || "Medium") as SupportTicket["priority"],
            status: (row.status || "Open") as SupportTicket["status"],
            messages: Array.isArray(row.messages) && row.messages.length > 0
              ? row.messages
              : row.message
              ? [{ sender: "customer", text: row.message, time: createdAtDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) }]
              : [],
            createdAt: createdAtDate.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
            timeAgo: getTimeAgo(createdAtDate)
          }
        })
        setTickets(formatted)
        if (formatted.length > 0) {
          setSelected(formatted[0])
        } else {
          setSelected(null)
        }
      }
    } catch (err) {
      console.error("Failed to load support tickets:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
  }, [])

  const filtered = tickets.filter(t => {
    const matchSearch = t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.customerName.toLowerCase().includes(search.toLowerCase()) ||
      t.ticketNumber.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "All" || t.status === statusFilter
    return matchSearch && matchStatus
  })

  const sendReply = async () => {
    if (!replyText.trim() || !selected) return
    const now = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    const updatedMessages = [...selected.messages, { sender: "admin" as const, text: replyText, time: now }]
    const updated = {
      ...selected,
      messages: updatedMessages,
      status: "In Progress" as const
    }

    setTickets(prev => prev.map(t => t.id === selected.id ? updated : t))
    setSelected(updated)
    const replyToSend = replyText
    setReplyText("")

    try {
      await supabase
        .from("support_tickets")
        .update({
          messages: updatedMessages,
          status: "In Progress",
          last_message: replyToSend,
          updated_at: new Date().toISOString()
        })
        .eq("id", selected.id)
    } catch (err) {
      console.error("Failed to update ticket in DB:", err)
    }
  }

  const updateStatus = async (id: string, status: SupportTicket["status"]) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : prev)

    try {
      await supabase
        .from("support_tickets")
        .update({
          status,
          updated_at: new Date().toISOString(),
          ...(status === "Resolved" || status === "Closed" ? { resolved_at: new Date().toISOString() } : {})
        })
        .eq("id", id)
    } catch (err) {
      console.error("Failed to update status in DB:", err)
    }
  }

  const openCount = tickets.filter(t => t.status === "Open").length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-accent block mb-1">Customer Care</span>
          <h1 className="font-heading text-3xl font-bold text-foreground">Support Center</h1>
          <p className="text-sm text-foreground/60">Manage customer support tickets and queries connected directly to your database.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadTickets}
            disabled={loading}
            className="p-2 border border-border rounded-sm hover:border-accent hover:text-accent transition-colors flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider"
            title="Refresh Tickets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-accent" : ""}`} />
            <span>Refresh</span>
          </button>
          {openCount > 0 && (
            <div className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-bold uppercase tracking-wider rounded-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {openCount} Open Tickets
            </div>
          )}
          <ExportMenu
            filename="attarwala_support_tickets"
            title="Support Tickets"
            data={filtered.map(t => ({
              id: t.id,
              ticketNumber: t.ticketNumber,
              subject: t.subject,
              customerName: t.customerName,
              phone: t.phone,
              email: t.email,
              orderNumber: t.orderNumber || "",
              category: t.category,
              priority: t.priority,
              status: t.status,
              createdAt: t.createdAt
            }))}
          />
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Tickets", value: tickets.length, color: "text-foreground" },
          { label: "Open", value: openCount, color: "text-rose-600" },
          { label: "In Progress", value: tickets.filter(t => t.status === "In Progress").length, color: "text-amber-600" },
          { label: "Resolved", value: tickets.filter(t => t.status === "Resolved" || t.status === "Closed").length, color: "text-emerald-600" },
        ].map(kpi => (
          <div key={kpi.label} className="bg-card p-5 rounded-lg border border-border/60 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest text-foreground/50 font-semibold">{kpi.label}</p>
            <p className={`text-2xl font-heading font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Main Layout */}
      {loading ? (
        <div className="p-16 text-center bg-card border border-border/50 rounded-lg flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-accent animate-spin" />
          <p className="text-sm font-semibold text-foreground/70">Loading support tickets from database...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="p-16 text-center bg-card border border-border/50 rounded-lg space-y-3">
          <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto text-accent">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-lg text-foreground">No Support Tickets Yet</h3>
          <p className="text-xs text-foreground/60 max-w-md mx-auto">
            When customers submit inquiries or issues from their orders or the store contact form, they will appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[600px]">

          {/* Tickets List */}
          <div className="lg:col-span-2 bg-card border border-border/50 rounded-lg shadow-sm flex flex-col overflow-hidden">
            {/* Ticket List Header */}
            <div className="p-4 border-b border-border/50 space-y-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets..." className="w-full bg-background border border-border rounded-sm py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-accent" />
              </div>
              <div className="flex gap-1 overflow-x-auto">
                {["All", "Open", "In Progress", "Resolved", "Closed"].map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`shrink-0 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-sm transition-all ${statusFilter === s ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:text-foreground hover:bg-secondary/50"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-border/40">
              {filtered.map(ticket => {
                const sCfg = statusConfig[ticket.status] || statusConfig["Open"]
                const isSelected = selected?.id === ticket.id
                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelected(ticket)}
                    className={`p-4 cursor-pointer transition-colors ${isSelected ? "bg-accent/5 border-l-2 border-accent" : "hover:bg-secondary/20"}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <p className="font-semibold text-foreground text-xs leading-snug">{ticket.subject}</p>
                        <p className="text-[10px] text-foreground/50 mt-0.5">{ticket.customerName} · {ticket.ticketNumber}</p>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold shrink-0 ${sCfg.bg} ${sCfg.text}`}>{ticket.status}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-foreground/40">
                      <span className={`px-1.5 py-0.5 rounded-sm font-semibold ${priorityConfig[ticket.priority] || priorityConfig["Medium"]}`}>{ticket.priority}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{ticket.timeAgo}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Ticket Detail */}
          {selected ? (
            <div className="lg:col-span-3 bg-card border border-accent/30 rounded-lg shadow-sm flex flex-col overflow-hidden">
              {/* Ticket Header */}
              <div className="p-4 border-b border-border/50 bg-background/50 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-heading font-bold text-sm text-foreground">{selected.subject}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-foreground/50">
                      <span>{selected.ticketNumber}</span>
                      {selected.orderNumber && <span>Order: <strong className="text-accent">{selected.orderNumber}</strong></span>}
                      <span>{selected.createdAt}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold ${statusConfig[selected.status]?.bg || ''} ${statusConfig[selected.status]?.text || ''}`}>{selected.status}</span>
                    <select
                      value={selected.status}
                      onChange={e => updateStatus(selected.id, e.target.value as SupportTicket["status"])}
                      className="bg-background border border-border rounded-sm py-1 px-2 text-[10px] focus:outline-none focus:border-accent"
                    >
                      {["Open", "In Progress", "Waiting on Customer", "Resolved", "Closed"].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                {/* Customer Info */}
                <div className="flex items-center gap-4 text-[10px] text-foreground/60">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-accent" />{selected.phone}</span>
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-accent" />{selected.email}</span>
                  <span className={`px-1.5 py-0.5 rounded-sm font-semibold ${priorityConfig[selected.priority] || priorityConfig["Medium"]}`}>{selected.priority} Priority</span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selected.messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] p-3 rounded-lg text-xs leading-relaxed ${
                      msg.sender === "admin"
                        ? "bg-accent text-slate-950 rounded-br-sm"
                        : "bg-secondary text-foreground rounded-bl-sm"
                    }`}>
                      <p>{msg.text}</p>
                      <p className={`text-[9px] mt-1.5 ${msg.sender === "admin" ? "text-slate-950/50" : "text-foreground/40"}`}>
                        {msg.sender === "admin" ? "ATTARWALA Support" : selected.customerName} · {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              {selected.status !== "Closed" && (
                <div className="p-4 border-t border-border/50 bg-background/50 space-y-2">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Type your reply here..."
                    rows={3}
                    className="w-full bg-background border border-border rounded-sm py-2.5 px-3 text-xs focus:outline-none focus:border-accent resize-none"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        const msg = encodeURIComponent(replyText || `Hello ${selected.customerName}, this is SN ATTARWALA regarding ticket ${selected.ticketNumber}.`)
                        const phone = selected.phone.replace(/\D/g, "")
                        window.open(`https://wa.me/${phone}?text=${msg}`, "_blank")
                      }}
                      className="px-3 py-2 bg-emerald-600/10 border border-emerald-600/20 text-emerald-700 text-xs font-semibold rounded-sm hover:bg-emerald-600/20 transition-colors flex items-center gap-1.5"
                    >
                      <MessageSquareShare className="w-3.5 h-3.5" /> WhatsApp
                    </button>
                    <button
                      onClick={sendReply}
                      disabled={!replyText.trim()}
                      className="px-5 py-2 bg-accent text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-accent/90 transition-colors flex items-center gap-1.5 disabled:opacity-60"
                    >
                      <Send className="w-3.5 h-3.5" /> Send Reply
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="lg:col-span-3 bg-card border border-border/50 rounded-lg shadow-sm flex items-center justify-center text-foreground/40">
              <div className="text-center space-y-2">
                <MessageSquare className="w-10 h-10 mx-auto opacity-30" />
                <p className="text-sm font-semibold">Select a ticket to view conversation</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}