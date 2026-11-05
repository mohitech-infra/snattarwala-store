"use client"

import { Suspense, useEffect, useState, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Crown,
  Gem,
  Sparkles,
  SprayCanIcon as Spray,
  Package,
  Check,
  ArrowRight,
  Filter,
  Layers,
  Heart,
} from "lucide-react"
import { Container } from "@/components/layout/container"
import { ProductCard } from "@/components/product/product-card"
import { getPublicProducts, type PublicProduct } from "@/lib/public-service"

type TabKey = "all" | "golden-series" | "diamond-series" | "luxury-series" | "perfumes" | "for-him" | "for-her" | "unisex"

interface SeriesConfig {
  key: string
  name: string
  eyebrow: string
  description: string
  sizes: string
  startingPrice: string
  icon: any
  cardBorder: string
  badgeBg: string
  badgeText: string
  iconBg: string
}

const SERIES_CONFIGS: Record<string, SeriesConfig> = {
  "golden-series": {
    key: "golden-series",
    name: "Golden Series",
    eyebrow: "Everyday Luxury",
    description: "A polished collection of timeless floral, honeyed amber, and fresh botanical attars crafted for daily elegance.",
    sizes: "12 ml · 24 ml · 55 ml",
    startingPrice: "From ₹300",
    icon: Crown,
    cardBorder: "border-[#d4af37]/60",
    badgeBg: "bg-[#d4af37]/15",
    badgeText: "text-[#997300] dark:text-[#f3d267]",
    iconBg: "bg-[#d4af37]/15 text-[#997300] dark:text-[#f3d267]",
  },
  "diamond-series": {
    key: "diamond-series",
    name: "Diamond Series",
    eyebrow: "Signature Quality",
    description: "Elevated presentation, rich Middle Eastern blends, and high-projection aquatic, vanilla, and dark musk compositions.",
    sizes: "12 ml · 24 ml · 55 ml",
    startingPrice: "From ₹549",
    icon: Gem,
    cardBorder: "border-sky-400/60",
    badgeBg: "bg-sky-500/15",
    badgeText: "text-sky-700 dark:text-sky-300",
    iconBg: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  },
  "luxury-series": {
    key: "luxury-series",
    name: "Luxury Series",
    eyebrow: "The Collector's Edit",
    description: "Our most indulgent extrait de parfum oils featuring aged Cambodian agarwood, royal Assam oud, and rare saffron.",
    sizes: "12 ml · 24 ml · 55 ml",
    startingPrice: "From ₹1,099",
    icon: Sparkles,
    cardBorder: "border-amber-600/60",
    badgeBg: "bg-amber-600/15",
    badgeText: "text-amber-800 dark:text-amber-300",
    iconBg: "bg-amber-600/15 text-amber-700 dark:text-amber-300",
  },
  perfumes: {
    key: "perfumes",
    name: "Perfume Flacons",
    eyebrow: "Artisanal Eau De Parfum",
    description: "Heavy-glass spray flacons formulated at high EDP concentration with long-lasting European and Oriental accords.",
    sizes: "30 ml · 50 ml · 100 ml",
    startingPrice: "From ₹499",
    icon: Spray,
    cardBorder: "border-border/80",
    badgeBg: "bg-accent/15",
    badgeText: "text-accent",
    iconBg: "bg-accent/15 text-accent",
  },
}

function CollectionsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const seriesParam = searchParams.get("series") || searchParams.get("format") || searchParams.get("category")

  const [activeTab, setActiveTab] = useState<TabKey>("all")
  const [products, setProducts] = useState<PublicProduct[]>([])
  const [loading, setLoading] = useState(true)

  // Sync with URL query parameter
  useEffect(() => {
    if (!seriesParam) {
      setActiveTab("all")
      return
    }

    const normalized = seriesParam.toLowerCase().trim()
    if (normalized.includes("gold")) {
      setActiveTab("golden-series")
    } else if (normalized.includes("diamond")) {
      setActiveTab("diamond-series")
    } else if (normalized.includes("lux")) {
      setActiveTab("luxury-series")
    } else if (normalized.includes("perfume")) {
      setActiveTab("perfumes")
    } else if (normalized.includes("him") || normalized.includes("men")) {
      setActiveTab("for-him")
    } else if (normalized.includes("her") || normalized.includes("women")) {
      setActiveTab("for-her")
    } else if (normalized.includes("uni")) {
      setActiveTab("unisex")
    } else {
      setActiveTab("all")
    }
  }, [seriesParam])

  // Fetch all public products
  useEffect(() => {
    let mounted = true
    getPublicProducts().then((data) => {
      if (mounted) {
        setProducts(data)
        setLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  // Partition products by series chosen in admin panel
  const goldenProducts = useMemo(() => {
    return products.filter((p) => p.series === "Golden Series")
  }, [products])

  const diamondProducts = useMemo(() => {
    return products.filter((p) => p.series === "Diamond Series")
  }, [products])

  const luxuryProducts = useMemo(() => {
    return products.filter((p) => p.series === "Luxury Series")
  }, [products])

  const perfumeProducts = useMemo(() => {
    return products.filter((p) => p.category === "Perfumes" || p.series === "Perfumes")
  }, [products])

  const forHimProducts = useMemo(() => {
    return products.filter((p) => p.gender === "Men" || p.gender === "Unisex")
  }, [products])

  const forHerProducts = useMemo(() => {
    return products.filter((p) => p.gender === "Women" || p.gender === "Unisex")
  }, [products])

  const unisexProducts = useMemo(() => {
    return products.filter((p) => p.gender === "Unisex" || !p.gender)
  }, [products])

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab)
    if (tab === "all") {
      router.push("/collections", { scroll: false })
    } else if (tab === "perfumes") {
      router.push("/collections?series=perfumes", { scroll: false })
    } else if (["for-him", "for-her", "unisex"].includes(tab)) {
      router.push(`/collections?category=${tab}`, { scroll: false })
    } else {
      router.push(`/collections?series=${tab}`, { scroll: false })
    }
  }

  const tabs: Array<{ key: TabKey; label: string; count: number; icon?: any }> = [
    { key: "all", label: "All Collections", count: products.length, icon: Layers },
    { key: "golden-series", label: "Golden Series", count: goldenProducts.length, icon: Crown },
    { key: "diamond-series", label: "Diamond Series", count: diamondProducts.length, icon: Gem },
    { key: "luxury-series", label: "Luxury Series", count: luxuryProducts.length, icon: Sparkles },
    { key: "perfumes", label: "Perfume Flacons", count: perfumeProducts.length, icon: Spray },
    { key: "for-him", label: "For Him", count: forHimProducts.length },
    { key: "for-her", label: "For Her", count: forHerProducts.length },
    { key: "unisex", label: "Unisex", count: unisexProducts.length },
  ]

  const renderSeriesSection = (cfg: SeriesConfig, list: PublicProduct[]) => {
    const Icon = cfg.icon
    return (
      <section key={cfg.key} id={cfg.key} className="scroll-mt-28 py-10 border-b border-border/50 last:border-b-0">
        {/* Series Header Card */}
        <div className={`p-6 sm:p-8 rounded-sm bg-card border-2 ${cfg.cardBorder} mb-8 shadow-xs`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] rounded-xs ${cfg.badgeBg} ${cfg.badgeText}`}>
                  <Icon className="w-3.5 h-3.5" />
                  {cfg.eyebrow}
                </span>
                <span className="text-xs text-foreground/50 font-medium">
                  {list.length} {list.length === 1 ? "Fragrance" : "Fragrances"} Available
                </span>
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                {cfg.name}
              </h2>
              <p className="text-xs sm:text-sm text-foreground/75 max-w-2xl leading-relaxed">
                {cfg.description}
              </p>
            </div>

            {/* Quick Pricing Badge */}
            <div className="flex items-center gap-4 border border-border/60 bg-background p-4 rounded-sm shrink-0">
              <Package className="h-5 w-5 text-accent shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-semibold tracking-wider text-foreground/60">
                  Available Sizes
                </p>
                <p className="font-heading font-bold text-sm sm:text-base text-foreground">
                  {cfg.sizes}
                </p>
                <p className="text-xs text-accent font-semibold mt-0.5">
                  {cfg.startingPrice}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {list.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {list.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center border border-dashed border-border rounded-sm bg-secondary/10">
            <p className="text-sm text-foreground/60">New fragrances are currently being blended for this series.</p>
          </div>
        )}
      </section>
    )
  }

  const renderSimpleGrid = (title: string, subtitle: string, list: PublicProduct[]) => {
    return (
      <section className="py-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent mb-2">
            <span className="h-px w-8 bg-accent" />
            Curated Selection
          </div>
          <h2 className="font-heading text-3xl font-bold text-foreground">{title}</h2>
          <p className="text-sm text-foreground/75 mt-1">{subtitle}</p>
        </div>

        {list.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {list.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center border border-dashed border-border rounded-sm bg-secondary/10">
            <p className="text-sm text-foreground/60">No products found for this collection.</p>
          </div>
        )}
      </section>
    )
  }

  return (
    <div className="bg-background min-h-screen text-foreground pb-24">
      {/* Page Hero Header */}
      <section className="relative border-b border-border/70 bg-secondary/20 py-16 md:py-20">
        <Container>
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent">
              <span className="h-px w-8 bg-accent" />
              Signature Archives & Editions
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground">
              Series Collections
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-foreground/75 leading-relaxed font-light">
              Explore every distinctive fragrance line handcrafted at SN Attarwala Mumbai. From accessible everyday floral treasures in the Golden Series, to projection-heavy Diamond editions, and royal Cambodian agarwood extraits in the Luxury Series.
            </p>
          </div>

          {/* Filter Pills / Navigation Tabs */}
          <div className="mt-10 flex flex-wrap gap-2 pt-2 border-t border-border/50">
            {tabs.map((tab) => {
              const TabIcon = tab.icon
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleTabChange(tab.key)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] rounded-sm transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm font-bold"
                      : "bg-background border border-border/80 text-foreground/75 hover:text-foreground hover:border-accent"
                  }`}
                >
                  {TabIcon && <TabIcon className="w-3.5 h-3.5" />}
                  <span>{tab.label}</span>
                  <span
                    className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-secondary text-foreground/60"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>
        </Container>
      </section>

      {/* Main Collections Content */}
      <Container className="pt-8">
        {loading ? (
          <div className="py-24 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-accent border-r-transparent" />
            <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-foreground/60">
              Loading Series Collection...
            </p>
          </div>
        ) : (
          <>
            {/* View: All Collections (Shows each series with its dedicated header & product grid) */}
            {activeTab === "all" && (
              <div className="space-y-12">
                {renderSeriesSection(SERIES_CONFIGS["golden-series"], goldenProducts)}
                {renderSeriesSection(SERIES_CONFIGS["diamond-series"], diamondProducts)}
                {renderSeriesSection(SERIES_CONFIGS["luxury-series"], luxuryProducts)}
                {renderSeriesSection(SERIES_CONFIGS["perfumes"], perfumeProducts)}
              </div>
            )}

            {/* View: Golden Series */}
            {activeTab === "golden-series" && renderSeriesSection(SERIES_CONFIGS["golden-series"], goldenProducts)}

            {/* View: Diamond Series */}
            {activeTab === "diamond-series" && renderSeriesSection(SERIES_CONFIGS["diamond-series"], diamondProducts)}

            {/* View: Luxury Series */}
            {activeTab === "luxury-series" && renderSeriesSection(SERIES_CONFIGS["luxury-series"], luxuryProducts)}

            {/* View: Perfumes */}
            {activeTab === "perfumes" && renderSeriesSection(SERIES_CONFIGS["perfumes"], perfumeProducts)}

            {/* View: Gender Filters */}
            {activeTab === "for-him" && renderSimpleGrid("For Him", "Commanding, masculine fragrances featuring oud, rich leather, woods and marine notes.", forHimProducts)}
            {activeTab === "for-her" && renderSimpleGrid("For Her", "Mesmerizing multi-floral, sweet vanilla and delicate musks tailored for grace.", forHerProducts)}
            {activeTab === "unisex" && renderSimpleGrid("Unisex", "Balanced compositions of spices, ambers and woods that transcend boundaries.", unisexProducts)}

            {/* B2B Wholesale & Custom Bottle Banner */}
            <div className="mt-16 bg-secondary/30 border border-border/80 rounded-sm p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  Custom Bottling & Bulk Supply
                </span>
                <h3 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                  Need Custom Quantities or Wholesale Stock?
                </h3>
                <p className="text-xs sm:text-sm text-foreground/75 max-w-xl leading-relaxed">
                  We supply perfumes, attars, and bulk perfume oils in 12 ml, 24 ml, 55 ml bottles or liter decants with custom branded packaging for boutiques and retailers.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Link
                  href="/wholesale"
                  className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-accent hover:text-black py-3.5 px-6 text-xs font-semibold uppercase tracking-widest rounded-sm transition-colors shadow-xs font-bold"
                >
                  Wholesale Inquiries
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center gap-2 border border-border/80 hover:border-accent text-foreground hover:text-accent py-3.5 px-6 text-xs font-semibold uppercase tracking-widest rounded-sm transition-colors"
                >
                  Full Store Catalog
                </Link>
              </div>
            </div>
          </>
        )}
      </Container>
    </div>
  )
}

export default function CollectionsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen py-32 text-center text-xs uppercase tracking-widest font-medium text-foreground/60">
          Loading Collections...
        </div>
      }
    >
      <CollectionsContent />
    </Suspense>
  )
}
