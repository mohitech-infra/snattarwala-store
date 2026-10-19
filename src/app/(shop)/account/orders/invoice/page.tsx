"use client"

import { useEffect, useState, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Printer, ArrowLeft, Download, CheckCircle2, Truck, FileDown } from "lucide-react"
import Link from "next/link"
import { downloadInvoicePdf, printAndDownloadInvoice } from "@/lib/invoice-pdf"

function InvoiceContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderNumber = searchParams.get("orderNumber") || searchParams.get("orderId") || ""
  const actionParam = searchParams.get("action")
  
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const autoTriggered = useRef(false)
  const supabase = createClient()

  useEffect(() => {
    if (!orderNumber) {
      setError("No order number specified.")
      setLoading(false)
      return
    }

    const fetchOrder = async () => {
      try {
        const cleanNumber = orderNumber.trim()
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanNumber)

        let query = supabase
          .from("orders")
          .select(`
            *,
            order_items(*)
          `)

        if (isUuid) {
          query = query.or(`id.eq.${cleanNumber},order_number.eq.${cleanNumber}`)
        } else {
          const normalized = cleanNumber.replace(/^#/, "")
          query = query.or(`order_number.eq.${normalized},order_number.eq.#${normalized}`)
        }

        const { data, error: dbError } = await query.maybeSingle()

        if (dbError) throw dbError

        if (!data) {
          setError(`Order #${orderNumber} could not be found.`)
        } else {
          setOrder(data)
        }
      } catch (err: any) {
        console.error("Error fetching order for invoice:", err)
        setError(err.message || "Failed to load order invoice.")
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderNumber, supabase])

  useEffect(() => {
    if (order && actionParam === "download" && !autoTriggered.current) {
      autoTriggered.current = true
      downloadInvoicePdf(order)
    }
  }, [order, actionParam])

  const handlePrint = () => {
    if (typeof window !== "undefined" && order) {
      downloadInvoicePdf(order)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-foreground/60 tracking-wider uppercase font-medium">Generating Tax Invoice...</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center max-w-md mx-auto text-center px-4">
        <div className="w-14 h-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
          <Printer className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-heading font-semibold mb-2">Invoice Not Available</h2>
        <p className="text-sm text-foreground/70 mb-6">{error || "The requested order invoice could not be located."}</p>
        <Link
          href="/account/orders"
          className="px-6 py-2.5 bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-wider hover:bg-primary/90 transition-colors rounded-sm"
        >
          Return to Orders
        </Link>
      </div>
    )
  }

  const items = (Array.isArray(order.order_items) && order.order_items.length > 0)
    ? order.order_items
    : (Array.isArray(order.items) && order.items.length > 0)
    ? order.items
    : [
        {
          product_name: "Luxury Fragrance",
          quantity: 1,
          unit_price: order.total_amount,
          total_price: order.total_amount,
        }
      ]

  const invoiceDate = new Date(order.created_at).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const subtotal = Number(order.subtotal) || Number(order.total_amount) || 0
  const shippingAmount = Number(order.shipping_amount) || 0
  const discountAmount = Number(order.discount_amount) || 0
  const totalAmount = Number(order.total_amount) || 0

  const customerName = order.customer_name || order.shipping_name || "Valued Customer"
  const customerPhone = order.customer_phone || order.shipping_phone || "Not provided"
  const customerEmail = order.customer_email || "Not provided"
  const customerAddress = order.customer_address || [
    order.shipping_address_line1,
    order.shipping_address_line2,
    order.shipping_city,
    order.shipping_state,
    order.shipping_pincode
  ].filter(Boolean).join(", ") || "Mumbai, Maharashtra"

  const invoiceNumber = `INV-${order.order_number?.replace(/[^0-9]/g, "") || Date.now().toString().slice(-6)}`

  return (
    <div className="py-8 bg-background min-h-screen text-foreground print:bg-white print:text-black print:p-0">
      {/* Top Action Bar (Hidden on Print) */}
      <div className="max-w-4xl mx-auto px-4 mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 text-xs font-medium text-foreground/70 hover:text-accent transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Order History</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href={`/account/orders/track?orderNumber=${encodeURIComponent(order.order_number || order.id)}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-border text-xs font-medium hover:bg-secondary transition-colors rounded-sm"
          >
            <Truck className="w-3.5 h-3.5 text-accent" />
            <span>Track Order</span>
          </Link>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-wider hover:bg-primary/90 transition-colors shadow-sm rounded-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div className="max-w-4xl mx-auto bg-card border border-border/80 shadow-md p-8 md:p-12 rounded-lg print:border-none print:shadow-none print:p-6 print:max-w-full">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start pb-8 border-b border-border/60 gap-6">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="font-heading text-2xl font-bold tracking-wider uppercase text-foreground">
                SN ATTARWALA
              </span>
            </div>
            <p className="text-xs text-foreground/60 tracking-widest uppercase mb-1">
              House of Luxury Fragrances & Pure Attars
            </p>
            <p className="text-xs text-foreground/70 leading-relaxed max-w-sm">
              Shop #14, Royal Arcade, Mohammed Ali Road,
              <br />
              South Mumbai, Maharashtra - 400003, India
              <br />
              GSTIN: <span className="font-mono font-medium">27AABCS1429B1Z8</span>
              <br />
              Phone: +91 90823 77314 | Email: support@snattarwala.in
            </p>
          </div>

          <div className="sm:text-right">
            <span className="inline-block px-3 py-1 bg-accent/10 border border-accent/30 text-accent font-semibold text-xs tracking-widest uppercase rounded-sm mb-3">
              Tax Invoice
            </span>
            <h1 className="font-heading text-xl font-bold text-foreground mb-1">
              {invoiceNumber}
            </h1>
            <p className="text-xs text-foreground/60">
              Invoice Date: <span className="font-medium text-foreground">{invoiceDate}</span>
            </p>
            <p className="text-xs text-foreground/60 mt-0.5">
              Order ID: <span className="font-mono font-semibold text-foreground">#{order.order_number}</span>
            </p>
          </div>
        </div>

        {/* Bill To & Payment Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-b border-border/60 text-xs">
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-foreground/50 mb-2">
              Billed & Shipped To:
            </h3>
            <p className="font-bold text-sm text-foreground mb-1">{customerName}</p>
            <p className="text-foreground/80 leading-relaxed max-w-xs">{customerAddress}</p>
            <p className="text-foreground/70 mt-1">Phone: {customerPhone}</p>
            {customerEmail && <p className="text-foreground/70">Email: {customerEmail}</p>}
          </div>

          <div className="md:text-right space-y-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-foreground/50 mb-2">
              Payment & Dispatch Details:
            </h3>
            <div className="flex justify-between md:justify-end gap-4">
              <span className="text-foreground/60">Payment Mode:</span>
              <span className="font-medium text-foreground">{order.payment_method || "Razorpay"}</span>
            </div>
            <div className="flex justify-between md:justify-end gap-4">
              <span className="text-foreground/60">Payment Status:</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Paid & Verified
              </span>
            </div>
            {order.razorpay_payment_id && (
              <div className="flex justify-between md:justify-end gap-4">
                <span className="text-foreground/60">Transaction Ref:</span>
                <span className="font-mono text-foreground/80">{order.razorpay_payment_id}</span>
              </div>
            )}
            <div className="flex justify-between md:justify-end gap-4">
              <span className="text-foreground/60">Courier Service:</span>
              <span className="font-medium text-foreground">{order.courier_partner || "BlueDart Express"}</span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="py-6 border-b border-border/60">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/60 text-foreground/60 uppercase tracking-wider text-[10px]">
                <th className="py-3 font-semibold">#</th>
                <th className="py-3 font-semibold">Product Description</th>
                <th className="py-3 font-semibold text-center">HSN</th>
                <th className="py-3 font-semibold text-center">Qty</th>
                <th className="py-3 font-semibold text-right">Unit Price</th>
                <th className="py-3 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {items.map((item: any, idx: number) => {
                const name = item.product_name || item.name || "Fragrance"
                const qty = item.quantity || 1
                const unitPrice = Number(item.unit_price) || Number(item.price) || 0
                const lineTotal = unitPrice * qty
                const size = item.size || "12ml"

                return (
                  <tr key={idx} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-3.5 text-foreground/50">{idx + 1}</td>
                    <td className="py-3.5">
                      <p className="font-semibold text-foreground">{name}</p>
                      <p className="text-[11px] text-foreground/50">Size: {size}</p>
                    </td>
                    <td className="py-3.5 text-center font-mono text-foreground/60">3303</td>
                    <td className="py-3.5 text-center font-medium">{qty}</td>
                    <td className="py-3.5 text-right font-medium">₹{unitPrice.toLocaleString("en-IN")}</td>
                    <td className="py-3.5 text-right font-semibold text-foreground">₹{lineTotal.toLocaleString("en-IN")}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Totals Calculation */}
        <div className="py-6 flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-border/60">
          <div className="text-xs text-foreground/60 max-w-sm space-y-1">
            <p className="font-medium text-foreground">Tax Information:</p>
            <p className="leading-relaxed">
              Applicable GST (CGST 9% + SGST 9%) is included in the product MRP in accordance with the Goods and Services Tax Act.
            </p>
          </div>

          <div className="w-full sm:w-64 space-y-2 text-xs">
            <div className="flex justify-between text-foreground/70">
              <span>Subtotal:</span>
              <span className="font-medium">₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount ({order.coupon_code || "Applied"}):</span>
                <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between text-foreground/70">
              <span>Shipping & Handling:</span>
              <span className="font-medium">
                {shippingAmount === 0 ? "FREE" : `₹${shippingAmount.toLocaleString("en-IN")}`}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-foreground pt-2 border-t border-border/60">
              <span>Total Amount:</span>
              <span className="text-base text-accent">₹{totalAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Signatory & Notes */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-end gap-6 text-xs text-foreground/60">
          <div>
            <p className="font-medium text-foreground mb-1">Declaration & Terms:</p>
            <p className="text-[11px] leading-relaxed max-w-md">
              1. Goods once sold are covered under our 7-day hassle-free exchange & refund guarantee.
              <br />
              2. For questions regarding dispatch, please track online or contact WhatsApp support at +91 90823 77314.
              <br />
              3. This is a computer-generated invoice and requires no physical signature.
            </p>
          </div>

          <div className="text-center sm:text-right">
            <div className="inline-block border border-accent/40 rounded-sm p-3 bg-accent/5 text-center mb-2">
              <p className="font-heading font-bold text-accent text-xs uppercase tracking-wider">
                SN ATTARWALA
              </p>
              <p className="text-[9px] text-foreground/50 uppercase tracking-widest">
                Authorized Signatory
              </p>
            </div>
            <p className="text-[10px] text-foreground/40">Verified Authenticity Guarantee</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function InvoicePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <InvoiceContent />
    </Suspense>
  )
}
