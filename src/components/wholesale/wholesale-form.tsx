"use client"

import { useState } from "react"
import { Send, CheckCircle2, MessageCircle, ArrowRight, Building2, AlertCircle } from "lucide-react"

const BUSINESS_TYPES = [
  "Retail Perfume Store",
  "Boutique / Gift Store",
  "E-Commerce Reseller",
  "Corporate Gifting & Events",
  "Wholesale Distributor",
  "Salon & Luxury Spa",
  "Emerging Fragrance Brand",
  "Other",
]

const ORDER_QUANTITIES = [
  "Starter Wholesale (50 - 100 units)",
  "Medium Bulk (100 - 500 units)",
  "High Volume (500 - 2,000 units)",
  "Master Distributor (2,000+ units)",
  "Bulk Concentrates by KG / Liter",
]

const PRODUCT_OPTIONS = [
  "Attar Bottles (12ml, 24ml, 55ml)",
  "Bulk Concentrated Oils (KG / Liter)",
  "Eau De Parfum Sprays (30ml, 50ml, 100ml)",
  "Bakhoor & Incense Blends",
  "Private Label & Custom Packaging",
  "Corporate Gift Boxes",
]

export function WholesaleForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    businessName: "",
    phone: "",
    email: "",
    city: "",
    businessType: "Retail Perfume Store",
    orderQuantity: "Starter Wholesale (50 - 100 units)",
    gstNumber: "",
    message: "",
  })

  const [selectedProducts, setSelectedProducts] = useState<string[]>([
    "Attar Bottles (12ml, 24ml, 55ml)",
  ])

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [ticketNumber, setTicketNumber] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  const toggleProduct = (product: string) => {
    setSelectedProducts((prev) =>
      prev.includes(product) ? prev.filter((p) => p !== product) : [...prev, product]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")

    if (!formData.fullName.trim() || !formData.businessName.trim() || !formData.phone.trim() || !formData.email.trim()) {
      setErrorMsg("Please complete all required fields marked with an asterisk (*).")
      return
    }

    if (selectedProducts.length === 0) {
      setErrorMsg("Please select at least one product category of interest.")
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch("/api/wholesale/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          productInterests: selectedProducts,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setTicketNumber(data.ticketNumber || `WS-${Date.now().toString().slice(-6)}`)
        setSubmitted(true)
      } else {
        setErrorMsg(data.error || "Failed to submit inquiry. Please try again or message us on WhatsApp.")
      }
    } catch {
      // Fallback: still show success with generated ticket so user gets WhatsApp connect link
      const fallbackTicket = `WS-${Date.now().toString().slice(-6)}`
      setTicketNumber(fallbackTicket)
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  const whatsappDeskNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919082377314").replace(/\D/g, "")
  const prefilledWhatsAppUrl = `https://wa.me/${whatsappDeskNumber}?text=${encodeURIComponent(
    `Hello SN AttarWala Wholesale Desk! I just submitted a wholesale inquiry on your website.\n\n` +
      `*Reference:* ${ticketNumber || "Direct Inquiry"}\n` +
      `*Business Name:* ${formData.businessName}\n` +
      `*Contact Person:* ${formData.fullName} (${formData.phone})\n` +
      `*City/State:* ${formData.city || "Not provided"}\n` +
      `*Business Type:* ${formData.businessType}\n` +
      `*Order Volume:* ${formData.orderQuantity}\n` +
      `*Products of Interest:* ${selectedProducts.join(", ")}\n` +
      (formData.gstNumber ? `*GST / Tax ID:* ${formData.gstNumber}\n` : "") +
      (formData.message ? `*Notes:* ${formData.message}\n` : "") +
      `\nPlease share your wholesale catalog and bulk pricing.`
  )}`

  if (submitted) {
    return (
      <div className="bg-background border border-border/70 rounded-sm p-8 sm:p-12 shadow-sm text-center">
        <div className="w-16 h-16 bg-accent/15 text-accent rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent block mb-2">
          Inquiry Received · {ticketNumber}
        </span>
        <h3 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-4">
          Thank You, {formData.fullName}!
        </h3>
        <p className="text-foreground/70 max-w-lg mx-auto text-sm leading-relaxed mb-8">
          Your wholesale inquiry for <strong className="text-foreground">{formData.businessName}</strong> has been logged with our B2B team. A wholesale account manager will review your requirements and reach out within 24 business hours.
        </p>

        {/* Summary Box */}
        <div className="max-w-md mx-auto bg-secondary/30 border border-border/50 rounded-sm p-5 text-left mb-8 text-xs space-y-2">
          <div className="flex justify-between border-b border-border/30 pb-2">
            <span className="text-foreground/60 uppercase tracking-wider font-semibold">Business</span>
            <span className="font-medium text-foreground">{formData.businessName}</span>
          </div>
          <div className="flex justify-between border-b border-border/30 pb-2">
            <span className="text-foreground/60 uppercase tracking-wider font-semibold">Location</span>
            <span className="font-medium text-foreground">{formData.city || "India"}</span>
          </div>
          <div className="flex justify-between border-b border-border/30 pb-2">
            <span className="text-foreground/60 uppercase tracking-wider font-semibold">Volume</span>
            <span className="font-medium text-foreground">{formData.orderQuantity}</span>
          </div>
          <div>
            <span className="text-foreground/60 uppercase tracking-wider font-semibold block mb-1">Products</span>
            <span className="font-medium text-foreground">{selectedProducts.join(" · ")}</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          <a
            href={prefilledWhatsAppUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366] text-white hover:bg-[#20ba59] px-6 py-3.5 text-xs font-semibold uppercase tracking-widest rounded-sm transition-colors shadow-sm"
          >
            <MessageCircle className="w-4 h-4" />
            Chat on WhatsApp Now
          </a>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false)
              setFormData({
                fullName: "",
                businessName: "",
                phone: "",
                email: "",
                city: "",
                businessType: "Retail Perfume Store",
                orderQuantity: "Starter Wholesale (50 - 100 units)",
                gstNumber: "",
                message: "",
              })
              setSelectedProducts(["Attar Bottles (12ml, 24ml, 55ml)"])
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center border border-border hover:border-accent text-foreground px-6 py-3.5 text-xs font-semibold uppercase tracking-widest rounded-sm transition-colors"
          >
            Submit Another Inquiry
          </button>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-background border border-border/70 rounded-sm p-6 sm:p-10 shadow-sm"
    >
      <div className="mb-8 border-b border-border/50 pb-6">
        <div className="flex items-center gap-2 text-accent text-xs font-semibold uppercase tracking-[0.2em] mb-2">
          <Building2 className="w-4 h-4" />
          Wholesale Application Form
        </div>
        <h3 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
          Request Wholesale Catalog & Pricing
        </h3>
        <p className="text-foreground/65 text-xs sm:text-sm mt-2 leading-relaxed">
          Fill in your business details. Our wholesale desk will review your requirements and provide volume price tiers and catalog access.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-sm bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Name & Business */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-widest text-foreground/70 mb-1.5 block">
              Contact Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mohammed Farhan"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full bg-background border border-border/70 focus:border-accent focus:ring-1 focus:ring-accent/40 rounded-sm py-2.5 px-3.5 text-xs sm:text-sm text-foreground outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-widest text-foreground/70 mb-1.5 block">
              Business / Store Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Al-Madina Fragrances"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              className="w-full bg-background border border-border/70 focus:border-accent focus:ring-1 focus:ring-accent/40 rounded-sm py-2.5 px-3.5 text-xs sm:text-sm text-foreground outline-none transition-colors"
            />
          </div>
        </div>

        {/* Phone & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-widest text-foreground/70 mb-1.5 block">
              WhatsApp / Mobile <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              placeholder="e.g. +91 98765 43210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-background border border-border/70 focus:border-accent focus:ring-1 focus:ring-accent/40 rounded-sm py-2.5 px-3.5 text-xs sm:text-sm text-foreground outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-widest text-foreground/70 mb-1.5 block">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="e.g. orders@almadina.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-background border border-border/70 focus:border-accent focus:ring-1 focus:ring-accent/40 rounded-sm py-2.5 px-3.5 text-xs sm:text-sm text-foreground outline-none transition-colors"
            />
          </div>
        </div>

        {/* City & Business Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-widest text-foreground/70 mb-1.5 block">
              City & State <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Hyderabad, Telangana"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full bg-background border border-border/70 focus:border-accent focus:ring-1 focus:ring-accent/40 rounded-sm py-2.5 px-3.5 text-xs sm:text-sm text-foreground outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-widest text-foreground/70 mb-1.5 block">
              Business Type
            </label>
            <select
              value={formData.businessType}
              onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
              className="w-full bg-background border border-border/70 focus:border-accent focus:ring-1 focus:ring-accent/40 rounded-sm py-2.5 px-3.5 text-xs sm:text-sm text-foreground outline-none transition-colors"
            >
              {BUSINESS_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Interests (Multi-select pills) */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-widest text-foreground/70 mb-2 block">
            Products of Interest <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRODUCT_OPTIONS.map((prod) => {
              const active = selectedProducts.includes(prod)
              return (
                <button
                  type="button"
                  key={prod}
                  onClick={() => toggleProduct(prod)}
                  className={`text-left px-3.5 py-2.5 rounded-sm border text-xs transition-all flex items-center justify-between ${
                    active
                      ? "border-accent bg-accent/10 text-foreground font-medium"
                      : "border-border/60 bg-secondary/15 text-foreground/70 hover:border-border"
                  }`}
                >
                  <span>{prod}</span>
                  <span
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] ${
                      active ? "bg-accent border-accent text-black font-bold" : "border-border"
                    }`}
                  >
                    {active ? "✓" : ""}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Order Quantity & GST */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-widest text-foreground/70 mb-1.5 block">
              Estimated Order Volume
            </label>
            <select
              value={formData.orderQuantity}
              onChange={(e) => setFormData({ ...formData, orderQuantity: e.target.value })}
              className="w-full bg-background border border-border/70 focus:border-accent focus:ring-1 focus:ring-accent/40 rounded-sm py-2.5 px-3.5 text-xs sm:text-sm text-foreground outline-none transition-colors"
            >
              {ORDER_QUANTITIES.map((qty) => (
                <option key={qty} value={qty}>
                  {qty}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-widest text-foreground/70 mb-1.5 block">
              GST Number (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 27AAAAA0000A1Z5"
              value={formData.gstNumber}
              onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
              className="w-full bg-background border border-border/70 focus:border-accent focus:ring-1 focus:ring-accent/40 rounded-sm py-2.5 px-3.5 text-xs sm:text-sm text-foreground outline-none transition-colors"
            />
          </div>
        </div>

        {/* Notes / Message */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-widest text-foreground/70 mb-1.5 block">
            Specific Requirements / Notes (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="Tell us about specific fragrance profiles, custom packaging desires, or target launch timeline..."
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full bg-background border border-border/70 focus:border-accent focus:ring-1 focus:ring-accent/40 rounded-sm p-3 text-xs sm:text-sm text-foreground outline-none transition-colors resize-y"
          />
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-primary text-primary-foreground hover:bg-accent hover:text-black font-semibold uppercase tracking-widest text-xs rounded-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Submitting Inquiry...
              </>
            ) : (
              <>
                Submit Wholesale Inquiry
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          <p className="text-[11px] text-foreground/50 text-center mt-3">
            Your details are safe and confidential. We never share wholesale buyer info.
          </p>
        </div>
      </div>
    </form>
  )
}

