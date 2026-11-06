"use client"

import { useState, useEffect } from "react"
import { 
  Search, Eye, Package, Truck, Check, 
  X, ChevronDown, Filter, Download,
  Clock, RefreshCw, AlertTriangle, ArrowRight,
  MapPin, Phone, Mail, MessageSquareShare, Sparkles,
  Barcode, ExternalLink, Trash2
} from "lucide-react"
import { getAdminOrders, updateAdminOrderStatus, deleteAdminOrder, AdminOrder } from "@/lib/admin-service"
import { ExportMenu } from "@/components/admin/export-menu"
import { 
  getDeliveryPartnerConfig, 
  isDeliveryApiIntegrated, 
  DeliveryPartnerConfig, 
  DEFAULT_DELIVERY_CONFIG 
} from "@/lib/delivery-partner-service"

type OrderStatus = "All" | "New" | "Confirmed" | "Processing" | "Packed" | "Shipped" | "Out for Delivery" | "Delivered" | "Cancelled"

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<OrderStatus>("All")
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)
  const [advancing, setAdvancing] = useState<string | null>(null)

  // Delivery Partner & Manual Fulfillment Modal State
  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryPartnerConfig>(DEFAULT_DELIVERY_CONFIG)
  const [shippingModalOrder, setShippingModalOrder] = useState<AdminOrder | null>(null)
  const [shippingCourier, setShippingCourier] = useState("Delhivery")
  const [customCourier, setCustomCourier] = useState("")
  const [shippingAwb, setShippingAwb] = useState("")
  const [isShippingSaving, setIsShippingSaving] = useState(false)

  const loadOrders = async () => {
    setLoading(true)
    const [data, partnerCfg] = await Promise.all([
      getAdminOrders(),
      getDeliveryPartnerConfig()
    ])
    setOrders(data)
    if (partnerCfg) setDeliveryConfig(partnerCfg)
    setLoading(false)
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const filtered = orders.filter(o => {
    const matchSearch = 
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.city.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "All" || o.orderStatus === statusFilter
    return matchSearch && matchStatus
  })

  const statusTabs: OrderStatus[] = ["All", "New", "Confirmed", "Processing", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"]

  const statusCounts: Record<string, number> = {}
  orders.forEach(o => {
    statusCounts[o.orderStatus] = (statusCounts[o.orderStatus] || 0) + 1
  })

  const progressMap: Partial<Record<AdminOrder["orderStatus"], AdminOrder["orderStatus"]>> = {
    "New": "Confirmed",
    "Confirmed": "Processing",
    "Processing": "Packed",
    "Packed": "Shipped",
    "Shipped": "Out for Delivery",
    "Out for Delivery": "Delivered"
  }

  const executeStatusUpdate = async (orderId: string, nextStatus: AdminOrder["orderStatus"]) => {
    setAdvancing(orderId)
    const ok = await updateAdminOrderStatus(orderId, nextStatus)
    if (ok) {
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, orderStatus: nextStatus } : o
      ))
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, orderStatus: nextStatus })
      }
    }
    setAdvancing(null)
  }

  const advanceOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId)
    if (!order || !progressMap[order.orderStatus]) return
    const nextStatus = progressMap[order.orderStatus]!

    // If advancing to "Shipped" and no automated delivery partner API is active, prompt admin
    if (nextStatus === "Shipped" && !isDeliveryApiIntegrated(deliveryConfig)) {
      setShippingModalOrder(order)
      setShippingCourier(order.courier || "Delhivery")
      setShippingAwb(order.trackingNumber || "")
      setCustomCourier("")
      return
    }

    await executeStatusUpdate(orderId, nextStatus)
  }

  const handleConfirmShipment = async (withDetails: boolean) => {
    if (!shippingModalOrder) return
    setIsShippingSaving(true)

    const finalCourier = withDetails
      ? (shippingCourier === "Other" ? (customCourier.trim() || "Courier") : shippingCourier)
      : (shippingModalOrder.courier || "")
    const finalAwb = withDetails ? shippingAwb.trim() : ""

    const ok = await updateAdminOrderStatus(shippingModalOrder.id, "Shipped", {
      courierPartner: finalCourier || undefined,
      trackingNumber: finalAwb || undefined
    })

    if (ok) {
      setOrders(prev => prev.map(o =>
        o.id === shippingModalOrder.id 
          ? { ...o, orderStatus: "Shipped", courier: finalCourier, trackingNumber: finalAwb } 
          : o
      ))
      if (selectedOrder?.id === shippingModalOrder.id) {
        setSelectedOrder({
          ...selectedOrder,
          orderStatus: "Shipped",
          courier: finalCourier,
          trackingNumber: finalAwb
        })
      }
      setShippingModalOrder(null)
    } else {
      alert("Failed to update order status to Shipped. Please try again.")
    }
    setIsShippingSaving(false)
  }

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    "New":              { bg: "bg-secondary", text: "text-foreground", label: "New" },
    "Pending":          { bg: "bg-secondary", text: "text-foreground", label: "New" },
    "Confirmed":        { bg: "bg-accent/15", text: "text-accent", label: "Confirmed" },
    "Processing":       { bg: "bg-amber-500/15", text: "text-amber-600", label: "Processing" },
    "Packed":           { bg: "bg-blue-500/15", text: "text-blue-600", label: "Packed" },
    "Shipped":          { bg: "bg-indigo-500/15", text: "text-indigo-600", label: "Shipped" },
    "Out for Delivery": { bg: "bg-purple-500/15", text: "text-purple-600", label: "Out for Delivery" },
    "Delivered":        { bg: "bg-emerald-500/15", text: "text-emerald-600", label: "Delivered" },
    "Cancelled":        { bg: "bg-destructive/10", text: "text-destructive", label: "Cancelled" },
    "Returned":         { bg: "bg-orange-500/15", text: "text-orange-600", label: "Returned" },
    "Refunded":         { bg: "bg-rose-500/15", text: "text-rose-600", label: "Refunded" }
  }

  const timeline: Partial<Record<AdminOrder["orderStatus"], string[]>> = {
    "New":              ["Order Placed"],
    "Confirmed":        ["Order Placed", "Confirmed"],
    "Processing":       ["Order Placed", "Processing"],
    "Packed":           ["Order Placed", "Processing", "Packed"],
    "Shipped":          ["Order Placed", "Processing", "Packed", "Shipped"],
    "Out for Delivery": ["Order Placed", "Processing", "Packed", "Shipped", "Out for Delivery"],
    "Delivered":        ["Order Placed", "Processing", "Packed", "Shipped", "Out for Delivery", "Delivered"],
    "Cancelled":        ["Order Placed", "Cancelled"]
  }

  const allSteps = ["Order Placed", "Processing", "Packed", "Shipped", "Out for Delivery", "Delivered"]

  // WhatsApp message generator for each stage
  const getWhatsAppMessage = (order: AdminOrder, stage: string): string => {
    const name = order.customer.name.split(" ")[0] || "Customer"
    const orderNum = order.orderNumber
    const items = order.items.map(i => `• ${i.name}${i.size && i.size !== "—" ? ` (${i.size})` : ""} × ${i.quantity}`).join("\n")
    const total = `₹${order.total.toLocaleString("en-IN")}`
    const isCOD = order.paymentMethod?.toLowerCase().includes("cash")
    const paymentNote = isCOD ? `💵 Payment: Cash on Delivery (₹${order.total.toLocaleString("en-IN")} to be paid at delivery)` : `✅ Payment: Paid online`
    const tracking = order.trackingNumber ? `\n🔢 Tracking AWB: ${order.trackingNumber}` : ""
    const courier = order.courier ? `\n🚚 Courier: ${order.courier}` : ""

    const messages: Record<string, string> = {
      "Confirmed": `🌙 *SN ATTARWALA* 🌙\n\nAssalamu Alaikum ${name}! 🤲\n\nYour order *${orderNum}* has been *confirmed*! Jazakallah Khair for your trust.\n\n📦 *Order Summary:*\n${items}\n\n💰 *Total: ${total}*\n${paymentNote}\n\nWe're preparing your premium fragrance with care. You'll receive another update soon.\n\n📞 Questions? WhatsApp us: +91 90823 77314\n\n_SN AttarWala — Crawford Market, Mumbai_`,

      "Processing": `🌙 *SN ATTARWALA* 🌙\n\nAssalamu Alaikum ${name}! 🤲\n\nGreat news! Your order *${orderNum}* is now being *processed & quality checked* ✨\n\n📦 *Your Items:*\n${items}\n\n💰 *Total: ${total}*\n${paymentNote}\n\nOur team is carefully inspecting and preparing your fragrances. Almost ready!\n\n📞 Questions? WhatsApp us: +91 90823 77314\n\n_SN AttarWala — Crawford Market, Mumbai_`,

      "Packed": `🌙 *SN ATTARWALA* 🌙\n\nAssalamu Alaikum ${name}! 🤲\n\nYour order *${orderNum}* has been *packed* in our premium luxury packaging! 🎁\n\n📦 *Your Items:*\n${items}\n\n💰 *Total: ${total}*\n${paymentNote}\n\nYour fragrance is beautifully wrapped and ready. We'll dispatch it very soon!\n\n📞 Questions? WhatsApp us: +91 90823 77314\n\n_SN AttarWala — Crawford Market, Mumbai_`,

      "Shipped": `🌙 *SN ATTARWALA* 🌙\n\nAssalamu Alaikum ${name}! 🤲\n\nYour order *${orderNum}* has been *dispatched!* 🚀${courier}${tracking}\n\n📦 *Your Items:*\n${items}\n\n💰 *Total: ${total}*\n${paymentNote}\n\nYour precious fragrance is on its way to you. You can track your order from our website.\n\n🌐 Track: snattarwala.in/account/orders\n📞 Questions? WhatsApp us: +91 90823 77314\n\n_SN AttarWala — Crawford Market, Mumbai_`,

      "Out for Delivery": `🌙 *SN ATTARWALA* 🌙\n\nAssalamu Alaikum ${name}! 🤲\n\nExciting news! Your order *${orderNum}* is *out for delivery* today! 🛵\n\n📦 *Your Items:*\n${items}\n\n💰 *Total: ${total}*\n${paymentNote}\n\nPlease keep your phone handy — the delivery agent will call before arriving. ${isCOD ? `\n\n💵 *Please keep ₹${order.total.toLocaleString("en-IN")} ready in cash.*` : ""}\n\n📞 Questions? WhatsApp us: +91 90823 77314\n\n_SN AttarWala — Crawford Market, Mumbai_`,

      "Delivered": `🌙 *SN ATTARWALA* 🌙\n\nAssalamu Alaikum ${name}! 🤲\n\nYour order *${orderNum}* has been *delivered successfully!* 🎉\n\n📦 *Your Items:*\n${items}\n\nJazakallah Khair for choosing SN AttarWala! We hope you love your fragrance. ❤️\n\n⭐ We'd love your feedback! Please leave a review on our website.\n🌐 snattarwala.in\n\n📞 Any issue? WhatsApp us: +91 90823 77314\n\n_SN AttarWala — Crawford Market, Mumbai_`,

      "Cancelled": `🌙 *SN ATTARWALA* 🌙\n\nAssalamu Alaikum ${name},\n\nYour order *${orderNum}* has been *cancelled* as per your request.\n\n${!isCOD ? `💳 If you paid online, your refund will be processed within 5-7 business days to your original payment method.\n\n` : ""}We're sorry to see you go. Please don't hesitate to reach out if you have any concerns.\n\n📞 WhatsApp: +91 90823 77314\n\n_SN AttarWala — Crawford Market, Mumbai_`,
    }

    return messages[stage] || messages["Confirmed"]
  }

  const sendWhatsApp = (order: AdminOrder) => {
    const phone = (order.customer.phone || "").replace(/\D/g, "")
    if (!phone || phone.length < 10) {
      alert("No valid phone number found for this customer.")
      return
    }
    // Use next status as the stage message, or current if terminal
    const nextStatus = progressMap[order.orderStatus] || order.orderStatus
    const message = getWhatsAppMessage(order, nextStatus)
    const encoded = encodeURIComponent(message)
    const waPhone = phone.startsWith("91") ? phone : `91${phone}`
    window.open(`https://wa.me/${waPhone}?text=${encoded}`, "_blank")
  }

  return (

    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-accent block mb-1">Fulfillment Center</span>
          <h1 className="font-heading text-3xl font-bold text-foreground">Order Management</h1>
          <p className="text-sm text-foreground/60">Process, track, and fulfill customer orders across Mumbai & Pan-India.</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportMenu
            filename="attarwala_orders"
            title="Customer Orders"
            buttonLabel="Export Orders"
            data={orders.map(o => ({
              "Order Number": o.orderNumber,
              "Customer Name": o.customer.name,
              "Phone": o.customer.phone,
              "Email": o.customer.email,
              "City": o.customer.city,
              "Items": o.items.map(i => `${i.name} (x${i.quantity})`).join("; "),
              "Total Amount (INR)": o.total,
              "Order Status": o.orderStatus,
              "Payment Status": o.paymentStatus,
              "Payment Method": o.paymentMethod,
              "Created Date": new Date(o.createdAt).toLocaleDateString("en-IN")
            }))}
            headers={["Order #", "Customer", "Phone", "City", "Total (₹)", "Status", "Date"]}
            printRows={orders.map(o => [
              o.orderNumber,
              o.customer.name,
              o.customer.phone,
              o.customer.city,
              `₹${o.total.toLocaleString("en-IN")}`,
              o.orderStatus,
              new Date(o.createdAt).toLocaleDateString("en-IN")
            ])}
          />
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: orders.length, color: "text-foreground" },
          { label: "Pending", value: statusCounts["Pending"] || 0, color: "text-amber-600" },
          { label: "In Transit", value: (statusCounts["Shipped"] || 0) + (statusCounts["Out for Delivery"] || 0), color: "text-blue-600" },
          { label: "Delivered Today", value: statusCounts["Delivered"] || 0, color: "text-emerald-600" }
        ].map(kpi => (
          <div key={kpi.label} className="bg-card p-5 rounded-lg border border-border/60 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest text-foreground/50 font-semibold">{kpi.label}</p>
            <p className={`text-2xl font-heading font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Status Tabs + Search */}
      <div className="bg-card p-4 rounded-lg border border-border/50 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 custom-scrollbar">
            {statusTabs.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`shrink-0 px-3 py-1.5 text-xs font-semibold rounded-sm uppercase tracking-wider transition-colors ${
                  statusFilter === s 
                    ? "bg-primary text-primary-foreground" 
                    : "text-foreground/60 hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                {s} {s === "All" ? `(${orders.length})` : statusCounts[s] ? `(${statusCounts[s]})` : ""}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by order ID or name..."
              className="w-full bg-background border border-border rounded-sm py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-accent text-foreground"
            />
          </div>
        </div>
      </div>

      {/* Main Layout: Table + Drawer */}
      <div className={`grid gap-6 ${selectedOrder ? "lg:grid-cols-5" : "grid-cols-1"}`}>

        {/* Orders Table */}
        <div className={`${selectedOrder ? "lg:col-span-3" : "col-span-1"} bg-card border border-border/50 rounded-lg shadow-sm overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 text-foreground/70 uppercase text-[10px] tracking-wider border-b border-border/50">
                <tr>
                  <th className="px-4 py-3.5 font-semibold">Order ID</th>
                  <th className="px-4 py-3.5 font-semibold">Customer</th>
                  {!selectedOrder && <th className="px-4 py-3.5 font-semibold">Items</th>}
                  <th className="px-4 py-3.5 font-semibold">Amount</th>
                  <th className="px-4 py-3.5 font-semibold">Status</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map(order => {
                  const cfg = statusConfig[order.orderStatus] || statusConfig["Pending"]
                  const isSelected = selectedOrder?.id === order.id
                  return (
                    <tr 
                      key={order.id}
                      className={`cursor-pointer transition-colors ${isSelected ? "bg-accent/5 border-l-2 border-accent" : "hover:bg-secondary/20"}`}
                      onClick={() => setSelectedOrder(isSelected ? null : order)}
                    >
                      <td className="px-4 py-3.5 font-mono font-bold text-foreground">{order.orderNumber}</td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-foreground">{order.customer.name}</p>
                        <p className="text-[10px] text-foreground/50">{order.customer.city}</p>
                      </td>
                      {!selectedOrder && (
                        <td className="px-4 py-3.5 text-foreground/70 max-w-[200px] truncate">
                          {order.items.map(i => i.name).join(", ")}
                        </td>
                      )}
                      <td className="px-4 py-3.5 font-bold text-foreground">₹{order.total.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-wider ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button className="p-1.5 rounded-sm hover:bg-secondary text-foreground/60 hover:text-accent transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Detail Drawer */}
        {selectedOrder && (
          <div className="lg:col-span-2 bg-card border border-accent/30 rounded-lg shadow-sm overflow-hidden animate-in slide-in-from-right-4 duration-300 flex flex-col">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-border/50 bg-background/50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-accent uppercase tracking-widest">Order Detail</span>
                <h3 className="font-heading font-bold text-base">{selectedOrder.orderNumber}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1.5 hover:bg-secondary rounded-sm">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* Status Timeline */}
              <div className="p-5 border-b border-border/40">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-foreground/50 mb-3">Fulfillment Timeline</p>
                <div className="flex gap-0">
                  {allSteps.map((step, i) => {
                    const completed = (timeline[selectedOrder.orderStatus] || []).includes(step)
                    const isLast = i === allSteps.length - 1
                    return (
                      <div key={step} className={`flex-1 flex flex-col items-center ${isLast ? "" : "relative"}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center z-10 ${
                          completed ? "bg-accent" : "bg-secondary border border-border"
                        }`}>
                          {completed && <Check className="w-3 h-3 text-slate-950" />}
                        </div>
                        {!isLast && (
                          <div className={`h-0.5 w-full absolute top-2.5 left-1/2 ${completed ? "bg-accent" : "bg-border"}`} />
                        )}
                        <p className="text-[8px] text-center text-foreground/50 mt-1.5 leading-tight max-w-[60px]">{step}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Customer Info */}
              <div className="p-5 border-b border-border/40 space-y-2.5">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-foreground/50 mb-2">Customer</p>
                <div className="flex items-center space-x-2 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span className="text-foreground">{selectedOrder.customer.name} — {selectedOrder.customer.address}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <Phone className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span className="text-foreground">{selectedOrder.customer.phone}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <Mail className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span className="text-foreground">{selectedOrder.customer.email}</span>
                </div>
              </div>

              {/* Shipment & Tracking Details */}
              {(selectedOrder.trackingNumber || selectedOrder.courier || selectedOrder.orderStatus === "Shipped" || selectedOrder.orderStatus === "Out for Delivery" || selectedOrder.orderStatus === "Delivered") && (
                <div className="p-5 border-b border-border/40 space-y-2 bg-accent/5">
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-foreground/50 mb-1 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-accent" /> Shipment & Tracking
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-foreground/50 block">Courier Partner</span>
                      <span className="font-semibold text-foreground">{selectedOrder.courier || "Standard Delivery"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-foreground/50 block">AWB / Tracking Number</span>
                      <span className="font-mono font-semibold text-accent">{selectedOrder.trackingNumber || "Pending Dispatch"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="p-5 border-b border-border/40 space-y-3">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-foreground/50 mb-2">Ordered Items</p>
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2.5 bg-background rounded-sm border border-border/50">
                    <div className="flex items-center space-x-2.5">
                      <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded-sm border border-border/50" />
                      <div>
                        <p className="font-semibold text-foreground">{item.name}</p>
                        <p className="text-[10px] text-foreground/50">{item.size} × {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-bold text-foreground">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>

              {/* Payment Summary */}
              <div className="p-5 border-b border-border/40 space-y-1.5 text-xs">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-foreground/50 mb-2">Payment Summary</p>
                <div className="flex justify-between text-foreground/70">
                  <span>Subtotal</span>
                  <span>₹{selectedOrder.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-foreground/70">
                  <span>Shipping</span>
                  <span className={selectedOrder.shipping > 0 ? "font-semibold" : "text-emerald-600 font-semibold"}>
                    {selectedOrder.shipping > 0 ? `₹${selectedOrder.shipping.toLocaleString('en-IN')}` : "Free"}
                  </span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>-₹{selectedOrder.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-foreground border-t border-border/40 pt-2 mt-1">
                  <span>{selectedOrder.paymentStatus === "Paid" ? "Total Paid" : "Total Due (COD)"}</span>
                  <span className="text-accent text-base font-heading">₹{selectedOrder.total.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[10px] text-foreground/50">
                  <span>Payment Method</span>
                  <span className="font-semibold">{selectedOrder.paymentMethod} • <span className={selectedOrder.paymentStatus === "Paid" ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>{selectedOrder.paymentStatus}</span></span>
                </div>
                {selectedOrder.cancelReason && (
                  <div className="mt-3 p-2.5 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
                    <p className="font-bold text-[10px] uppercase tracking-wider">Cancellation Reason:</p>
                    <p className="mt-0.5">{selectedOrder.cancelReason}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-4 border-t border-border/50 bg-background/50 space-y-2">
              {/* Mark as Next Status button */}
              {selectedOrder.orderStatus !== "Delivered" && selectedOrder.orderStatus !== "Cancelled" && progressMap[selectedOrder.orderStatus] && (
                <button
                  onClick={() => advanceOrder(selectedOrder.id)}
                  disabled={advancing === selectedOrder.id}
                  className="w-full py-2.5 bg-accent text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-wait"
                >
                  {advancing === selectedOrder.id ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      <span>Mark as {progressMap[selectedOrder.orderStatus]}</span>
                    </>
                  )}
                </button>
              )}

              {/* Send WhatsApp Update — opens customer's WhatsApp with prefilled message */}
              <button
                onClick={() => sendWhatsApp(selectedOrder)}
                className="w-full py-2.5 bg-emerald-600/10 border border-emerald-600/30 text-emerald-700 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-emerald-600/20 transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquareShare className="w-4 h-4" />
                <span>Send WhatsApp Update</span>
              </button>

              {/* Cancel Order */}
              {selectedOrder.orderStatus !== "Delivered" && selectedOrder.orderStatus !== "Cancelled" && (
                <button
                  onClick={async () => {
                    if (!confirm(`Cancel order ${selectedOrder.orderNumber}?`)) return
                    const ok = await updateAdminOrderStatus(selectedOrder.id, "Cancelled")
                    if (ok) {
                      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, orderStatus: "Cancelled" } : o))
                      setSelectedOrder({ ...selectedOrder, orderStatus: "Cancelled" })
                    } else {
                      alert("Failed to cancel order. Please try again.")
                    }
                  }}
                  className="w-full py-2 text-destructive/70 hover:text-destructive font-semibold text-[11px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel Order
                </button>
              )}

              {/* Permanently Delete Order (e.g. Test Orders) */}
              <button
                onClick={async () => {
                  if (!confirm(`Permanently delete order ${selectedOrder.orderNumber}? This cannot be undone.`)) return
                  const ok = await deleteAdminOrder(selectedOrder.id)
                  if (ok) {
                    setOrders(prev => prev.filter(o => o.id !== selectedOrder.id))
                    setSelectedOrder(null)
                  } else {
                    alert("Failed to delete order. Please try again.")
                  }
                }}
                className="w-full py-1.5 text-destructive/50 hover:text-destructive font-medium text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 border-t border-border/30 pt-2"
              >
                <Trash2 className="w-3 h-3" />
                Delete Order
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DISPATCH / SHIPPED PROMPT MODAL (Manual Fulfillment) */}
      {shippingModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-accent/40 rounded-lg shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-border/50 bg-background/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-sm bg-accent/15 flex items-center justify-center text-accent">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-bold text-base text-foreground">Mark Order as Shipped</h3>
                    <span className="px-2 py-0.5 bg-accent/10 border border-accent/20 text-accent font-mono text-[10px] font-bold rounded-sm">
                      {shippingModalOrder.orderNumber}
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground/50 mt-0.5">
                    Customer: {shippingModalOrder.customer.name} ({shippingModalOrder.customer.city})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShippingModalOrder(null)} 
                className="p-1 hover:bg-secondary rounded-sm text-foreground/60 hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-sm text-xs text-foreground/80 space-y-1">
                <p className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> No automated delivery API connected
                </p>
                <p className="text-[11px] text-foreground/70 leading-relaxed">
                  Enter your courier name and AWB tracking number below. If you do not have an AWB yet, you can also <strong>proceed without AWB</strong> and add tracking later.
                </p>
              </div>

              {/* Courier Partner Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-foreground/80 block">
                  Courier / Delivery Partner
                </label>
                <select
                  value={shippingCourier}
                  onChange={e => setShippingCourier(e.target.value)}
                  className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground"
                >
                  <option value="Delhivery">Delhivery</option>
                  <option value="BlueDart Express">BlueDart Express</option>
                  <option value="DTDC Express">DTDC Express</option>
                  <option value="Ekart Logistics">Ekart Logistics</option>
                  <option value="India Post (Speed Post)">India Post (Speed Post)</option>
                  <option value="Shadowfax">Shadowfax</option>
                  <option value="Mumbai Express Same-Day Rider">Mumbai Express Same-Day Rider</option>
                  <option value="Other">Other / Custom Courier</option>
                </select>
              </div>

              {shippingCourier === "Other" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground/80 block">
                    Custom Courier Name *
                  </label>
                  <input
                    type="text"
                    value={customCourier}
                    onChange={e => setCustomCourier(e.target.value)}
                    placeholder="e.g. Professional Courier, Local Van"
                    className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground"
                  />
                </div>
              )}

              {/* AWB Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-foreground/80 flex items-center justify-between">
                  <span>AWB / Tracking Number</span>
                  <span className="text-[10px] text-foreground/40 font-normal font-sans">(Optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={shippingAwb}
                    onChange={e => setShippingAwb(e.target.value)}
                    placeholder="e.g. DL789234190IN or BLU8830129"
                    className="w-full bg-background border border-border rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-accent text-foreground font-mono"
                  />
                  <Barcode className="w-4 h-4 text-foreground/30 absolute right-3 top-2.5 pointer-events-none" />
                </div>
                <p className="text-[10px] text-foreground/50">
                  Tracking number will be sent to the customer via WhatsApp and shown on their order tracking page.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-border/50 bg-background/50 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setShippingModalOrder(null)}
                className="w-full sm:w-auto px-4 py-2 border border-border hover:bg-secondary rounded-sm text-xs font-semibold text-foreground/70 transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={isShippingSaving}
                  onClick={() => handleConfirmShipment(false)}
                  className="flex-1 sm:flex-none px-4 py-2 border border-border hover:border-accent/40 rounded-sm text-xs font-semibold text-foreground/80 hover:text-foreground transition-colors disabled:opacity-50"
                  title="Mark as Shipped without AWB tracking number"
                >
                  Proceed without AWB
                </button>
                <button
                  type="button"
                  disabled={isShippingSaving}
                  onClick={() => handleConfirmShipment(true)}
                  className="flex-1 sm:flex-none px-5 py-2 bg-accent text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-accent/90 transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isShippingSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{isShippingSaving ? "Saving..." : "Confirm & Ship"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
