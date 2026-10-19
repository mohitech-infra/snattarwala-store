"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { 
  Truck, 
  Package, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  ArrowLeft, 
  FileText, 
  MessageCircle, 
  Copy, 
  Check, 
  Search,
  AlertCircle
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

function TrackOrderContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const paramOrderNumber = searchParams.get("orderNumber") || searchParams.get("orderId") || ""

  const [searchQuery, setSearchQuery] = useState(paramOrderNumber)
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  const loadOrder = async (orderIdToFetch: string) => {
    if (!orderIdToFetch.trim()) {
      setError("Please enter an order number to track.")
      setLoading(false)
      return
    }

    setLoading(true)
    setError("")

    try {
      const cleanNum = orderIdToFetch.trim()
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanNum)

      let query = supabase
        .from("orders")
        .select(`
          *,
          order_items(*)
        `)

      if (isUuid) {
        query = query.or(`id.eq.${cleanNum},order_number.eq.${cleanNum}`)
      } else {
        const normalized = cleanNum.replace(/^#/, "")
        query = query.or(`order_number.eq.${normalized},order_number.eq.#${normalized}`)
      }

      const { data, error: dbError } = await query.maybeSingle()

      if (dbError) throw dbError

      if (!data) {
        setError(`We couldn't locate an order with number "${orderIdToFetch}". Please check the number and try again.`)
        setOrder(null)
      } else {
        setOrder(data)
        setSearchQuery(data.order_number)
      }
    } catch (err: any) {
      console.error("Error fetching order tracking:", err)
      setError(err.message || "Failed to load order tracking details.")
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (paramOrderNumber) {
      loadOrder(paramOrderNumber)
    } else {
      setLoading(false)
    }
  }, [paramOrderNumber])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/account/orders/track?orderNumber=${encodeURIComponent(searchQuery.trim())}`)
      loadOrder(searchQuery.trim())
    }
  }

  const copyAwb = (awbText: string) => {
    navigator.clipboard.writeText(awbText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Calculate timeline progress
  const getProgressStep = (statusStr: string) => {
    const s = (statusStr || "").toLowerCase()
    if (s === "delivered") return 4
    if (s === "out for delivery" || s === "out_for_delivery") return 3
    if (s === "shipped") return 2
    if (s === "packed" || s === "processing" || s === "confirmed") return 1
    return 1 // Default: always show at least "Packing" in progress
  }

  const currentStep = order ? getProgressStep(order.status) : 0

  const steps = [
    {
      title: "Order Confirmed",
      description: order?.payment_method === "Cash on Delivery" ? "Order confirmed, payment on delivery" : "Payment verified and order confirmed",
      time: order ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Completed",
      icon: CheckCircle2,
    },
    {
      title: "Quality Check & Packed",
      description: "Fragrance inspected and packed in luxury velvet box",
      time: currentStep >= 1 ? "In Progress" : "Pending",
      icon: Package,
    },
    {
      title: "Dispatched",
      description: "Handed over to courier express partner",
      time: currentStep >= 2 ? "Dispatched" : "Scheduled",
      icon: Truck,
    },
    {
      title: "Out for Delivery",
      description: "Courier agent en route to your doorstep",
      time: currentStep >= 3 ? "Today" : "Upcoming",
      icon: Clock,
    },
    {
      title: "Delivered",
      description: "Package received safely by customer",
      time: currentStep >= 4 ? "Delivered" : "Estimated in 2-3 days",
      icon: MapPin,
    },
  ]

  const items = (Array.isArray(order?.order_items) && order.order_items.length > 0)
    ? order.order_items
    : (Array.isArray(order?.items) && order.items.length > 0)
    ? order.items
    : []

  // Only show tracking info if admin has manually set it
  const trackingAwb = order?.tracking_number || null
  const courierPartner = order?.courier_partner || null
  const isShipped = currentStep >= 2

  // Estimated delivery — only shown once dispatched
  const orderDate = order?.created_at ? new Date(order.created_at) : new Date()
  const estDeliveryDate = new Date(orderDate)
  estDeliveryDate.setDate(estDeliveryDate.getDate() + 3)
  const estDeliveryFormatted = estDeliveryDate.toLocaleDateString("en-IN", {
    weekday: "long",
    month: "short",
    day: "numeric",
  })

  return (
    <div className="py-8 bg-background min-h-screen text-foreground">
      <div className="max-w-4xl mx-auto px-4">
        {/* Navigation & Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-2 text-xs font-medium text-foreground/70 hover:text-accent transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Order History</span>
          </Link>

          {order && (
            <div className="flex items-center gap-3">
              <Link
                href={`/account/orders/invoice?orderNumber=${encodeURIComponent(order.order_number || order.id)}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-border text-xs font-medium hover:bg-secondary transition-colors rounded-sm"
              >
                <FileText className="w-3.5 h-3.5 text-accent" />
                <span>Download Invoice</span>
              </Link>
              <a
                href={`https://wa.me/919082377314?text=${encodeURIComponent(`Hello SN AttarWala, I'd like an update on my order #${order.order_number}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600/10 border border-emerald-600/30 text-emerald-600 text-xs font-medium hover:bg-emerald-600/20 transition-colors rounded-sm"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Support</span>
              </a>
            </div>
          )}
        </div>

        {/* Search / Lookup Bar */}
        <div className="bg-card border border-border/70 rounded-lg p-4 mb-8 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-foreground/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Order # (e.g. ITR-349701)"
                className="w-full bg-background border border-border pl-10 pr-4 py-2.5 rounded-sm text-xs font-mono uppercase tracking-wider focus:outline-none focus:border-accent"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchQuery.trim()}
              className="px-6 py-2.5 bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-wider hover:bg-primary/90 transition-colors rounded-sm disabled:opacity-50"
            >
              Track Order
            </button>
          </form>
        </div>

        {loading && (
          <div className="bg-card border border-border/60 rounded-lg p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-xs tracking-widest uppercase text-foreground/60 font-medium">
              Locating Shipment Status...
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-card border border-border/60 rounded-lg p-10 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-semibold text-lg mb-2">Order Not Found</h3>
            <p className="text-xs text-foreground/70 mb-6 leading-relaxed">{error}</p>
            <button
              onClick={() => router.push("/account/orders")}
              className="px-5 py-2 border border-border text-xs font-medium hover:bg-secondary transition-colors rounded-sm"
            >
              View My Orders
            </button>
          </div>
        )}

        {order && !loading && (
          <div className="space-y-8">
            {/* Order Overview Banner */}
            <div className="bg-card border border-border/80 rounded-lg p-6 md:p-8 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-border/50">
                <div>
                  <span className="text-[10px] uppercase font-semibold tracking-widest text-accent mb-1 block">
                    Order Status
                  </span>
                  <h1 className="font-heading text-2xl font-bold text-foreground">
                    Order #{order.order_number}
                  </h1>
                  <p className="text-xs text-foreground/60 mt-1">
                    Placed on{" "}
                    {new Date(order.created_at).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                {/* Only show estimated delivery once shipped */}
                {isShipped ? (
                  <div className="flex flex-col sm:items-end">
                    <span className="text-[10px] uppercase tracking-widest text-foreground/50 mb-1">
                      Estimated Delivery
                    </span>
                    <span className="font-heading text-lg font-bold text-accent">
                      {estDeliveryFormatted}
                    </span>
                    <span className="text-xs text-emerald-600 font-medium mt-0.5">
                      On Schedule • {order.customer_city || order.shipping_city || "Mumbai"} Metro
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col sm:items-end">
                    <span className="text-[10px] uppercase tracking-widest text-foreground/50 mb-1">
                      Current Status
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-600 border border-amber-500/30 rounded-full text-xs font-semibold">
                      <Package className="w-3.5 h-3.5" />
                      Being Packed
                    </span>
                    <span className="text-xs text-foreground/50 font-medium mt-1.5">
                      Tracking updates once dispatched
                    </span>
                  </div>
                )}
              </div>

              {/* Courier & AWB Bar — only shown when admin has set tracking info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 text-xs">
                {courierPartner && (
                  <div className="bg-secondary/30 p-3.5 rounded-sm border border-border/40">
                    <p className="text-[10px] text-foreground/50 uppercase tracking-widest mb-1">Courier Partner</p>
                    <p className="font-semibold text-foreground flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-accent" />
                      <span>{courierPartner}</span>
                    </p>
                  </div>
                )}

                {trackingAwb && (
                  <div className="bg-secondary/30 p-3.5 rounded-sm border border-border/40">
                    <p className="text-[10px] text-foreground/50 uppercase tracking-widest mb-1">Tracking Number (AWB)</p>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-foreground">{trackingAwb}</span>
                      <button
                        onClick={() => copyAwb(trackingAwb)}
                        className="text-foreground/50 hover:text-accent p-1 transition-colors"
                        title="Copy Tracking Number"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {!courierPartner && !trackingAwb && (
                  <div className="bg-secondary/10 p-3.5 rounded-sm border border-border/40 sm:col-span-2 flex items-center gap-3">
                    <Package className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground text-xs">Your order is being carefully packed</p>
                      <p className="text-[11px] text-foreground/60 mt-0.5">Tracking number will appear here once your order is dispatched by our team.</p>
                    </div>
                  </div>
                )}

                <div className={`bg-secondary/30 p-3.5 rounded-sm border border-border/40 ${!courierPartner && !trackingAwb ? "sm:col-span-2" : ""}`}>
                  <p className="text-[10px] text-foreground/50 uppercase tracking-widest mb-1">Payment</p>
                  <p className={`font-semibold flex items-center gap-1 ${
                    order.payment_method === "Cash on Delivery" ? "text-amber-500" : "text-emerald-600"
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {order.payment_method === "Cash on Delivery"
                        ? "Cash on Delivery (Pending)"
                        : `${order.payment_method || "Razorpay"} (Paid)`}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Visual Stepper */}
            <div className="bg-card border border-border/80 rounded-lg p-6 md:p-8 shadow-sm">
              <h3 className="font-heading font-semibold text-base mb-8 text-foreground pb-4 border-b border-border/50">
                Shipment Journey
              </h3>

              <div className="relative">
                {/* Stepper Vertical on Mobile, Horizontal on Desktop */}
                <div className="space-y-8 md:space-y-0 md:grid md:grid-cols-5 gap-4 relative">
                  {steps.map((step, idx) => {
                    const isCompleted = idx <= currentStep
                    const isCurrent = idx === currentStep
                    const IconComponent = step.icon

                    return (
                      <div key={idx} className="flex md:flex-col items-start md:items-center text-left md:text-center relative">
                        {/* Connecting Line (Desktop) */}
                        {idx < steps.length - 1 && (
                          <div 
                            className={`hidden md:block absolute top-5 left-1/2 w-full h-0.5 -z-0 transition-colors ${
                              idx < currentStep ? "bg-accent" : "bg-border/60"
                            }`} 
                          />
                        )}

                        {/* Step Icon / Circle */}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 transition-all duration-300 ${
                            isCompleted
                              ? "bg-accent text-primary shadow-md border border-accent"
                              : "bg-secondary text-foreground/40 border border-border"
                          } ${isCurrent ? "ring-4 ring-accent/20 animate-pulse" : ""}`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>

                        {/* Step Details */}
                        <div className="ml-4 md:ml-0 md:mt-3">
                          <h4 className={`text-xs font-semibold ${isCompleted ? "text-foreground font-bold" : "text-foreground/50"}`}>
                            {step.title}
                          </h4>
                          <p className="text-[11px] text-foreground/60 mt-0.5 leading-snug">
                            {step.description}
                          </p>
                          <span className={`inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            isCompleted ? "bg-accent/10 text-accent font-semibold" : "text-foreground/40"
                          }`}>
                            {step.time}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Milestone Scan Activity Log */}
              <div className="mt-10 pt-6 border-t border-border/50">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground/70 mb-4">
                  Activity Timeline
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex gap-4 items-start">
                    <span className="font-mono text-foreground/50 text-[11px] whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    </span>
                    <div className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Order Placed & Payment Authorized</p>
                      <p className="text-foreground/60 text-[11px]">
                        {order.payment_method === "Cash on Delivery"
                          ? `Order placed. Payment of ₹${Number(order.total_amount).toLocaleString("en-IN")} to be collected on delivery.`
                          : `Payment of ₹${Number(order.total_amount).toLocaleString("en-IN")} received via ${order.payment_method || "Razorpay"}. Order confirmed for processing.`
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <span className="font-mono text-foreground/50 text-[11px] whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    </span>
                    <div className="w-2 h-2 rounded-full bg-border mt-1.5 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Allocated to Perfumer Boutique Fulfillment</p>
                      <p className="text-foreground/60 text-[11px]">
                        Order assigned to SN AttarWala Central Boutique, South Mumbai for quality packaging.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Address & Package Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Shipping Address */}
              <div className="bg-card border border-border/80 rounded-lg p-6 shadow-sm">
                <h3 className="font-heading font-semibold text-sm mb-4 text-foreground flex items-center gap-2 pb-3 border-b border-border/50">
                  <MapPin className="w-4 h-4 text-accent" />
                  <span>Delivery Destination</span>
                </h3>
                <div className="space-y-2 text-xs text-foreground/80 leading-relaxed">
                  <p className="font-bold text-sm text-foreground">
                    {order.customer_name || order.shipping_name || "Valued Customer"}
                  </p>
                  <p>
                    {order.customer_address || [
                      order.shipping_address_line1,
                      order.shipping_address_line2,
                      order.shipping_area,
                      order.shipping_city,
                      order.shipping_state,
                      order.shipping_pincode
                    ].filter(Boolean).join(", ")}
                  </p>
                  <p className="pt-2 text-foreground/70">
                    <strong className="text-foreground">Contact:</strong> {order.customer_phone || order.shipping_phone || "Not provided"}
                  </p>
                  {order.customer_email && (
                    <p className="text-foreground/70">
                      <strong className="text-foreground">Email:</strong> {order.customer_email}
                    </p>
                  )}
                </div>
              </div>

              {/* Package Summary */}
              <div className="bg-card border border-border/80 rounded-lg p-6 shadow-sm">
                <h3 className="font-heading font-semibold text-sm mb-4 text-foreground flex items-center gap-2 pb-3 border-b border-border/50">
                  <Package className="w-4 h-4 text-accent" />
                  <span>Package Contents</span>
                </h3>
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {items.map((item: any, i: number) => (
                    <div key={i} className="flex gap-3 items-center text-xs">
                      <div className="w-12 h-12 bg-secondary rounded-sm overflow-hidden shrink-0 border border-border/40">
                        <img
                          src={item.imageUrl || "/products/white-oudh-attar.jpg"}
                          alt={item.name || item.product_name}
                          className="w-full h-full object-cover"
                          onError={(e: any) => { e.currentTarget.src = "/products/white-oudh-attar.jpg" }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{item.name || item.product_name}</p>
                        <p className="text-foreground/50 text-[11px]">{item.size || "12ml"} • Qty: {item.quantity}</p>
                      </div>
                      <div className="font-semibold text-foreground">
                        ₹{((item.price || item.unit_price || 0) * (item.quantity || 1)).toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 mt-4 border-t border-border/50 flex justify-between items-center text-xs font-bold text-foreground">
                  <span>Grand Total</span>
                  <span className="text-sm text-accent">₹{Number(order.total_amount).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  )
}
