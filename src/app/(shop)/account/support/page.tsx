"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { MessageSquare, Send, Check, Clock, Package, ChevronRight } from "lucide-react"

interface Ticket {
  id: string
  ticket_number: string
  subject: string
  category: string
  status: string
  created_at: string
  last_message: string
}

const CATEGORIES = [
  "Order Issue",
  "Product Quality",
  "Delivery Problem",
  "Refund / Return",
  "Fragrance Recommendation",
  "Billing / Payment",
  "General Inquiry",
]

export default function SupportPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [step, setStep] = useState<"list" | "new" | "done">("list")
  const [subject, setSubject] = useState("")
  const [category, setCategory] = useState(CATEGORIES[0])
  const [orderNumber, setOrderNumber] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [newTicket, setNewTicket] = useState<Ticket | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }
      setUser(user)

      const { data } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20)

      if (data && data.length > 0) {
        setTickets(data.map((t: any) => ({
          id: t.id,
          ticket_number: t.ticket_number || `#TKT-${t.id.slice(0, 4).toUpperCase()}`,
          subject: t.subject,
          category: t.category,
          status: t.status,
          created_at: new Date(t.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
          last_message: t.last_message || t.message || "",
        })))
      }
      setLoading(false)
    }
    init()
  }, [])

  const submitTicket = async () => {
    if (!subject.trim() || !message.trim()) return
    setSubmitting(true)

    const ticketNum = `#TKT-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    const { data, error } = await supabase.from("support_tickets").insert({
      user_id: user?.id,
      ticket_number: ticketNum,
      subject,
      category,
      order_number: orderNumber || null,
      message,
      status: "Open",
      customer_name: user?.user_metadata?.first_name + " " + (user?.user_metadata?.last_name || ""),
      phone: user?.phone || "",
      email: user?.email,
      messages: [{ sender: "customer", text: message, time: new Date().toISOString() }],
      priority: category === "Order Issue" || category === "Delivery Problem" ? "High" : "Medium",
    }).select().single()

    const ticket: Ticket = {
      id: data?.id || "new",
      ticket_number: ticketNum,
      subject,
      category,
      status: "Open",
      created_at: "Just now",
      last_message: message,
    }
    setNewTicket(ticket)
    setTickets(prev => [ticket, ...prev])
    setStep("done")
    setSubmitting(false)
  }

  const statusConfig: Record<string, string> = {
    "Open": "bg-rose-500/15 text-rose-600",
    "In Progress": "bg-amber-500/15 text-amber-600",
    "Waiting on Customer": "bg-blue-500/15 text-blue-600",
    "Resolved": "bg-emerald-500/15 text-emerald-600",
    "Closed": "bg-secondary text-foreground/50",
  }

  if (loading) return <div className="animate-pulse space-y-4">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-16 bg-secondary rounded-lg" />)}</div>

  if (step === "done" && newTicket) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
          <Check className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="font-heading font-bold text-2xl">Ticket Submitted!</h2>
        <p className="text-foreground/60 max-w-sm mx-auto">
          Your support ticket <strong>{newTicket.ticket_number}</strong> has been created. We will respond within 2-4 hours via WhatsApp.
        </p>
        <div className="flex gap-3 justify-center mt-6">
          <a
            href={`https://wa.me/919082377314?text=Hello! I just submitted a support ticket ${newTicket.ticket_number} regarding: ${newTicket.subject}`}
            target="_blank"
            className="px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-emerald-500 transition-colors"
          >
            Chat on WhatsApp
          </a>
          <button onClick={() => setStep("list")} className="px-6 py-2.5 border border-border text-xs font-medium rounded-sm hover:bg-secondary transition-colors">
            View My Tickets
          </button>
        </div>
      </div>
    )
  }

  if (step === "new") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setStep("list")} className="text-sm text-foreground/60 hover:text-foreground transition-colors">← Back</button>
          <h2 className="text-xl font-heading font-semibold">New Support Ticket</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs uppercase tracking-widest font-semibold text-foreground/60 block">Subject *</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. My order has not arrived yet"
              className="w-full bg-background border border-border rounded-sm py-3 px-4 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest font-semibold text-foreground/60 block">Category *</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-background border border-border rounded-sm py-3 px-4 text-sm focus:outline-none focus:border-accent"
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest font-semibold text-foreground/60 block">Order Number (optional)</label>
            <input
              value={orderNumber}
              onChange={e => setOrderNumber(e.target.value)}
              placeholder="e.g. #ATW1041"
              className="w-full bg-background border border-border rounded-sm py-3 px-4 text-sm focus:outline-none focus:border-accent font-mono"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs uppercase tracking-widest font-semibold text-foreground/60 block">Message *</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={5}
              placeholder="Describe your issue in detail. The more information you provide, the faster we can help you."
              className="w-full bg-background border border-border rounded-sm py-3 px-4 text-sm focus:outline-none focus:border-accent resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={submitTicket}
            disabled={submitting || !subject.trim() || !message.trim()}
            className="px-6 py-3 bg-accent text-slate-950 font-bold text-sm uppercase tracking-wider rounded-sm hover:bg-accent/90 transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {submitting ? <span className="animate-spin w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full" /> : <Send className="w-4 h-4" />}
            Submit Ticket
          </button>
          <a
            href="https://wa.me/919082377314?text=Hello! I need help with my order."
            target="_blank"
            className="px-6 py-3 bg-emerald-600 text-white font-bold text-sm uppercase tracking-wider rounded-sm hover:bg-emerald-500 transition-colors flex items-center gap-2"
          >
            Instant WhatsApp Help
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-heading font-semibold">Support Center</h2>
          <p className="text-sm text-foreground/60 mt-0.5">Track your support requests or open a new ticket.</p>
        </div>
        <button
          onClick={() => setStep("new")}
          className="px-4 py-2 bg-accent text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-accent/90 transition-colors flex items-center gap-2"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          New Ticket
        </button>
      </div>

      {/* Quick WhatsApp Support */}
      <a
        href="https://wa.me/919082377314?text=Hello! I need help with my order."
        target="_blank"
        className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg hover:border-emerald-500/40 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center text-white">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-sm">Instant WhatsApp Support</p>
            <p className="text-xs text-foreground/60">Typically replies within 10 minutes · +91 90823 77314</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-foreground/40 group-hover:text-emerald-600 transition-colors" />
      </a>

      {/* Tickets */}
      {tickets.length === 0 ? (
        <div className="bg-secondary/20 p-10 rounded-lg border border-border/50 text-center">
          <MessageSquare className="w-10 h-10 mx-auto text-foreground/20 mb-4" />
          <p className="text-foreground/60 text-sm">You have no open support tickets.</p>
          <button onClick={() => setStep("new")} className="mt-4 text-accent text-sm hover:underline">Open your first ticket →</button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-foreground/50 uppercase tracking-widest font-semibold">Your Tickets</p>
          {tickets.map(t => (
            <div key={t.id} className="flex items-center gap-4 p-4 border border-border/50 rounded-lg hover:border-accent/30 transition-all">
              <div className="w-9 h-9 rounded-sm bg-secondary flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4 text-foreground/50" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground truncate">{t.subject}</span>
                  <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold shrink-0 ${statusConfig[t.status] || "bg-secondary text-foreground/60"}`}>{t.status}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-foreground/50 mt-0.5">
                  <span>{t.ticket_number}</span>
                  <span>{t.category}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{t.created_at}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
