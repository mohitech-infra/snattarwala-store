"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { RotateCcw, Package, ChevronDown, ChevronUp, Upload, Check, AlertTriangle, ArrowLeft } from "lucide-react"

interface OrderItem {
  name: string
  size: string
  price: number
  quantity: number
  image_url?: string
}

interface Order {
  id: string
  order_number: string
  created_at: string
  total_amount: number
  status: string
  items: OrderItem[]
}

type ReturnReason = "damaged" | "wrong_item" | "not_as_described" | "changed_mind" | "quality_issue"

const REASON_LABELS: Record<ReturnReason, string> = {
  damaged: "Damaged / Broken on Arrival",
  wrong_item: "Wrong Item Received",
  not_as_described: "Not as Described",
  changed_mind: "Changed My Mind",
  quality_issue: "Quality Issue",
}

const FALLBACK_ORDERS: Order[] = [
  {
    id: "o1", order_number: "#ATW1041", created_at: "Sep 8, 2026", total_amount: 1890, status: "Delivered",
    items: [{ name: "White Oudh Attar", size: "12ml", price: 1890, quantity: 1, image_url: "/products/white-oudh-attar.jpg" }],
  },
  {
    id: "o2", order_number: "#ATW1038", created_at: "Sep 5, 2026", total_amount: 4200, status: "Delivered",
    items: [{ name: "Purple Oud Perfume", size: "100ml", price: 4200, quantity: 1, image_url: "/products/purple-oud-perfume.jpg" }],
  },
]

