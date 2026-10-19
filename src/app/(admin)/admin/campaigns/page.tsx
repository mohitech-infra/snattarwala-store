"use client"

import Link from "next/link"
import { Megaphone, AlertCircle, ArrowLeft, TicketPercent, ShieldOff } from "lucide-react"

export default function AdminCampaignsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8">
      {/* Header */}
      <div className="border-b border-border/50 pb-6">
        <span className="text-xs uppercase tracking-widest font-semibold text-accent block mb-1">
          Marketing Status
        </span>
        <h1 className="font-heading text-3xl font-bold text-foreground">
          WhatsApp Campaigns Deactivated
        </h1>
        <p className="text-sm text-foreground/60">
          Marketing campaign automation via third-party WhatsApp Business API is disabled for this store.
        </p>
      </div>

      {/* Notice Card */}
      <div className="bg-card border border-border/60 rounded-lg p-8 space-y-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <ShieldOff className="w-6 h-6 text-amber-500" />
          </div>
          <div className="space-y-2">
            <h3 className="font-heading font-bold text-lg text-foreground">
              WhatsApp Business API Inactive
            </h3>
            <p className="text-sm text-foreground/70 leading-relaxed">
              As per store policy, paid WhatsApp Business API message broadcasts and automated campaign blasts have been disabled to eliminate recurring third-party API costs.
            </p>
            <p className="text-xs text-foreground/50">
              No WhatsApp messages or promotional blasts will be dispatched from this platform.
            </p>
          </div>
        </div>

        <div className="p-4 bg-background border border-border/50 rounded-lg space-y-2 text-xs">
          <div className="flex items-center gap-2 font-semibold text-accent uppercase tracking-wider">
            <TicketPercent className="w-4 h-4" />
            <span>Recommended Alternative: Coupons & Store Discounts</span>
          </div>
          <p className="text-foreground/70 leading-relaxed">
            You can create and manage percentage discounts, flat cashbacks, free shipping codes, and flash sales directly in the store without any messaging fees.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="/admin/coupons"
            className="px-5 py-2.5 bg-accent text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-accent/90 transition-all flex items-center gap-2 shadow-sm"
          >
            <TicketPercent className="w-4 h-4" />
            <span>Go to Coupons & Discounts</span>
          </Link>
          <Link
            href="/admin"
            className="px-4 py-2.5 border border-border rounded-sm text-xs font-semibold uppercase tracking-wider hover:bg-secondary text-foreground/70 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  )
}