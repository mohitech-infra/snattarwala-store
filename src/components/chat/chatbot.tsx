"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { 
  Bot, 
  X, 
  Send, 
  User as UserIcon, 
  Loader2, 
  Sparkles, 
  ShoppingBag, 
  Maximize2, 
  Minimize2, 
  Check, 
  ArrowDown, 
  ExternalLink, 
  Star, 
  MessageSquare, 
  Flame,
  ArrowRight,
  Layers,
  CheckCircle2,
  Boxes,
  AlertTriangle,
  Truck,
  DollarSign,
  Lightbulb,
  TrendingUp,
  Users
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useChat, type Message } from "ai/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCart } from "@/hooks/use-cart"

interface CuratedProduct {
  id: string
  name: string
  brand?: string
  category?: string
  price: number
  compareAtPrice?: number | null
  imageUrl: string
  slug: string
  description?: string
  notes?: {
    top?: string[]
    middle?: string[]
    base?: string[]
  }
  fragranceFamily?: string | null
  longevity?: string
  rating?: number
  sizes?: string[]
}

const CUSTOMER_QUICK_PROMPTS = [
  "Show best Oudh attars for evening",
  "Recommend long-lasting luxury perfumes",
  "Show exotic Bakhoor incense for home",
  "What is the best scent for a wedding gift?",
  "Taif Rose vs Cambodian Oud difference?",
  "Do you offer Cash on Delivery (COD)?"
]

const ADMIN_QUICK_PROMPTS = [
  "How do I add size variants & prices?",
  "How do I upload category photos?",
  "Give me ideas to increase store revenue & AOV",
  "How do I process pending orders & invoices?",
  "How do I manage wholesale B2B inquiries?",
  "What is my current store inventory & order status?"
]

function renderFormattedMessage(text: string) {
  if (!text) return null
  const lines = text.split("\n")

  return (
    <div className="space-y-1.5">
      {lines.map((line, lineIdx) => {
        if (!line.trim()) {
          return <div key={lineIdx} className="h-1" />
        }

        const isBullet = line.trim().startsWith("• ") || line.trim().startsWith("- ") || line.trim().startsWith("* ")
        const cleanLine = isBullet ? line.trim().replace(/^[•\-\*]\s*/, "") : line

        const tokens = cleanLine.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g)

        const renderedLine = tokens.map((token, tokIdx) => {
          const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
          if (linkMatch) {
            const [, title, url] = linkMatch
            return (
              <Link
                key={tokIdx}
                href={url}
                className="inline-flex items-center gap-0.5 text-accent hover:underline font-semibold bg-accent/10 px-1 py-0.5 rounded transition-colors"
              >
                <span>{title}</span>
                <ExternalLink className="w-2.5 h-2.5 ml-0.5 inline opacity-70" />
              </Link>
            )
          }

          const boldMatch = token.match(/^\*\*([^*]+)\*\*$/)
          if (boldMatch) {
            return (
              <strong key={tokIdx} className="font-bold text-foreground">
                {boldMatch[1]}
              </strong>
            )
          }

          return <span key={tokIdx}>{token}</span>
        })

        if (isBullet) {
          return (
            <div key={lineIdx} className="flex items-start gap-1.5 pl-1">
              <span className="text-accent font-bold mt-0.5 shrink-0">•</span>
              <div className="flex-1">{renderedLine}</div>
            </div>
          );
        }

        return <div key={lineIdx}>{renderedLine}</div>
      })}
    </div>
  )
}

export function Chatbot() {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith("/admin") ?? false

  // Remove the floating AI Copilot button on all admin pages.
  // The Admin panel has its dedicated, live AI Advisor in the header and sidebar.
  if (isAdmin) {
    return null
  }

  return <ChatbotInner isAdmin={false} />
}

