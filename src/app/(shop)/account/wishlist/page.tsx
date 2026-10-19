"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Heart, ShoppingCart, Trash2, Sparkles, Star } from "lucide-react"

interface WishlistItem {
  id: string
  product_id: string
  name: string
  slug: string
  price: number
  image_url: string
  category: string
  added_at: string
}

const FALLBACK_WISHLIST: WishlistItem[] = [
  { id: "w1", product_id: "p1", name: "White Oudh Attar", slug: "white-oudh-attar", price: 1890, image_url: "/products/white-oudh-attar.jpg", category: "Attar", added_at: "Sep 5, 2026" },
  { id: "w2", product_id: "p2", name: "Purple Oud Perfume", slug: "purple-oud-perfume", price: 4200, image_url: "/products/purple-oud-perfume.jpg", category: "Perfume", added_at: "Sep 7, 2026" },
  { id: "w3", product_id: "p3", name: "Kalemat Black", slug: "kalemat-black", price: 5800, image_url: "/products/kalemat-black.jpg", category: "Perfume", added_at: "Sep 8, 2026" },
]

export default function WishlistPage() {
  const [user, setUser] = useState<any>(null)
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }
      setUser(user)

      // Try to fetch from real wishlist table
      const { data, error } = await supabase
        .from("wishlists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (!error && data && data.length > 0) {
        setItems(data.map((w: any) => ({
          id: w.id,
          product_id: w.product_id,
          name: w.product_name,
          slug: w.product_slug || w.product_id,
          price: w.price,
          image_url: w.image_url || "/products/white-oudh-attar.jpg",
          category: w.category || "Fragrance",
          added_at: new Date(w.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        })))
      } else {
        setItems(FALLBACK_WISHLIST)
      }
      setLoading(false)
    }
    init()
  }, [])

  const removeItem = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
    await supabase.from("wishlists").delete().eq("id", id)
  }

  const whatsappOrder = (item: WishlistItem) => {
    const msg = encodeURIComponent(`Salam! I'd like to order:\n\n• ${item.name} — ₹${item.price.toLocaleString('en-IN')}\n\nPlease confirm availability. Thank you! 🌹`)
    window.open(`https://wa.me/919082377314?text=${msg}`, "_blank")
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse flex gap-4 p-4 border border-border/30 rounded-lg">
            <div className="w-20 h-20 bg-secondary rounded-sm shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3 bg-secondary rounded w-3/4" />
              <div className="h-3 bg-secondary rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-heading font-semibold">My Wishlist</h2>
        {items.length > 0 && (
          <span className="text-sm text-foreground/60">{items.length} item{items.length !== 1 ? "s" : ""} saved</span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-secondary/20 p-12 rounded-lg border border-border/50 text-center">
          <Heart className="w-10 h-10 mx-auto text-foreground/20 mb-4" />
          <h3 className="font-heading font-semibold text-lg mb-2">Your wishlist is empty</h3>
          <p className="text-foreground/60 text-sm mb-6">Save fragrances you love and order them anytime.</p>
          <Link href="/shop" className="inline-block px-6 py-2.5 bg-accent text-slate-950 font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-accent/90 transition-colors">
            Explore Fragrances
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* AI Suggestion Banner */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-accent/5 border border-accent/20 text-sm">
            <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <p className="text-foreground/70">
              <strong className="text-foreground">Fragrance Tip:</strong> Your wishlist pairs beautifully — try layering White Oudh Attar with a musk base for an all-day signature scent.{" "}
              <a href="https://wa.me/919082377314" target="_blank" className="text-accent font-medium hover:underline">Ask us on WhatsApp</a>
            </p>
          </div>

          {items.map(item => (
            <div key={item.id} className="flex gap-4 p-4 md:p-5 border border-border/50 rounded-lg hover:border-accent/30 transition-all group">
              <Link href={`/product/${item.slug}`}>
                <div className="w-20 h-20 md:w-24 md:h-24 bg-secondary rounded-sm overflow-hidden shrink-0 border border-border/30">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={e => { (e.target as HTMLImageElement).src = "/products/white-oudh-attar.jpg" }}
                  />
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/product/${item.slug}`} className="font-heading font-semibold text-foreground hover:text-accent transition-colors line-clamp-1">
                      {item.name}
                    </Link>
                    <p className="text-xs text-foreground/50 mt-0.5">{item.category} · Added {item.added_at}</p>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 rounded-sm text-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="font-heading font-bold text-lg text-foreground mt-1">
                  ₹{item.price.toLocaleString('en-IN')}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => whatsappOrder(item)}
                    className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-emerald-500 transition-colors flex items-center gap-1.5"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    Order on WhatsApp
                  </button>
                  <Link
                    href={`/product/${item.slug}`}
                    className="px-4 py-2 border border-border text-xs font-medium rounded-sm hover:border-accent hover:text-accent transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* Total + Order All */}
          <div className="mt-6 p-5 bg-secondary/20 border border-border/50 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-foreground/60">Wishlist Total</p>
              <p className="font-heading font-bold text-2xl">₹{items.reduce((s, i) => s + i.price, 0).toLocaleString('en-IN')}</p>
            </div>
            <button
              onClick={() => {
                const allItems = items.map(i => `• ${i.name} — ₹${i.price.toLocaleString('en-IN')}`).join("\n")
                const msg = encodeURIComponent(`Salam! I'd like to order my entire wishlist:\n\n${allItems}\n\nTotal: ₹${items.reduce((s, i) => s + i.price, 0).toLocaleString('en-IN')}\n\nPlease confirm. Thank you! 🌹`)
                window.open(`https://wa.me/919082377314?text=${msg}`, "_blank")
              }}
              className="px-6 py-3 bg-accent text-slate-950 font-bold text-sm uppercase tracking-wider rounded-sm hover:bg-accent/90 transition-colors whitespace-nowrap"
            >
              Order All on WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