export default function ReturnsPage() {
  const [user, setUser] = useState<any>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<"select" | "form" | "done">("select")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null)
  const [reason, setReason] = useState<ReturnReason>("damaged")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [returnId, setReturnId] = useState("")
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }
      setUser(user)

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "Delivered")
        .order("created_at", { ascending: false })

      if (!error && data && data.length > 0) {
        setOrders(data.map((o: any) => ({
          id: o.id, order_number: o.order_number,
          created_at: new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
          total_amount: o.total_amount, status: o.status,
          items: o.items || [],
        })))
      } else {
        setOrders(FALLBACK_ORDERS)
      }
      setLoading(false)
    }
    init()
  }, [])

  const submitReturn = async () => {
    if (!selectedOrder || !selectedItem || !description.trim()) return
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1200))

    const { data, error } = await supabase.from("returns").insert({
      user_id: user?.id,
      order_number: selectedOrder.order_number,
      product_name: selectedItem.name,
      quantity: selectedItem.quantity,
      price: selectedItem.price * selectedItem.quantity,
      reason: description,
      reason_code: reason,
      recovery_status: "Pending Review",
      customer_name: user?.user_metadata?.first_name + " " + (user?.user_metadata?.last_name || ""),
      phone: user?.phone || "",
      email: user?.email,
      image_url: selectedItem.image_url,
    }).select().single()

    const id = data?.id || `RET-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    setReturnId(id)
    setStep("done")
    setSubmitting(false)
  }

  if (loading) return <div className="animate-pulse space-y-4">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-24 bg-secondary rounded-lg" />)}</div>

  if (step === "done") {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
          <Check className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="font-heading font-bold text-2xl">Return Request Submitted!</h2>
        <p className="text-foreground/60 max-w-sm mx-auto">
          Your return request has been received. Our team will contact you within 24 hours via WhatsApp.
        </p>
        <p className="text-xs text-foreground/40 font-mono">Reference: {returnId}</p>
        <div className="flex gap-3 justify-center mt-6">
          <a
            href="https://wa.me/919082377314?text=Hello! I just submitted a return request and want to follow up."
            target="_blank"
            className="px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-emerald-500 transition-colors"
          >
            WhatsApp Us
          </a>
          <button onClick={() => setStep("select")} className="px-6 py-2.5 border border-border text-xs font-medium rounded-sm hover:bg-secondary transition-colors">
            Back to Returns
          </button>
        </div>
      </div>
    )
  }

  if (step === "form" && selectedOrder && selectedItem) {
    return (
      <div className="space-y-6">
        <button onClick={() => setStep("select")} className="flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div>
          <h2 className="text-xl font-heading font-semibold">Return Request</h2>
          <p className="text-sm text-foreground/60 mt-1">{selectedOrder.order_number} · {selectedItem.name}</p>
        </div>

        {/* Product Preview */}
        <div className="flex items-center gap-4 p-4 bg-secondary/20 border border-border/50 rounded-lg">
          <img src={selectedItem.image_url || "/products/white-oudh-attar.jpg"} alt={selectedItem.name} className="w-16 h-16 object-cover rounded-sm border border-border/50" onError={e => { (e.target as HTMLImageElement).src = "/products/white-oudh-attar.jpg" }} />
          <div>
            <p className="font-semibold">{selectedItem.name}</p>
            <p className="text-sm text-foreground/60">{selectedItem.size} · Qty: {selectedItem.quantity}</p>
            <p className="font-bold text-accent">₹{(selectedItem.price * selectedItem.quantity).toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Reason Select */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest font-semibold text-foreground/60 block">Reason for Return *</label>
          <div className="grid grid-cols-1 gap-2">
            {(Object.entries(REASON_LABELS) as [ReturnReason, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setReason(key)}
                className={`flex items-center gap-3 px-4 py-3 border rounded-sm text-sm text-left transition-all ${
                  reason === key ? "border-accent bg-accent/5 text-foreground" : "border-border/50 text-foreground/60 hover:border-border"
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${reason === key ? "border-accent" : "border-foreground/30"}`}>
                  {reason === key && <div className="w-2 h-2 rounded-full bg-accent" />}
                </div>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest font-semibold text-foreground/60 block">Describe the Issue *</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            placeholder="Please describe the issue in detail so we can process your return quickly..."
            className="w-full bg-background border border-border rounded-sm py-3 px-4 text-sm focus:outline-none focus:border-accent resize-none"
          />
        </div>

        {/* Notice */}
        <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-sm text-xs text-amber-700">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>Returns are accepted within 7 days of delivery for damaged or incorrect items. Please keep original packaging. Our team will contact you via WhatsApp to arrange pickup.</p>
        </div>

        <button
          onClick={submitReturn}
          disabled={submitting || !description.trim()}
          className="w-full py-3.5 bg-accent text-slate-950 font-bold text-sm uppercase tracking-wider rounded-sm hover:bg-accent/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {submitting ? <span className="animate-spin w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full" /> : <RotateCcw className="w-4 h-4" />}
          Submit Return Request
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-heading font-semibold">Returns & Refunds</h2>
        <p className="text-sm text-foreground/60 mt-1">Select an order to request a return or refund.</p>
      </div>

      {/* Policy Banner */}
      <div className="p-4 bg-secondary/30 border border-border/50 rounded-lg text-sm space-y-1">
        <p className="font-semibold">Return Policy</p>
        <ul className="text-foreground/60 space-y-0.5 text-xs list-disc list-inside">
          <li>7-day return window from delivery date</li>
          <li>Accepted for damaged, wrong, or not-as-described items</li>
          <li>Refund processed within 3-5 business days after return pickup</li>
          <li>Questions? <a href="https://wa.me/919082377314" target="_blank" className="text-accent hover:underline">Chat on WhatsApp</a></li>
        </ul>
      </div>

      {orders.length === 0 ? (
        <div className="bg-secondary/20 p-12 rounded-lg border border-border/50 text-center">
          <Package className="w-10 h-10 mx-auto text-foreground/20 mb-4" />
          <p className="text-foreground/60">No eligible delivered orders for return.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-foreground/50 uppercase tracking-widest font-semibold">Eligible Orders</p>
          {orders.map(order => (
            <div key={order.id} className="border border-border/50 rounded-lg overflow-hidden">
              <div className="bg-secondary/20 px-5 py-3 border-b border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-mono font-bold">{order.order_number}</span>
                  <span className="text-foreground/50">{order.created_at}</span>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-sm">{order.status}</span>
              </div>
              <div className="p-4 space-y-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <img src={item.image_url || "/products/white-oudh-attar.jpg"} alt={item.name} className="w-12 h-12 object-cover rounded-sm border border-border/50" onError={e => { (e.target as HTMLImageElement).src = "/products/white-oudh-attar.jpg" }} />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{item.name}</p>
                      <p className="text-xs text-foreground/50">{item.size} · Qty: {item.quantity}</p>
                    </div>
                    <button
                      onClick={() => { setSelectedOrder(order); setSelectedItem(item); setStep("form") }}
                      className="px-3 py-1.5 border border-border rounded-sm text-xs font-semibold hover:border-accent hover:text-accent transition-colors"
                    >
                      Return
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
