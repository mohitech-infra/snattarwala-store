"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Check,
  Crown,
  Gem,
  MessageCircle,
  Package,
  Sparkles,
  type LucideIcon,
} from "lucide-react"
import { Container } from "@/components/layout/container"
import { getWholesaleRates, DEFAULT_WHOLESALE_RATES, type WholesaleRates } from "@/lib/wholesale-rates-service"

type SeriesView = "attar" | "perfume"

interface SeriesMeta {
  icon: LucideIcon
  cardBorder: string
  badgeBg: string
  badgeText: string
  iconBg: string
}

const SERIES_META: Record<string, SeriesMeta> = {
  "Golden Series": {
    icon: Crown,
    cardBorder: "border-[#d4af37]/60 hover:border-[#d4af37]",
    badgeBg: "bg-[#d4af37]/15",
    badgeText: "text-[#997300] dark:text-[#f3d267]",
    iconBg: "bg-[#d4af37]/15 text-[#997300] dark:text-[#f3d267]",
  },
  "Diamond Series": {
    icon: Gem,
    cardBorder: "border-sky-400/60 hover:border-sky-500",
    badgeBg: "bg-sky-500/15",
    badgeText: "text-sky-700 dark:text-sky-300",
    iconBg: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  },
  "Luxury Series": {
    icon: Sparkles,
    cardBorder: "border-amber-600/60 hover:border-amber-600",
    badgeBg: "bg-amber-600/15",
    badgeText: "text-amber-800 dark:text-amber-300",
    iconBg: "bg-amber-600/15 text-amber-700 dark:text-amber-300",
  },
}

const PERFUME_SIZES = [
  {
    size: "30 ml",
    tagline: "Pocket Luxury",
    price: "From ₹499",
    desc: "Compact, travel-friendly artisanal spray flacon designed for effortless daily carry and quick touch-ups.",
    features: ["Pocket & Travel Friendly", "Eau De Parfum Concentration", "Premium Mist Atomizer"],
  },
  {
    size: "50 ml",
    tagline: "Classic Flacon",
    price: "From ₹899",
    desc: "The quintessential size for your signature fragrance wardrobe. Balanced volume, projection, and sillage.",
    features: ["Signature Everyday Size", "Lasts 60-90 Days of Daily Wear", "Luxury Heavy-Glass Flacon"],
  },
  {
    size: "100 ml",
    tagline: "Grand Edition",
    price: "From ₹1,499",
    desc: "Generous flacon for your signature statement scent with rich, all-day projection and luxury gift packaging.",
    features: ["Maximum Value & Longevity", "Collector Presentation Box", "All-Day Sillage & Aura"],
  },
]

function formatPrice(price: number) {
  return `₹${price.toLocaleString("en-IN")}`
}