function ChatbotInner({ isAdmin }: { isAdmin: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [mobileTab, setMobileTab] = useState<"chat" | "products">("chat")
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [addedProductIds, setAddedProductIds] = useState<Record<string, boolean>>({})
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({})
  const [isScrolledUp, setIsScrolledUp] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)

  const { addItem, setIsCartOpen, cartCount, cartTotal } = useCart()

  const customerInitialMessages: Message[] = [
    {
      id: "welcome-msg",
      role: "assistant",
      content: "Welcome to SN AttarWala! I am your personal AI fragrance expert and sommelier. Ask me anything about our pure attars, artisanal EDP perfumes, or exotic bakhoors, and I can curate a personalized boutique collection for you right on screen."
    }
  ]

  const adminInitialMessages: Message[] = [
    {
      id: "admin-welcome-msg",
      role: "assistant",
      content: "Salam Admin! I am your **SN AttarWala Admin AI Co-Pilot & Business Advisor**.\n\nI can help you navigate and master the admin panel:\n• Adding fragrances with **multi-size variants & prices** (3ml, 6ml, 12ml)\n• Uploading and managing **category cover photos**\n• Processing **orders & printing tax invoices**\n• Managing **wholesale B2B inquiries** & tiered bulk pricing\n• Strategic tips for **increasing store revenue & AOV**\n\nWhat would you like to explore or do today?"
    }
  ]

  const { messages, input, setInput, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    body: {
      mode: isAdmin ? "admin" : "customer"
    },
    initialMessages: isAdmin ? adminInitialMessages : customerInitialMessages
  })

  // Extract all recommended products across all messages
  const recommendedProducts = useMemo<CuratedProduct[]>(() => {
    const list: CuratedProduct[] = []
    const seenIds = new Set<string>()

    for (const msg of messages) {
      if (msg.toolInvocations && msg.toolInvocations.length > 0) {
        for (const t of msg.toolInvocations) {
          if (t.toolName === "searchProducts" && "result" in t && (t as any).result?.products) {
            for (const p of (t as any).result.products) {
              if (!seenIds.has(p.id)) {
                seenIds.add(p.id)
                list.push(p)
              }
            }
          }
        }
      }
    }

    // If no products returned yet by tools
    if (list.length === 0) {
      return []
    }

    return list
  }, [messages])

  // Has the customer received AI recommended products during the session?
  const hasLiveRecommendations = useMemo(() => {
    return messages.some((m) =>
      m.toolInvocations?.some((t) => t.toolName === "searchProducts" && "result" in t)
    )
  }, [messages])

  // Filter products by active category
  const filteredProducts = useMemo(() => {
    if (selectedCategory === "All") return recommendedProducts
    return recommendedProducts.filter((p) => p.category === selectedCategory)
  }, [recommendedProducts, selectedCategory])

  // Check scroll position to avoid forcibly scrolling user if they scrolled up
  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current
    if (!el) return
    const threshold = 120
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    const nearBottom = distanceFromBottom < threshold
    isNearBottomRef.current = nearBottom
    setIsScrolledUp(!nearBottom)
  }, [])

  // Auto-scroll when new messages arrive only if user was already at bottom
  useEffect(() => {
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isLoading])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    isNearBottomRef.current = true
    setIsScrolledUp(false)
  }

  // Handle form submission and detect product-seeking intent for full-screen takeover
  const handleChatSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const text = input.trim().toLowerCase()
    
    // Product-seeking keywords triggers full-screen shopping takeover
    const productKeywords = [
      "product", "perfume", "attar", "bakhoor", "oud", "price", 
      "buy", "recommend", "show me", "collection", "shop", "scent", 
      "fragrance", "options", "browse", "catalog", "order", "cost"
    ]
    const wantsProducts = productKeywords.some((kw) => text.includes(kw))

    if (wantsProducts && !isFullScreen) {
      setIsFullScreen(true)
      setMobileTab("products")
    }

    handleSubmit(e)
  }

  // Auto-takeover when searchProducts tool successfully returns items
  useEffect(() => {
    if (hasLiveRecommendations && !isFullScreen) {
      setIsFullScreen(true)
    }
  }, [hasLiveRecommendations, isFullScreen])

  const handleAddProductToBag = (product: CuratedProduct) => {
    const size = selectedSizes[product.id] || product.sizes?.[0] || "Standard"
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity: 1,
      size
    })

    setAddedProductIds((prev) => ({ ...prev, [product.id]: true }))
    setTimeout(() => {
      setAddedProductIds((prev) => ({ ...prev, [product.id]: false }))
    }, 2000)
  }

  const handleSelectPrompt = (prompt: string) => {
    setInput(prompt)
    if (!isFullScreen) {
      setIsFullScreen(true)
      setMobileTab("products")
    }
  }

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => {
          setIsOpen(true)
        }}
        className={`fixed bottom-24 md:bottom-6 right-6 z-50 p-3.5 md:p-4 bg-gradient-to-r from-accent via-[#e5c158] to-[#D4AF37] text-slate-950 rounded-full shadow-[0_0_25px_rgba(212,175,55,0.45)] hover:shadow-[0_0_35px_rgba(212,175,55,0.8)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center group ${
          isOpen ? "hidden" : "flex"
        }`}
        aria-label="Open AI Fragrance Expert & Shopping Boutique"
        title="Open Fragrance Concierge"
      >
        <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-slate-950 group-hover:rotate-12 transition-transform duration-300" />
        <span className="hidden sm:inline-block ml-2 text-xs font-bold tracking-wider uppercase text-slate-950 pr-1">
          {isAdmin ? "Admin AI Co-Pilot" : "Ask Fragrance AI"}
        </span>
      </button>

      {/* Main Chatbot Window / Full-Screen Boutique */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            data-lenis-prevent
            className={`fixed z-[100] transition-all duration-300 flex flex-col overflow-hidden text-foreground ${
              isFullScreen
                ? "inset-0 w-screen h-[100dvh] bg-background/98 md:bg-background/95 backdrop-blur-3xl shadow-2xl rounded-none"
                : "inset-0 md:inset-auto md:bottom-20 md:right-6 w-full md:w-[460px] h-[100dvh] md:h-[650px] md:max-h-[85vh] bg-card/95 backdrop-blur-2xl border-0 md:border md:border-accent/30 shadow-2xl rounded-none md:rounded-2xl"
            }`}
            style={{ overscrollBehavior: "contain" }}
          >
            {/* Top Global Bar */}
            <div className="flex items-center justify-between px-4 md:px-6 py-3.5 border-b border-border/70 bg-card/80 backdrop-blur-md shrink-0 select-none">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-accent/30 via-accent/15 to-transparent border border-accent/40 flex items-center justify-center shadow-inner">
                  <Bot className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-bold text-sm tracking-wide text-foreground">
                      {isAdmin ? "SN AttarWala Admin Co-Pilot" : "SN AttarWala AI"}
                    </h3>
                    <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-accent/15 text-accent border border-accent/30">
                      <Sparkles className="w-2.5 h-2.5" /> {isAdmin ? "Operations Advisor" : "Boutique Concierge"}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{isAdmin ? "Live Store Intelligence & Guide" : "Real-time Olfactory Sommelier"}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                {/* Cart Preview Button or Admin Orders Link */}
                {isAdmin ? (
                  <Link
                    href="/admin/orders"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-secondary hover:bg-accent/15 border border-border hover:border-accent/40 text-xs font-semibold transition-colors"
                    title="View Store Orders"
                  >
                    <Truck className="w-3.5 h-3.5 text-accent" />
                    <span className="font-bold text-foreground text-[11px]">Orders</span>
                  </Link>
                ) : (
                  <button
                    onClick={() => setIsCartOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-secondary hover:bg-accent/10 border border-border hover:border-accent/40 text-xs font-semibold transition-colors"
                    title="View your shopping bag"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-accent" />
                    <span className="font-bold text-foreground text-[11px]">{cartCount}</span>
                  </button>
                )}

                {/* Full-Screen Toggle */}
                <button
                  onClick={() => {
                    setIsFullScreen((prev) => !prev)
                    if (!isFullScreen) setMobileTab("products")
                  }}
                  className="p-2 rounded-full hover:bg-secondary text-foreground/70 hover:text-foreground transition-colors border border-border/60"
                  title={isFullScreen ? "Switch to Floating Chat" : (isAdmin ? "Takeover Fullscreen Operations Hub" : "Takeover Fullscreen Shopping Experience")}
                  aria-label="Toggle Fullscreen"
                >
                  {isFullScreen ? (
                    <Minimize2 className="w-4 h-4 text-accent" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>

                {/* Close Button */}
                <button
                  onClick={() => {
                    setIsOpen(false)
                    setIsFullScreen(false)
                  }}
                  className="p-2 rounded-full hover:bg-rose-500/10 text-foreground/70 hover:text-rose-500 transition-colors border border-border/60"
                  title="Close Assistant"
                  aria-label="Close Chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mobile Tab Switcher (Visible on mobile screen when in full screen) */}
            {isFullScreen && (
              <div className="flex md:hidden border-b border-border/60 bg-card/60 shrink-0">
                <button
                  onClick={() => setMobileTab("chat")}
                  className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-colors ${
                    mobileTab === "chat"
                      ? "border-accent text-accent bg-accent/5"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{isAdmin ? "AI Co-Pilot" : "AI Sommelier"}</span>
                </button>
                <button
                  onClick={() => setMobileTab("products")}
                  className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-colors ${
                    mobileTab === "products"
                      ? "border-accent text-accent bg-accent/5"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isAdmin ? (
                    <>
                      <Boxes className="w-3.5 h-3.5 text-accent" />
                      <span>Operations Hub</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Boutique Products ({recommendedProducts.length})</span>
                      {hasLiveRecommendations && (
                        <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                      )}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Content Body */}
            <div className="flex-1 flex overflow-hidden min-h-0 relative">
              
              {/* ============================================================== */}
              {/* CHAT PANE (Always visible on Desktop; switchable on Mobile)    */}
              {/* ============================================================== */}
              <div
                className={`flex flex-col h-full overflow-hidden transition-all duration-300 ${
                  isFullScreen
                    ? "w-full md:w-[440px] lg:w-[480px] shrink-0 border-r border-border/60 bg-card/40"
                    : "w-full"
                } ${isFullScreen && mobileTab !== "chat" ? "hidden md:flex" : "flex"}`}
              >
                {/* Quick Prompts Bar */}
                <div 
                  className="px-4 py-2 border-b border-border/40 bg-secondary/20 overflow-x-auto custom-scrollbar flex gap-2 shrink-0 select-none"
                  data-lenis-prevent
                >
                  {(isAdmin ? ADMIN_QUICK_PROMPTS : CUSTOMER_QUICK_PROMPTS).map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectPrompt(p)}
                      className="px-3 py-1 rounded-full text-[11px] bg-background border border-border/70 hover:border-accent hover:text-accent text-foreground/80 shrink-0 transition-colors flex items-center gap-1"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-accent" />
                      <span>{p}</span>
                    </button>
                  ))}
                </div>

                {/* Messages Scroll Area */}
                <div
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  onWheel={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                  data-lenis-prevent
                  className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-5 custom-scrollbar relative"
                  style={{
                    touchAction: "pan-y",
                    WebkitOverflowScrolling: "touch"
                  }}
                >
                  {messages.map((msg: Message) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col space-y-1.5 ${
                        msg.role === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      {/* Text Bubble */}
                      {msg.content && (
                        <div
                          className={`flex items-start max-w-[90%] md:max-w-[85%] ${
                            msg.role === "user" ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                              msg.role === "user"
                                ? "bg-accent text-slate-950 ml-2.5 shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                                : "bg-secondary text-primary mr-2.5 border border-border"
                            }`}
                          >
                            {msg.role === "user" ? (
                              <UserIcon className="w-3.5 h-3.5" />
                            ) : (
                              <Bot className="w-3.5 h-3.5 text-accent" />
                            )}
                          </div>
                          <div
                            className={`px-4 py-3 text-xs md:text-sm leading-relaxed ${
                              msg.role === "user"
                                ? "bg-accent text-slate-950 rounded-2xl rounded-tr-xs font-medium shadow-md"
                                : "bg-card border border-border/80 text-foreground rounded-2xl rounded-tl-xs shadow-sm"
                            }`}
                          >
                            {renderFormattedMessage(msg.content)}
                          </div>
                        </div>
                      )}

                      {/* Compact Inline Products preview (When not in fullscreen mode) */}
                      {!isFullScreen && msg.toolInvocations && msg.toolInvocations.length > 0 && (() => {
                        const validToolResults = msg.toolInvocations.filter(
                          (t) => t.toolName === "searchProducts" && "result" in t && (t as any).result?.products
                        )
                        const allProducts = validToolResults.flatMap((t) => (t as any).result.products)
                        const uniqueProducts = Array.from(new Map(allProducts.map((p) => [p.id, p])).values())

                        if (uniqueProducts.length === 0) return null

                        return (
                          <div key={`inline-tools-${msg.id}`} className="w-full pl-9 pr-1 pt-2 space-y-2.5">
                            {/* Fullscreen Prompt Banner */}
                            <div className="p-2.5 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-between gap-2">
                              <span className="text-[11px] font-semibold text-accent flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                {uniqueProducts.length} Fragrances Found
                              </span>
                              <button
                                onClick={() => {
                                  setIsFullScreen(true)
                                  setMobileTab("products")
                                }}
                                className="px-2.5 py-1 rounded bg-accent text-slate-950 text-[10px] font-bold uppercase tracking-wider hover:bg-accent/90 transition-colors flex items-center gap-1"
                              >
                                <span>Full Shopping View</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Compact Mini Cards */}
                            <div className="flex flex-col gap-2">
                              {uniqueProducts.slice(0, 3).map((product: any) => (
                                <div
                                  key={product.id}
                                  className="bg-card border border-border/70 rounded-lg p-2 flex items-center gap-2.5 shadow-sm hover:border-accent/40 transition-colors"
                                >
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-14 h-14 object-cover rounded-sm border border-border shrink-0"
                                  />
                                  <div className="flex-1 min-w-0 pr-1">
                                    <span className="text-[9px] font-bold text-accent uppercase tracking-wider">
                                      {product.category || "Luxury"}
                                    </span>
                                    <h4 className="text-xs font-semibold text-foreground truncate">
                                      {product.name}
                                    </h4>
                                    <span className="text-xs font-bold text-foreground">
                                      ₹{product.price.toLocaleString("en-IN")}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleAddProductToBag(product)}
                                    className="px-2.5 py-1.5 rounded-sm bg-accent/15 hover:bg-accent text-accent hover:text-slate-950 text-[11px] font-bold transition-all shrink-0 flex items-center gap-1"
                                    title="Add to Shopping Bag"
                                  >
                                    {addedProductIds[product.id] ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                                    ) : (
                                      <ShoppingBag className="w-3.5 h-3.5" />
                                    )}
                                    <span className="hidden sm:inline">Add</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  ))}

                  {/* Loading Indicator */}
                  {isLoading && (
                    <div className="flex items-center space-x-2 pl-9 text-xs text-muted-foreground">
                      <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center border border-border">
                        <Loader2 className="w-3 h-3 animate-spin text-accent" />
                      </div>
                      <span className="italic font-medium">
                        {isAdmin
                          ? "Admin AI Co-Pilot is checking database & formulating advice..."
                          : "Sommelier is formulating advice & searching catalog..."}
                      </span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Floating "Scroll to Bottom" button if user scrolled up */}
                {isScrolledUp && (
                  <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20">
                    <button
                      onClick={scrollToBottom}
                      className="px-3 py-1 rounded-full bg-accent text-slate-950 font-bold text-[11px] shadow-lg flex items-center gap-1 hover:bg-accent/90 transition-transform active:scale-95"
                    >
                      <ArrowDown className="w-3 h-3" />
                      <span>Jump to Latest</span>
                    </button>
                  </div>
                )}

                {/* Input Bar */}
                <div className="p-3.5 border-t border-border/70 bg-card/80 backdrop-blur-xl shrink-0">
                  <form onSubmit={handleChatSubmit} className="relative flex items-center">
                    <input
                      type="text"
                      value={input}
                      onChange={handleInputChange}
                      placeholder={
                        isAdmin
                          ? "Ask about admin panel features, pricing advice, order fulfillment..."
                          : "Ask for fragrances, notes, or occasion recommendations..."
                      }
                      className="w-full bg-background border border-border rounded-full pl-4 pr-12 py-2.5 text-xs md:text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-accent transition-all shadow-sm"
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="absolute right-1.5 w-8 h-8 rounded-full bg-accent text-slate-950 flex items-center justify-center hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                      title="Send message"
                    >
                      <Send className="w-3.5 h-3.5 ml-0.5" />
                    </button>
                  </form>
                  <p className="text-[10px] text-center text-muted-foreground mt-2">
                    {isAdmin
                      ? "SN AttarWala Admin AI Co-Pilot • Store Advisor & Management Guide"
                      : "SN AttarWala AI Sommelier • Discover pure luxury & notes"}
                  </p>
                </div>
              </div>

              {/* ============================================================== */}
              {/* FULL-SCREEN SHOWCASE PANE (Admin Hub vs Customer Boutique)     */}
              {/* ============================================================== */}
              {isFullScreen && (
                isAdmin ? (
                  <div
                    className={`flex-1 flex flex-col h-full overflow-hidden bg-background ${
                      mobileTab !== "products" ? "hidden md:flex" : "flex"
                    }`}
                  >
                    {/* Admin Showcase Header */}
                    <div className="px-5 py-4 border-b border-border/60 bg-card/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                      <div>
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-accent" />
                          <h2 className="font-heading font-bold text-base md:text-lg text-foreground tracking-wide">
                            Admin Operations & Strategic Advisor
                          </h2>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                            Live Co-Pilot Mode
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          1-Click direct navigation, panel guides, and proven strategies to grow SN AttarWala revenue.
                        </p>
                      </div>
                    </div>

                    {/* Admin Content Body */}
                    <div
                      onWheel={(e) => e.stopPropagation()}
                      onTouchMove={(e) => e.stopPropagation()}
                      data-lenis-prevent
                      className="flex-1 overflow-y-auto overscroll-contain p-5 custom-scrollbar space-y-6"
                      style={{
                        touchAction: "pan-y",
                        WebkitOverflowScrolling: "touch"
                      }}
                    >
                      {/* Section 1: Quick Navigation Cards */}
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-accent mb-3 flex items-center gap-2">
                          <Boxes className="w-3.5 h-3.5" />
                          <span>Admin Panel Direct Navigation & Guides</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {/* Products & Sizes */}
                          <div className="p-3.5 rounded-xl bg-card border border-border/70 hover:border-accent/50 transition-colors flex flex-col justify-between group">
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                                  <Boxes className="w-3.5 h-3.5 text-accent" />
                                  Products & Sizes
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-foreground/70">
                                  /admin/products
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-relaxed">
                                List fragrances with 3ml, 6ml, 12ml sizes, individual variant prices, MRP compare-at values, and stock.
                              </p>
                            </div>
                            <div className="pt-3 flex items-center justify-between">
                              <Link
                                href="/admin/products"
                                className="text-[11px] font-bold text-accent hover:underline inline-flex items-center gap-1"
                              >
                                <span>Open Products</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                              <button
                                onClick={() => handleSelectPrompt("How do I list a product with multiple sizes and size prices in /admin/products?")}
                                className="text-[10px] text-muted-foreground hover:text-accent underline"
                              >
                                Ask Guide
                              </button>
                            </div>
                          </div>

                          {/* Fragrance Categories */}
                          <div className="p-3.5 rounded-xl bg-card border border-border/70 hover:border-accent/50 transition-colors flex flex-col justify-between group">
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                                  <Layers className="w-3.5 h-3.5 text-accent" />
                                  Categories & Photos
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-foreground/70">
                                  /admin/categories
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Upload cover photos for Attars, Perfumes, and Bakhoor. Inspect live photo badges and organize collections.
                              </p>
                            </div>
                            <div className="pt-3 flex items-center justify-between">
                              <Link
                                href="/admin/categories"
                                className="text-[11px] font-bold text-accent hover:underline inline-flex items-center gap-1"
                              >
                                <span>Open Categories</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                              <button
                                onClick={() => handleSelectPrompt("How do I upload photos for categories in /admin/categories?")}
                                className="text-[10px] text-muted-foreground hover:text-accent underline"
                              >
                                Ask Guide
                              </button>
                            </div>
                          </div>

                          {/* Orders & Invoices */}
                          <div className="p-3.5 rounded-xl bg-card border border-border/70 hover:border-accent/50 transition-colors flex flex-col justify-between group">
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                                  <Truck className="w-3.5 h-3.5 text-accent" />
                                  Orders & Invoices
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-foreground/70">
                                  /admin/orders
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Track orders across lifecycle (New, Confirmed, Shipped, Delivered), print tax invoices, and assign tracking numbers.
                              </p>
                            </div>
                            <div className="pt-3 flex items-center justify-between">
                              <Link
                                href="/admin/orders"
                                className="text-[11px] font-bold text-accent hover:underline inline-flex items-center gap-1"
                              >
                                <span>Open Orders</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                              <button
                                onClick={() => handleSelectPrompt("How do I process pending orders and print tax invoices in /admin/orders?")}
                                className="text-[10px] text-muted-foreground hover:text-accent underline"
                              >
                                Ask Guide
                              </button>
                            </div>
                          </div>

                          {/* Inventory Alerts */}
                          <div className="p-3.5 rounded-xl bg-card border border-border/70 hover:border-accent/50 transition-colors flex flex-col justify-between group">
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                  Inventory & Reorder
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-foreground/70">
                                  /admin/inventory
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Monitor stock depletion velocity, low-stock warnings at reorder thresholds, and warehouse replenishments.
                              </p>
                            </div>
                            <div className="pt-3 flex items-center justify-between">
                              <Link
                                href="/admin/inventory"
                                className="text-[11px] font-bold text-accent hover:underline inline-flex items-center gap-1"
                              >
                                <span>Check Inventory</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                              <button
                                onClick={() => handleSelectPrompt("How do low-stock thresholds work and when should I reorder inventory?")}
                                className="text-[10px] text-muted-foreground hover:text-accent underline"
                              >
                                Ask Guide
                              </button>
                            </div>
                          </div>

                          {/* Wholesale B2B */}
                          <div className="p-3.5 rounded-xl bg-card border border-border/70 hover:border-accent/50 transition-colors flex flex-col justify-between group">
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-accent" />
                                  Wholesale B2B Leads
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-foreground/70">
                                  /admin/wholesale
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Manage bulk inquiries from Crawford Market and regional retailers, negotiate MOQs, and provide custom quotes.
                              </p>
                            </div>
                            <div className="pt-3 flex items-center justify-between">
                              <Link
                                href="/admin/wholesale"
                                className="text-[11px] font-bold text-accent hover:underline inline-flex items-center gap-1"
                              >
                                <span>Review Leads</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                              <button
                                onClick={() => handleSelectPrompt("How should I manage wholesale B2B pricing tiers and minimum order quantities?")}
                                className="text-[10px] text-muted-foreground hover:text-accent underline"
                              >
                                Ask Guide
                              </button>
                            </div>
                          </div>

                          {/* Abandoned Carts */}
                          <div className="p-3.5 rounded-xl bg-card border border-border/70 hover:border-accent/50 transition-colors flex flex-col justify-between group">
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                                  <MessageSquare className="w-3.5 h-3.5 text-accent" />
                                  Abandoned Carts
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-foreground/70">
                                  /admin/abandoned-carts
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-relaxed">
                                View dropped checkout carts and reach out directly with 1-click WhatsApp recovery messages and discount vouchers.
                              </p>
                            </div>
                            <div className="pt-3 flex items-center justify-between">
                              <Link
                                href="/admin/abandoned-carts"
                                className="text-[11px] font-bold text-accent hover:underline inline-flex items-center gap-1"
                              >
                                <span>Recover Carts</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                              <button
                                onClick={() => handleSelectPrompt("What is the most effective WhatsApp strategy to recover abandoned carts?")}
                                className="text-[10px] text-muted-foreground hover:text-accent underline"
                              >
                                Ask Guide
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Proactive Strategic Advisory */}
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-accent mb-3 flex items-center gap-2">
                          <Lightbulb className="w-3.5 h-3.5" />
                          <span>Strategic Business Growth Advisory</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          <div className="p-4 rounded-xl bg-secondary/30 border border-border/70 space-y-2">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-500 flex items-center gap-1">
                              <DollarSign className="w-3 h-3" /> Pricing Strategy
                            </span>
                            <h4 className="font-bold text-xs text-foreground">Multi-Size Tiering & Basket Expansion</h4>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              By offering 3ml entry bottles (₹500 - ₹800), customers can sample Taif Rose or White Oudh risk-free. Add a "Upgrade to 12ml for best value" prompt to turn samplers into full-bottle orders.
                            </p>
                            <button
                              onClick={() => handleSelectPrompt("How can I structure multi-size pricing to maximize profit margins?")}
                              className="text-[11px] font-bold text-accent hover:underline inline-flex items-center gap-1 pt-1"
                            >
                              <span>Explore pricing playbook</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="p-4 rounded-xl bg-secondary/30 border border-border/70 space-y-2">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-accent flex items-center gap-1">
                              <Flame className="w-3 h-3" /> Festive Campaigns
                            </span>
                            <h4 className="font-bold text-xs text-foreground">Ramadan, Eid & Wedding Season Pre-Orders</h4>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              Festive fragrance demand spikes 300%. Bundle 3 signature attars with a luxury velvet box at ₹2,999 (15% bundle discount) to push Average Order Value (AOV) higher.
                            </p>
                            <button
                              onClick={() => handleSelectPrompt("Suggest an Eid and wedding season fragrance marketing strategy for SN AttarWala")}
                              className="text-[11px] font-bold text-accent hover:underline inline-flex items-center gap-1 pt-1"
                            >
                              <span>Plan festive campaign</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                <div
                  className={`flex-1 flex flex-col h-full overflow-hidden bg-background ${
                    mobileTab !== "products" ? "hidden md:flex" : "flex"
                  }`}
                >
                  {/* Showcase Header & Category Filters */}
                  <div className="px-5 py-4 border-b border-border/60 bg-card/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-accent" />
                        <h2 className="font-heading font-bold text-base md:text-lg text-foreground tracking-wide">
                          Curated Fragrance Showcase
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/15 text-accent border border-accent/30">
                          {filteredProducts.length} Items Available
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {hasLiveRecommendations
                          ? "Handcrafted selections tailored to your olfactory conversation."
                          : "Explore our signature artisanal collection. Ask the AI concierge to refine by note, occasion, or family."}
                      </p>
                    </div>

                    {/* Category Filter Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0" data-lenis-prevent>
                      {["All", "Attars", "Perfumes", "Bakhoor"].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors whitespace-nowrap ${
                            selectedCategory === cat
                              ? "bg-accent text-slate-950 font-bold shadow-sm"
                              : "bg-secondary text-foreground/70 hover:text-foreground hover:bg-secondary/80 border border-border"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Products Grid with Dedicated Smooth Scroll */}
                  <div
                    onWheel={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                    data-lenis-prevent
                    className="flex-1 overflow-y-auto overscroll-contain p-5 custom-scrollbar"
                    style={{
                      touchAction: "pan-y",
                      WebkitOverflowScrolling: "touch"
                    }}
                  >
                    {filteredProducts.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <Layers className="w-12 h-12 text-accent/40 mb-3" />
                        <h4 className="font-heading font-bold text-foreground text-base">No Matching Fragrances</h4>
                        <p className="text-xs text-muted-foreground max-w-sm mt-1">
                          No items found for category "{selectedCategory}". Switch filters or ask the AI to recommend specific scent notes.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-5 pb-8">
                        {filteredProducts.map((product) => {
                          const currentSize = selectedSizes[product.id] || product.sizes?.[0] || "Standard"
                          const isAdded = addedProductIds[product.id]

                          return (
                            <div
                              key={product.id}
                              className="group bg-card border border-border/80 hover:border-accent/50 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                            >
                              {/* Product Image & Badges */}
                              <div className="relative aspect-square w-full bg-secondary/40 overflow-hidden">
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                                  <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-slate-950/80 backdrop-blur-md text-accent border border-accent/30 shadow-sm">
                                    {product.category || "Artisanal"}
                                  </span>
                                  {product.fragranceFamily && (
                                    <span className="px-2 py-0.5 rounded-sm text-[9px] font-medium bg-background/80 backdrop-blur-md text-foreground/80 border border-border/50">
                                      {product.fragranceFamily}
                                    </span>
                                  )}
                                </div>

                                {product.rating && (
                                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-sm text-[10px] font-bold bg-slate-950/80 backdrop-blur-md text-amber-400 border border-border/40 flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                    <span>{product.rating}</span>
                                  </div>
                                )}
                              </div>

                              {/* Content & Details */}
                              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-0.5">
                                    {product.brand || "SN AttarWala"}
                                  </p>
                                  <Link
                                    href={`/product/${product.slug}`}
                                    className="font-heading font-bold text-sm text-foreground hover:text-accent transition-colors line-clamp-1"
                                    title={product.name}
                                  >
                                    {product.name}
                                  </Link>
                                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                                    {product.description}
                                  </p>
                                </div>

                                {/* Olfactory Notes Preview */}
                                {product.notes && (
                                  <div className="pt-2 border-t border-border/50 space-y-1.5 text-[11px]">
                                    {product.notes.top && product.notes.top.length > 0 && (
                                      <div className="flex items-center gap-1.5 text-muted-foreground truncate">
                                        <span className="font-semibold text-foreground/80 text-[10px] shrink-0">Top:</span>
                                        <span className="truncate">{product.notes.top.join(", ")}</span>
                                      </div>
                                    )}
                                    {product.notes.middle && product.notes.middle.length > 0 && (
                                      <div className="flex items-center gap-1.5 text-muted-foreground truncate">
                                        <span className="font-semibold text-foreground/80 text-[10px] shrink-0">Heart:</span>
                                        <span className="truncate">{product.notes.middle.join(", ")}</span>
                                      </div>
                                    )}
                                    {product.notes.base && product.notes.base.length > 0 && (
                                      <div className="flex items-center gap-1.5 text-muted-foreground truncate">
                                        <span className="font-semibold text-accent/90 text-[10px] shrink-0">Base:</span>
                                        <span className="truncate text-foreground/90">{product.notes.base.join(", ")}</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Sizes Selector if multiple sizes */}
                                {product.sizes && product.sizes.length > 1 && (
                                  <div className="flex items-center gap-1.5 pt-1">
                                    <span className="text-[10px] text-muted-foreground font-semibold">Size:</span>
                                    <div className="flex gap-1">
                                      {product.sizes.map((s) => (
                                        <button
                                          key={s}
                                          onClick={() =>
                                            setSelectedSizes((prev) => ({ ...prev, [product.id]: s }))
                                          }
                                          className={`px-2 py-0.5 rounded-sm text-[10px] font-semibold transition-colors ${
                                            currentSize === s
                                              ? "bg-accent text-slate-950 font-bold"
                                              : "bg-secondary text-foreground/70 hover:text-foreground border border-border"
                                          }`}
                                        >
                                          {s}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Price and Action Buttons */}
                                <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2">
                                  <div>
                                    <div className="flex items-baseline gap-1.5">
                                      <span className="font-heading font-bold text-base text-foreground">
                                        ₹{product.price.toLocaleString("en-IN")}
                                      </span>
                                      {product.compareAtPrice && product.compareAtPrice > product.price && (
                                        <span className="text-xs text-muted-foreground line-through">
                                          ₹{product.compareAtPrice.toLocaleString("en-IN")}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[9px] text-emerald-500 font-semibold block">
                                      In Stock • Ready to Dispatch
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <Link
                                      href={`/product/${product.slug}`}
                                      className="p-2 rounded-sm bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-colors"
                                      title="View Product Page"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </Link>
                                    <button
                                      onClick={() => handleAddProductToBag(product)}
                                      className={`px-3 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm ${
                                        isAdded
                                          ? "bg-emerald-600 text-white"
                                          : "bg-accent hover:bg-accent/90 text-slate-950"
                                      }`}
                                    >
                                      {isAdded ? (
                                        <>
                                          <Check className="w-3.5 h-3.5" />
                                          <span>Added</span>
                                        </>
                                      ) : (
                                        <>
                                          <ShoppingBag className="w-3.5 h-3.5" />
                                          <span>Add to Bag</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
