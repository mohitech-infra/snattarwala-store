"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  ShoppingBag, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  Search, 
  Filter, 
  Code, 
  HelpCircle, 
  ArrowUpRight, 
  FileCode, 
  Sparkles,
  Layers,
  Tag,
  ShieldCheck,
  AlertCircle
} from "lucide-react"
import { GoogleFeedItem, GoogleShoppingAuditSummary, formatGoogleFeedItemXml } from "@/lib/google-shopping-service"

export default function GoogleShoppingAdminPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [summary, setSummary] = useState<GoogleShoppingAuditSummary | null>(null)
  const [items, setItems] = useState<GoogleFeedItem[]>([])
  const [feedUrl, setFeedUrl] = useState("")
  const [copiedFeed, setCopiedFeed] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [selectedPreviewItem, setSelectedPreviewItem] = useState<GoogleFeedItem | null>(null)
  const [copiedXml, setCopiedXml] = useState(false)

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const res = await fetch("/api/admin/google-shopping")
      const data = await res.json()
      if (data.success) {
        setSummary(data.summary)
        setItems(data.items || [])
        setFeedUrl(data.feedUrl || "")
      }
    } catch (err) {
      console.error("Failed to load Google Shopping data:", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCopyFeedUrl = () => {
    if (!feedUrl) return
    navigator.clipboard.writeText(feedUrl)
    setCopiedFeed(true)
    setTimeout(() => setCopiedFeed(false), 2000)
  }

  const handleCopyXmlSnippet = (xml: string) => {
    navigator.clipboard.writeText(xml)
    setCopiedXml(true)
    setTimeout(() => setCopiedXml(false), 2000)
  }

  // Filtered variants
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Status filter
      if (statusFilter !== "ALL" && item.status !== statusFilter) {
        return false
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = item.title.toLowerCase().includes(q)
        const matchSku = item.id.toLowerCase().includes(q)
        const matchSize = item.size.toLowerCase().includes(q)
        const matchCategory = item.category.toLowerCase().includes(q)
        if (!matchTitle && !matchSku && !matchSize && !matchCategory) return false
      }
      return true
    })
  }, [items, statusFilter, searchQuery])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-accent" />
        <p className="text-sm font-medium text-foreground/70 uppercase tracking-widest">
          Auditing Google Shopping Products & Feeds...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner & Title */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-accent bg-accent/10 px-2.5 py-0.5 rounded-full border border-accent/20">
              Google Merchant Center
            </span>
            <span className="text-xs text-foreground/60">
              RSS 2.0 / Dynamic XML Feed
            </span>
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Google Shopping Readiness</h1>
          <p className="text-sm text-foreground/70 mt-1 max-w-2xl">
            Monitor Google Merchant Center compliance for every sellable perfume variant, audit identifiers, prices, and manage your dynamic XML feed.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg border border-border/80 hover:bg-secondary/60 text-foreground transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Audit
          </button>

          <a
            href="/feeds/google-shopping.xml"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg border border-border/80 hover:bg-secondary/60 text-foreground transition-colors"
          >
            <FileCode className="w-3.5 h-3.5 text-accent" />
            View Live XML
            <ArrowUpRight className="w-3 h-3 text-foreground/50" />
          </a>

          <button
            onClick={handleCopyFeedUrl}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity shadow-sm"
          >
            {copiedFeed ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Feed URL Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy Feed URL
              </>
            )}
          </button>
        </div>
      </div>

      {/* Feed Live Endpoint Card */}
      <div className="p-4 rounded-xl border border-accent/30 bg-accent/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider font-semibold text-accent flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Active Feed Endpoint
          </p>
          <code className="text-xs md:text-sm font-mono text-foreground font-semibold break-all">
            {feedUrl || "https://snattarwala.in/feeds/google-shopping.xml"}
          </code>
        </div>
        <div className="text-xs text-foreground/70 shrink-0">
          Last Synced: <span className="font-semibold text-foreground">{summary?.lastGenerated ? new Date(summary.lastGenerated).toLocaleTimeString() : "Just now"}</span>
        </div>
      </div>

      {/* Audit Summary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Metric 1 */}
        <div className="p-4 rounded-xl border border-border/60 bg-card/60 space-y-1">
          <p className="text-xs uppercase tracking-wider font-medium text-foreground/60">Active Products</p>
          <p className="text-2xl font-bold font-heading">{summary?.totalActiveProducts ?? 0}</p>
          <p className="text-[11px] text-foreground/50">Parent Fragrances</p>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-xl border border-border/60 bg-card/60 space-y-1">
          <p className="text-xs uppercase tracking-wider font-medium text-foreground/60">Active Variants</p>
          <p className="text-2xl font-bold font-heading">{summary?.totalActiveVariants ?? 0}</p>
          <p className="text-[11px] text-foreground/50">Sellable Feed Items</p>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">Ready</p>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold font-heading text-emerald-600 dark:text-emerald-400">
            {summary?.readyCount ?? 0}
            <span className="text-xs font-normal ml-1 text-emerald-600/80">({summary?.readyPercent ?? 0}%)</span>
          </p>
          <p className="text-[11px] text-emerald-600/70">Meets GMC Specs</p>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider font-semibold text-amber-600 dark:text-amber-400">Missing SKU</p>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold font-heading text-amber-600 dark:text-amber-400">{summary?.missingSkuCount ?? 0}</p>
          <p className="text-[11px] text-amber-600/70">Auto-fallback used</p>
        </div>

        {/* Metric 5 */}
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider font-semibold text-rose-600 dark:text-rose-400">Invalid Price</p>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold font-heading text-rose-600 dark:text-rose-400">{summary?.invalidPriceCount ?? 0}</p>
          <p className="text-[11px] text-rose-600/70">Price &le; 0 or missing</p>
        </div>

        {/* Metric 6 */}
        <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider font-semibold text-blue-600 dark:text-blue-400">Out of Stock</p>
            <AlertCircle className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold font-heading text-blue-600 dark:text-blue-400">{summary?.outOfStockCount ?? 0}</p>
          <p className="text-[11px] text-blue-600/70">Marked out_of_stock</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-secondary/30 rounded-lg border border-border/60">
          {[
            { id: "ALL", label: `All (${items.length})` },
            { id: "Ready for Google", label: `Ready (${items.filter(i => i.status === "Ready for Google").length})` },
            { id: "Missing SKU", label: `Missing SKU (${items.filter(i => i.status === "Missing SKU").length})` },
            { id: "Invalid Price", label: `Invalid Price (${items.filter(i => i.status === "Invalid Price").length})` },
            { id: "Out of Stock", label: `Out of Stock (${items.filter(i => i.status === "Out of Stock").length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === tab.id
                  ? "bg-accent text-accent-foreground font-semibold shadow-sm"
                  : "text-foreground/70 hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50" />
          <input
            type="text"
            placeholder="Search variant, title, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      {/* Product Variants Audit Table */}
      <div className="border border-border/60 rounded-xl overflow-hidden bg-card/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/40 text-foreground font-semibold uppercase tracking-wider text-[11px] border-b border-border/60">
              <tr>
                <th className="py-3 px-4">Variant / Parent</th>
                <th className="py-3 px-4">SKU (Feed ID)</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Selling Price</th>
                <th className="py-3 px-4">Sale Price</th>
                <th className="py-3 px-4">Availability</th>
                <th className="py-3 px-4">Google Status</th>
                <th className="py-3 px-4">Diagnostics</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-foreground/50">
                    No variants match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const isReady = item.status === "Ready for Google"
                  const isOutOfStock = item.status === "Out of Stock"
                  const isMissingSku = item.status === "Missing SKU"
                  const isInvalidPrice = item.status === "Invalid Price"

                  return (
                    <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                      {/* Variant Title & Parent */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.imageLink}
                            alt={item.title}
                            className="w-10 h-10 object-cover rounded-md border border-border/60 shrink-0 bg-secondary/30"
                            onError={(e) => {
                              // fallback
                              (e.target as HTMLImageElement).src = "/placeholder.jpg"
                            }}
                          />
                          <div>
                            <p className="font-semibold text-foreground line-clamp-1">{item.title}</p>
                            <p className="text-[11px] text-foreground/60">{item.parentName} &bull; {item.category}</p>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-4 font-mono font-medium text-foreground/90">
                        {item.id}
                      </td>

                      {/* Size */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-secondary/50 font-medium">
                          {item.size}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 font-semibold text-foreground">
                        ₹{item.price.toLocaleString("en-IN")}
                      </td>

                      {/* Sale Price */}
                      <td className="py-3 px-4 text-foreground/70">
                        {item.salePrice ? (
                          <span className="text-emerald-600 font-semibold">
                            ₹{item.salePrice.toLocaleString("en-IN")}
                          </span>
                        ) : (
                          <span className="text-foreground/40">&mdash;</span>
                        )}
                      </td>

                      {/* Availability */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          item.availability === "in_stock" 
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        }`}>
                          {item.availability === "in_stock" ? "In Stock" : "Out of Stock"}
                        </span>
                      </td>

                      {/* Google Status */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          isReady 
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            : isOutOfStock
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                              : isMissingSku
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                        }`}>
                          {isReady && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                          {isOutOfStock && <AlertCircle className="w-3 h-3 text-blue-500" />}
                          {isMissingSku && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                          {isInvalidPrice && <XCircle className="w-3 h-3 text-rose-500" />}
                          {item.status}
                        </span>
                      </td>

                      {/* Diagnostics */}
                      <td className="py-3 px-4">
                        {item.validationErrors.length > 0 ? (
                          <div className="space-y-0.5">
                            {item.validationErrors.map((err, i) => (
                              <p key={i} className="text-[11px] text-amber-600 dark:text-amber-400">
                                &bull; {err}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Validated
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => setSelectedPreviewItem(item)}
                            title="Preview Google XML snippet"
                            className="p-1.5 rounded-md hover:bg-secondary/80 text-foreground/70 hover:text-accent transition-colors border border-border/50"
                          >
                            <Code className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            title="Open variant deep-link in new tab"
                            className="p-1.5 rounded-md hover:bg-secondary/80 text-foreground/70 hover:text-accent transition-colors border border-border/50"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Step-by-Step Google Merchant Center Setup Guide */}
      <div className="border border-border/60 rounded-xl bg-card/60 p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold">Google Merchant Center Integration Guide</h2>
            <p className="text-xs text-foreground/60">
              Follow these verified steps to publish your perfume catalog and launch Google Shopping campaigns in India.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs text-foreground/80 leading-relaxed">
          <div className="p-4 rounded-lg border border-border/60 bg-secondary/15 space-y-2">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <span className="w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] flex items-center justify-center font-bold">1</span>
              Claim & Verify Domain
            </div>
            <p>
              In Google Merchant Center (<a href="https://merchants.google.com" target="_blank" rel="noreferrer" className="text-accent underline">merchants.google.com</a>), navigate to <strong>Settings &gt; Business Information &gt; Website</strong>. Enter <code className="font-mono font-semibold">https://snattarwala.in</code> and verify ownership via HTML tag or Google Search Console.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border/60 bg-secondary/15 space-y-2">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <span className="w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] flex items-center justify-center font-bold">2</span>
              Configure India Shipping in GMC
            </div>
            <p>
              Go to <strong>Settings &gt; Shipping and Returns</strong>. Add a shipping service for India: Currency <strong>INR</strong>, Free shipping for orders &ge; ₹999, flat ₹99 for orders under ₹999. Transit time: 1-2 days (Mumbai), 3-5 days (Pan-India). This matches your website policy.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border/60 bg-secondary/15 space-y-2">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <span className="w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] flex items-center justify-center font-bold">3</span>
              Add Primary Scheduled Feed
            </div>
            <p>
              In GMC, go to <strong>Products &gt; Feeds &gt; Primary Feeds &gt; Add Feed</strong>. Select target country <strong>India</strong> and language <strong>English</strong>. Choose <strong>Scheduled fetch</strong>, set fetch time (e.g. 05:00 AM IST daily), and paste your live feed URL.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border/60 bg-secondary/15 space-y-2">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <span className="w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] flex items-center justify-center font-bold">4</span>
              Identifier Exists Rule (Crucial)
            </div>
            <p>
              Handcrafted attars and bespoke perfumes do not have manufacturer GTIN/EAN barcodes. The feed automatically exports <code className="font-mono font-semibold">&lt;g:identifier_exists&gt;no&lt;/g:identifier_exists&gt;</code>. This prevents false GMC GTIN warnings and enables 100% compliant listing.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border/60 bg-secondary/15 space-y-2">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <span className="w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] flex items-center justify-center font-bold">5</span>
              Variant Deep-Linking
            </div>
            <p>
              Each bottle size (12ml, 24ml, 50ml, 100ml) links to a deep-link URL (e.g. <code className="font-mono font-semibold">?variant=SNA-...</code>). When Google's crawler visits, it inspects the exact preselected price, stock, and Schema.org JSON-LD matching the feed.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border/60 bg-secondary/15 space-y-2">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <span className="w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] flex items-center justify-center font-bold">6</span>
              Approval Review Process
            </div>
            <p>
              Once your feed is fetched, Google Merchant Center conducts an initial automated review over <strong>24 to 72 hours</strong>. Feed items will show as "Pending" in GMC until approved. Never promise instant live ads before GMC completes this verification.
            </p>
          </div>
        </div>
      </div>

      {/* XML Snippet Preview Modal */}
      {selectedPreviewItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-border/60 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-base">Google Feed XML Snippet</h3>
                <p className="text-xs text-foreground/60">{selectedPreviewItem.title} ({selectedPreviewItem.id})</p>
              </div>
              <button
                onClick={() => setSelectedPreviewItem(null)}
                className="p-1 rounded-md hover:bg-secondary text-foreground/60 hover:text-foreground"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs bg-secondary/20">
              <pre className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {formatGoogleFeedItemXml(selectedPreviewItem)}
              </pre>
            </div>

            <div className="p-4 border-t border-border/60 flex items-center justify-between bg-card">
              <p className="text-[11px] text-foreground/50">
                RSS 2.0 item node adhering to Google Merchant Center product specification.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyXmlSnippet(formatGoogleFeedItemXml(selectedPreviewItem))}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold uppercase tracking-wider hover:opacity-90"
                >
                  {copiedXml ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy XML
                    </>
                  )}
                </button>
                <button
                  onClick={() => setSelectedPreviewItem(null)}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold uppercase tracking-wider hover:bg-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

