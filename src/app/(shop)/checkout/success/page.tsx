"use client"

import { Container } from "@/components/layout/container"
import { useCart } from "@/hooks/use-cart"
import { CheckCircle2, Copy, Check } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"

function SuccessContent() {
  const { clearCart } = useCart()
  const hasCleared = useRef(false)
  const searchParams = useSearchParams()
  const [copied, setCopied] = useState(false)

  const orderNumber = searchParams.get("orderNumber") || `ITR-${Math.floor(100000 + Math.random() * 900000)}`
  const paymentId = searchParams.get("paymentId") || ""
  
  useEffect(() => {
    if (!hasCleared.current) {
      clearCart()
      hasCleared.current = true
    }
  }, [clearCart])

  const copyOrderId = () => {
    if (orderNumber) {
      navigator.clipboard.writeText(orderNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="py-24 bg-background min-h-[70vh] flex flex-col items-center justify-center">
      <Container className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center max-w-xl mx-auto"
        >
          <div className="w-20 h-20 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-accent" />
          </div>

          <span className="text-xs uppercase tracking-widest text-accent font-semibold mb-2">
            {paymentId === "COD" ? "Order Confirmed" : "Payment Confirmed"}
          </span>
          <h1 className="font-heading text-3xl md:text-5xl font-bold mb-4">Your order has been placed.</h1>
          <p className="text-sm md:text-base text-foreground/70 max-w-lg mx-auto mb-8">
            Thank you for choosing SN AttarWala. 
            {paymentId === "COD" 
              ? " Your order is being processed for dispatch and payment will be collected on delivery."
              : " Your payment via Razorpay was successful and your order is being processed for dispatch."
            }
          </p>
          
          <div className="bg-card border border-border/60 p-6 md:p-8 rounded-lg w-full mb-10 text-left shadow-sm">
            <h3 className="font-heading font-semibold text-base border-b border-border/50 pb-3 mb-4 text-foreground">
              Order Receipt
            </h3>
            <div className="space-y-3 text-xs md:text-sm text-foreground/80">
              <div className="flex justify-between items-center">
                <span className="text-foreground/60">Order ID:</span>
                <button 
                  onClick={copyOrderId}
                  className="font-mono font-bold text-foreground flex items-center gap-1.5 hover:text-accent transition-colors"
                  title="Copy Order ID"
                >
                  <span>#{orderNumber}</span>
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-foreground/40" />}
                </button>
              </div>
              {paymentId && (
                <div className="flex justify-between items-center">
                  <span className="text-foreground/60">Payment ID:</span>
                  <span className="font-mono text-[11px] text-foreground/70">{paymentId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-foreground/60">Status:</span>
                <span className={`font-semibold ${paymentId === "COD" ? "text-amber-500" : "text-emerald-500"}`}>
                  {paymentId === "COD" ? "Pending (Cash on Delivery)" : "Paid & Confirmed"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/60">Payment Method:</span>
                <span className="font-medium text-foreground">
                  {paymentId === "COD" ? "Cash on Delivery" : "Razorpay (Verified)"}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
            <Link 
              href="/account/orders"
              className="px-8 py-3.5 bg-primary text-primary-foreground font-medium uppercase tracking-widest text-xs hover:bg-primary/90 transition-colors rounded-sm"
            >
              Track Order
            </Link>
            <Link 
              href="/shop"
              className="px-8 py-3.5 border border-border text-foreground font-medium uppercase tracking-widest text-xs hover:bg-secondary transition-colors rounded-sm"
            >
              Continue Shopping
            </Link>
          </div>
        </motion.div>
      </Container>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="py-24 bg-background min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
