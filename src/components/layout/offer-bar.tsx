"use client"

import { useState, useEffect } from "react"
import { Sparkles, Copy, Check, ChevronRight, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface CouponOffer {
  code: string
  discountType: string
  discountValue: number
  minOrder: number
}

export function OfferBar() {
  const [offers, setOffers] = useState<CouponOffer[]>([
    {
      code: "WELCOME10",
      discountType: "percentage",
      discountValue: 10,
      minOrder: 999
    }
  ])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [copied, setCopied] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const fetchActiveCoupons = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("coupons")
          .select("code, discount_type, discount_value, min_order_value")
          .eq("is_active", true)
          .limit(5)

        if (!error && data && data.length > 0) {
          setOffers(data.map((c: any) => ({
            code: c.code,
            discountType: c.discount_type || "percentage",
            discountValue: Number(c.discount_value) || 10,
            minOrder: Number(c.min_order_value) || 0
          })))
        }
      } catch {
        // Fallback to default offer
      }
    }

    fetchActiveCoupons()
  }, [])

  // Rotate through offers if more than one
  useEffect(() => {
    if (offers.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % offers.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [offers.length])

  if (dismissed || offers.length === 0) return null

  const currentOffer = offers[currentIndex]
  const discountText = currentOffer.discountType === "percentage"
    ? `${currentOffer.discountValue}% OFF`
    : `FLAT ₹${currentOffer.discountValue} OFF`

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(currentOffer.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white border-b border-accent/30 py-2 px-4 text-xs z-50 overflow-hidden shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left / Center: Promotion Ticker */}
        <div className="flex-1 flex items-center justify-center gap-2.5 text-center flex-wrap">
          <div className="inline-flex items-center gap-1.5 text-accent font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 fill-accent animate-pulse" />
            <span className="uppercase text-[11px] tracking-widest hidden sm:inline">Special Offer:</span>
          </div>

          <p className="text-white/90 font-medium">
            Get <span className="font-bold text-accent">{discountText}</span>
            {currentOffer.minOrder > 0 && <span> on orders above ₹{currentOffer.minOrder.toLocaleString("en-IN")}</span>}
            {" • "}
            Use code:
          </p>

          {/* Click to copy coupon badge */}
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm bg-accent/20 border border-accent/50 text-accent font-mono font-bold text-xs hover:bg-accent hover:text-slate-950 transition-colors uppercase tracking-wider group"
            title="Click to copy code"
          >
            <span>{currentOffer.code}</span>
            {copied ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100" />
            )}
          </button>

          {copied && (
            <span className="text-[10px] text-emerald-400 font-semibold animate-in fade-in">
              Copied!
            </span>
          )}

          <span className="hidden md:inline text-white/40">|</span>
          <span className="hidden md:inline text-white/70">
            Free Express Shipping Pan-India above ₹999
          </span>

          <Link
            href="/shop"
            className="hidden lg:inline-flex items-center gap-0.5 text-accent hover:underline font-semibold text-[11px] uppercase tracking-wider ml-1"
          >
            <span>Shop Now</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Dismiss button */}
        <button
          onClick={() => setDismissed(true)}
          className="text-white/50 hover:text-white p-0.5 transition-colors shrink-0"
          aria-label="Dismiss offer bar"
        >
          <X className="w-3.5 h-3.5" />
        </button>

      </div>
    </div>
  )
}
