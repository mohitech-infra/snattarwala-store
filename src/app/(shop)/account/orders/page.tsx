"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { RefreshCw, Package, Truck, FileText, X, AlertTriangle, ChevronDown, CheckCircle2 } from "lucide-react"

const CANCEL_REASONS = [
  "I want to change my order",
  "I ordered by mistake",
  "Delivery time is too long",
  "Found a better price elsewhere",
  "I want to change the delivery address",
  "Payment issues",
  "Other reason",
]

// Statuses where cancellation is still allowed
const CANCELLABLE_STATUSES = ["new", "confirmed", "processing", "packed"]

export default function OrdersPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [orders, setOrders] = useState<any[]>([])

  // Cancellation modal state
  const [cancelTarget, setCancelTarget] = useState<{ id: string; orderNumber: string; rawId: string } | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [cancelOther, setCancelOther] = useState("")
  const [cancelling, setCancelling] = useState(false)
  const [cancelSuccess, setCancelSuccess] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  const fetchOrders = useCallback(async (currentUser: any) => {
    try {
      if (currentUser?.email) {
        await supabase
          .from("orders")
          .update({ user_id: currentUser.id })
          .eq("customer_email", currentUser.email)
          .is("user_id", null)
      }

      const { data: userOrders, error } = await supabase
        .from("orders")
        .select(`
          id, order_number, status, total_amount, subtotal, shipping_amount, discount_amount,
          payment_method, payment_status, created_at, items, cancel_reason,
          order_items(product_name, quantity, unit_price, product_sku)
        `)
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false })

      if (!error && userOrders) {
        const formattedOrders = userOrders.map((o: any) => {
          const rawStatus = (o.status || "").toLowerCase()
          let statusLabel = "Confirmed"
          let badgeColor = "text-amber-600 bg-amber-500/10 border-amber-500/30"

          if (rawStatus === "delivered") {
            statusLabel = "Delivered"
            badgeColor = "text-emerald-600 bg-emerald-500/10 border-emerald-500/30"
          } else if (rawStatus === "shipped") {
            statusLabel = "Shipped"
            badgeColor = "text-blue-600 bg-blue-500/10 border-blue-500/30"
          } else if (rawStatus === "out for delivery" || rawStatus === "out_for_delivery") {
            statusLabel = "Out for Delivery"
            badgeColor = "text-indigo-600 bg-indigo-500/10 border-indigo-500/30"
          } else if (rawStatus === "processing") {
            statusLabel = "Processing"
            badgeColor = "text-purple-600 bg-purple-500/10 border-purple-500/30"
          } else if (rawStatus === "cancelled") {
            statusLabel = "Cancelled"
            badgeColor = "text-rose-600 bg-rose-500/10 border-rose-500/30"
          } else if (rawStatus === "refunded") {
            statusLabel = "Refunded"
            badgeColor = "text-zinc-600 bg-zinc-500/10 border-zinc-500/30"
          } else {
            statusLabel = o.status || "Confirmed"
            badgeColor = "text-amber-600 bg-amber-500/10 border-amber-500/30"
          }

          let displayItems: any[] = []
          if (Array.isArray(o.order_items) && o.order_items.length > 0) {
            displayItems = o.order_items.map((it: any) => {
              const jsonMatch = Array.isArray(o.items)
                ? o.items.find((ji: any) => ji.name === it.product_name)
                : null
              return {
                name: it.product_name,
                size: jsonMatch?.size || "",
                quantity: it.quantity,
                price: it.unit_price,
                imageUrl: jsonMatch?.imageUrl || "/products/white-oudh-attar.jpg"
              }
            })
          } else if (Array.isArray(o.items) && o.items.length > 0) {
            displayItems = o.items.map((it: any) => ({
              name: it.name || "Fragrance",
              size: it.size || "",
              quantity: it.quantity || 1,
              price: it.price || 0,
              imageUrl: it.imageUrl || "/products/white-oudh-attar.jpg"
            }))
          }

          return {
            rawId: o.id,
            id: o.order_number || o.id,
            rawStatus,
            date: new Date(o.created_at).toLocaleDateString("en-IN", {
              year: "numeric", month: "long", day: "2-digit",
            }),
            status: statusLabel,
            badgeColor,
            total: Number(o.total_amount) || 0,
            items: displayItems,
            paymentMethod: o.payment_method || "Razorpay",
            paymentStatus: o.payment_status || "Paid",
            cancelReason: o.cancel_reason || "",
            canCancel: CANCELLABLE_STATUSES.includes((o.status || "").toLowerCase()),
          }
        })
        setOrders(formattedOrders)
      }
    } catch (err) {
      console.error("Error loading orders:", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [supabase])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
      } else {
        setUser(user)
        await fetchOrders(user)
      }
    }
    init()
  }, [router, supabase, fetchOrders])

  const handleRefresh = async () => {
    if (!user) return
    setRefreshing(true)
    await fetchOrders(user)
  }

  const openCancelModal = (order: any) => {
    setCancelTarget({ id: order.id, orderNumber: order.id, rawId: order.rawId })
    setCancelReason("")
    setCancelOther("")
    setCancelSuccess(false)
  }

  const handleCancelSubmit = async () => {
    if (!cancelTarget) return
    const finalReason = cancelReason === "Other reason" ? cancelOther.trim() : cancelReason
    if (!finalReason) return

    setCancelling(true)
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: cancelTarget.rawId,
          status: "Cancelled",
          cancelReason: finalReason,
        }),
      })
      const result = await res.json()
      if (result?.success) {
        setCancelSuccess(true)
        // Update local state
        setOrders(prev => prev.map(o =>
          o.rawId === cancelTarget.rawId
            ? { ...o, status: "Cancelled", rawStatus: "cancelled", badgeColor: "text-rose-600 bg-rose-500/10 border-rose-500/30", canCancel: false, cancelReason: finalReason }
            : o
        ))
        setTimeout(() => {
          setCancelTarget(null)
          setCancelSuccess(false)
        }, 2000)
      } else {
        alert("Failed to cancel order. Please contact support.")
      }
    } catch {
      alert("Network error. Please try again.")
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 py-2">
        <div className="h-6 bg-secondary rounded w-1/4" />
        <div className="h-36 bg-secondary/50 rounded-lg" />
        <div className="h-36 bg-secondary/30 rounded-lg" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-heading font-semibold">Order History</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-foreground/70 hover:text-accent border border-border/70 px-3 py-1.5 rounded-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-secondary/30 p-10 rounded-lg border border-border/50 text-center">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
            <Package className="w-6 h-6 text-foreground/40" />
          </div>
          <p className="text-foreground/70 mb-4 font-medium">You haven't placed any orders yet.</p>
          <Link
            href="/shop"
            className="inline-block px-6 py-2.5 bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-wider hover:bg-primary/90 transition-colors rounded-sm"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="border border-border/50 rounded-lg overflow-hidden bg-card/50">
              {/* Order Header */}
              <div className="bg-secondary/30 p-4 border-b border-border/50 flex flex-wrap justify-between items-center gap-4 text-sm">
                <div className="flex gap-8">
                  <div>
                    <p className="text-foreground/60 text-xs mb-0.5">Order Placed</p>
                    <p className="font-medium text-sm">{order.date}</p>
                  </div>
                  <div>
                    <p className="text-foreground/60 text-xs mb-0.5">Total</p>
                    <p className="font-medium text-sm">₹{order.total.toLocaleString("en-IN")}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-foreground/60 text-xs mb-0.5 font-mono">Order #{order.id}</p>
                  <span className={`text-xs font-medium ${
                    order.paymentMethod === "Cash on Delivery" ? "text-amber-500" : "text-emerald-600"
                  }`}>
                    {order.paymentMethod === "Cash on Delivery" ? "Cash on Delivery" : `Paid via ${order.paymentMethod}`}
                  </span>
                </div>
              </div>

              <div className="p-6">
                {/* Status Row + Action Buttons */}
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6 pb-4 border-b border-border/40">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-foreground/70 uppercase tracking-wider">Status:</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${order.badgeColor}`}>
                      {order.status}
                    </span>
                    {order.status === "Cancelled" && order.cancelReason && (
                      <span className="text-[11px] text-foreground/50 italic">— {order.cancelReason}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Download Invoice */}
                    <Link
                      href={`/account/orders/invoice?orderNumber=${encodeURIComponent(order.id)}&action=download`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-border text-xs font-medium hover:bg-secondary hover:border-foreground/30 transition-colors rounded-sm text-foreground"
                    >
                      <FileText className="w-3.5 h-3.5 text-accent" />
                      <span>Invoice</span>
                    </Link>

                    {/* Track Order */}
                    {order.status !== "Cancelled" && (
                      <Link
                        href={`/account/orders/track?orderNumber=${encodeURIComponent(order.id)}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-wider hover:bg-primary/90 transition-colors rounded-sm shadow-sm"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Track Order</span>
                      </Link>
                    )}

                    {/* Cancel Order — only for early stages */}
                    {order.canCancel && (
                      <button
                        onClick={() => openCancelModal(order)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-rose-300/50 text-rose-600 text-xs font-medium hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors rounded-sm"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cancel Order</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-4 divide-y divide-border/30">
                  {order.items.map((item: any, index: number) => (
                    <div key={index} className={`flex gap-4 items-center ${index > 0 ? "pt-4" : ""}`}>
                      <div className="w-16 h-16 bg-secondary shrink-0 rounded-sm overflow-hidden border border-border/40">
                        <img
                          src={item.imageUrl || "/products/white-oudh-attar.jpg"}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e: any) => { e.currentTarget.src = "/products/white-oudh-attar.jpg" }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-foreground truncate">{item.name}</h4>
                        <p className="text-xs text-foreground/60 mt-0.5">
                          {item.size ? `${item.size} • ` : ""}Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="font-semibold text-sm text-foreground">
                        ₹{(item.price * (item.quantity || 1)).toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ───── Cancel Order Modal ───── */}
      {cancelTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget && !cancelling) setCancelTarget(null) }}
        >
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">

            {cancelSuccess ? (
              /* ── Success State ── */
              <div className="p-10 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="font-heading text-lg font-bold mb-2">Order Cancelled</h3>
                <p className="text-sm text-foreground/60">Your order #{cancelTarget.orderNumber} has been cancelled successfully.</p>
              </div>
            ) : (
              /* ── Form State ── */
              <>
                <div className="flex items-center justify-between p-5 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-rose-500/10 flex items-center justify-center">
                      <AlertTriangle className="w-4.5 h-4.5 text-rose-500" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-base">Cancel Order</h3>
                      <p className="text-[11px] text-foreground/50">#{cancelTarget.orderNumber}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCancelTarget(null)}
                    disabled={cancelling}
                    className="p-1.5 hover:bg-secondary rounded-full transition-colors text-foreground/60"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  <p className="text-sm text-foreground/70">
                    Please let us know why you want to cancel. This helps us improve.
                  </p>

                  {/* Reason selector */}
                  <div className="space-y-2.5">
                    {CANCEL_REASONS.map((reason) => (
                      <label
                        key={reason}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all text-sm ${
                          cancelReason === reason
                            ? "border-accent bg-accent/5 text-foreground"
                            : "border-border/50 hover:border-border text-foreground/70 hover:text-foreground"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          cancelReason === reason ? "border-accent" : "border-border"
                        }`}>
                          {cancelReason === reason && (
                            <div className="w-2 h-2 rounded-full bg-accent" />
                          )}
                        </div>
                        <span
                          className="flex-1"
                          onClick={() => setCancelReason(reason)}
                        >
                          {reason}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Other reason text box */}
                  {cancelReason === "Other reason" && (
                    <textarea
                      rows={3}
                      placeholder="Please describe your reason..."
                      value={cancelOther}
                      onChange={e => setCancelOther(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:outline-none focus:border-accent resize-none text-foreground placeholder:text-foreground/40"
                      autoFocus
                    />
                  )}

                  {/* Policy note */}
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-700 dark:text-amber-400">
                    <strong>Note:</strong> Orders can only be cancelled before they are shipped. If you paid online, refunds are processed within 5–7 business days.
                  </div>
                </div>

                <div className="flex gap-3 p-5 pt-0">
                  <button
                    onClick={() => setCancelTarget(null)}
                    disabled={cancelling}
                    className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    Keep Order
                  </button>
                  <button
                    onClick={handleCancelSubmit}
                    disabled={!cancelReason || (cancelReason === "Other reason" && !cancelOther.trim()) || cancelling}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {cancelling ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      "Confirm Cancellation"
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