function getWhatsAppLink(message: string) {
  const number = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919082377314").replace(/\D/g, "")
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

export function AttarSeriesSection() {
  const [activeView, setActiveView] = useState<SeriesView>("attar")
  const [rates, setRates] = useState<WholesaleRates>(DEFAULT_WHOLESALE_RATES)

  useEffect(() => {
    let mounted = true
    getWholesaleRates().then((data) => {
      if (mounted && data?.attarSeries && Array.isArray(data.attarSeries) && data.attarSeries.length > 0) {
        setRates(data)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  const seriesList =
    rates?.attarSeries && Array.isArray(rates.attarSeries) && rates.attarSeries.length > 0
      ? rates.attarSeries
      : DEFAULT_WHOLESALE_RATES.attarSeries

  return (
    <section
      id="attar-series"
      aria-labelledby="series-heading"
      className="relative scroll-mt-20 py-16 md:py-24 bg-secondary/20 border-b border-border/60 text-foreground"
    >
      {/* Anchor for backward compatibility with #wholesale links */}
      <span id="wholesale" className="absolute -top-24" />

      <Container className="relative z-10">
        {/* Section Header */}
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end mb-12">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent">
              <span className="h-px w-8 bg-accent" />
              Signature Collections
              <span className="h-px w-8 bg-accent" />
            </div>
            <h2
              id="series-heading"
              className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold tracking-tight text-foreground"
            >
              Curated Fragrance Editions
            </h2>
            <p className="mt-3 max-w-xl text-sm md:text-base leading-relaxed text-foreground/75 font-light">
              Experience the ancient art of Mumbai perfumery through three distinctive attar series, handcrafted without alcohol, or explore our artisanal Eau De Parfum sprays.
            </p>
          </div>

          {/* Quick Available Formats */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="border border-border/80 bg-background p-5 rounded-sm shadow-xs">
              <Package className="mb-2 h-5 w-5 text-accent" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground/60">
                Attar Bottles
              </p>
              <p className="mt-1 font-heading text-xl sm:text-2xl font-bold text-foreground">
                12 ml · 24 ml · 55 ml
              </p>
              <p className="text-xs text-foreground/55 mt-1">100% Pure Non-Alcoholic Oils</p>
            </div>
            <div className="border border-border/80 bg-background p-5 rounded-sm shadow-xs">
              <Sparkles className="mb-2 h-5 w-5 text-accent" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground/60">
                Perfume Sprays
              </p>
              <p className="mt-1 font-heading text-xl sm:text-2xl font-bold text-foreground">
                30 ml · 50 ml · 100 ml
              </p>
              <p className="text-xs text-foreground/55 mt-1">Artisanal Eau De Parfum</p>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-y border-border/70 py-4 mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/70">
              Browse by Fragrance Format
            </p>
            <p className="text-xs text-foreground/55 mt-0.5">
              Pure concentrated perfume oils or spray Eau De Parfum flacons
            </p>
          </div>

          <div className="flex w-full sm:w-auto rounded-sm border border-border/80 bg-background p-1 shadow-xs">
            <button
              type="button"
              aria-pressed={activeView === "attar"}
              onClick={() => setActiveView("attar")}
              className={`flex-1 sm:flex-none px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] rounded-sm transition-all cursor-pointer ${
                activeView === "attar"
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "text-foreground/70 hover:text-foreground hover:bg-secondary/40"
              }`}
            >
              Attar Series
            </button>
            <button
              type="button"
              aria-pressed={activeView === "perfume"}
              onClick={() => setActiveView("perfume")}
              className={`flex-1 sm:flex-none px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] rounded-sm transition-all cursor-pointer ${
                activeView === "perfume"
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "text-foreground/70 hover:text-foreground hover:bg-secondary/40"
              }`}
            >
              Perfume Flacons
            </button>
          </div>
        </div>

        {/* Attar Series Content - Guaranteed visible immediately without opacity-0 bugs */}
        {activeView === "attar" ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {seriesList.map((series) => {
              const meta = SERIES_META[series.name] ?? {
                icon: Sparkles,
                cardBorder: "border-border/80 hover:border-accent",
                badgeBg: "bg-secondary/50",
                badgeText: "text-accent",
                iconBg: "bg-secondary/50 text-accent",
              }
              const Icon = meta.icon
              const seriesSlug = series.name.toLowerCase().replace(/\s+/g, "-")
              const orderLink = getWhatsAppLink(
                `Hello SN AttarWala, I would like to order from the ${series.name}. Please share available fragrances for 12 ml, 24 ml, and 55 ml sizes.`
              )

              return (
                <article
                  key={series.name}
                  className={`group flex flex-col justify-between bg-card border-2 rounded-sm p-7 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${meta.cardBorder}`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span
                          className={`inline-block px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] rounded-xs ${meta.badgeBg} ${meta.badgeText}`}
                        >
                          {series.eyebrow}
                        </span>
                        <h3 className="mt-3 text-2xl font-heading font-bold text-foreground">
                          {series.name}
                        </h3>
                      </div>
                      <div className={`rounded-full p-3 border border-border/50 ${meta.iconBg}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>

                    {/* Description */}
                    <p className="mt-4 text-xs sm:text-sm leading-relaxed text-foreground/75 min-h-[44px]">
                      {series.description}
                    </p>

                    {/* Price Breakdown */}
                    <div className="mt-6 divide-y divide-border/50 border-y border-border/50">
                      {series.prices.map((item) => (
                        <div key={item.size} className="flex items-center justify-between py-3.5">
                          <span className="flex items-center gap-2 text-xs sm:text-sm text-foreground/85 font-medium">
                            <Check className="h-4 w-4 text-accent shrink-0" />
                            {item.size} Bottle
                          </span>
                          <span className="font-heading text-lg font-bold text-foreground">
                            {formatPrice(item.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-7 pt-2 space-y-2.5">
                    <Link
                      href={`/collections?series=${seriesSlug}`}
                      className="inline-flex w-full items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-accent hover:text-black py-3.5 px-4 text-xs font-semibold uppercase tracking-widest rounded-sm transition-colors shadow-xs font-bold"
                    >
                      Explore Series Collection
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <a
                      href={orderLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 border border-border/80 hover:border-[#25D366] text-foreground/80 hover:text-[#25D366] py-2.5 px-4 text-xs font-semibold uppercase tracking-widest rounded-sm transition-colors"
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
                      Inquire on WhatsApp
                    </a>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          /* Perfume Flacons View */
          <div className="grid gap-6 md:grid-cols-3">
            {PERFUME_SIZES.map((item) => {
              const perfumeLink = getWhatsAppLink(
                `Hello SN AttarWala, I would like to explore your ${item.size} spray perfumes collection. Please share available fragrance options.`
              )

              return (
                <article
                  key={item.size}
                  className="flex flex-col justify-between bg-card border-2 border-border/80 hover:border-accent/80 rounded-sm p-7 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="inline-block px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] rounded-xs bg-accent/15 text-accent font-bold">
                        {item.tagline}
                      </span>
                      <span className="font-heading font-bold text-base text-foreground">
                        {item.price}
                      </span>
                    </div>

                    <p className="mt-4 font-heading text-4xl sm:text-5xl font-bold text-foreground">
                      {item.size}
                    </p>
                    <p className="mt-3 text-xs sm:text-sm leading-relaxed text-foreground/75">
                      {item.desc}
                    </p>

                    <div className="mt-6 space-y-2 border-t border-border/50 pt-4 text-xs text-foreground/70">
                      {item.features.map((feat, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 text-accent shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-7 pt-2 space-y-2.5">
                    <Link
                      href="/collections?series=perfumes"
                      className="inline-flex w-full items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-accent hover:text-black py-3.5 px-4 text-xs font-semibold uppercase tracking-widest rounded-sm transition-colors shadow-xs font-bold"
                    >
                      Explore Series Collection
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <a
                      href={perfumeLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 border border-border/80 hover:border-[#25D366] text-foreground/80 hover:text-[#25D366] py-2.5 px-4 text-xs font-semibold uppercase tracking-widest rounded-sm transition-colors"
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
                      Inquire on WhatsApp
                    </a>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* B2B Wholesale Portal Banner */}
        <div className="mt-12 bg-background border border-border/80 rounded-sm p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent mb-1.5 font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              For Boutiques, Retail Stockists & Corporate Gifting
            </div>
            <h3 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
              Looking for Wholesale & Bulk Supply?
            </h3>
            <p className="text-xs sm:text-sm text-foreground/75 mt-1 max-w-xl leading-relaxed">
              We supply retail stockists with authentic manufacturer pricing, low minimum orders (from 50 units), private labeling, and insured pan-India delivery.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/wholesale"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-accent hover:text-black py-3.5 px-6 text-xs font-semibold uppercase tracking-widest rounded-sm transition-colors shadow-xs font-bold"
            >
              Wholesale Portal & Form
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}

export const WholesaleSection = AttarSeriesSection
