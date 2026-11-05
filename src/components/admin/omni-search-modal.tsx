"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Search, 
  X, 
  Package, 
  ShoppingCart, 
  Users, 
  TicketPercent, 
  Boxes, 
  Settings, 
  ArrowRight,
  Sparkles
} from "lucide-react"
import { getAdminProducts, getAdminOrders, getAdminCustomers, type AdminProduct, type AdminOrder, type AdminCustomer } from "@/lib/admin-service"

interface OmniSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OmniSearchModal({ isOpen, onClose }: OmniSearchProps) {
  const [query, setQuery] = useState("")
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [customers, setCustomers] = useState<AdminCustomer[]>([])
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      getAdminProducts().then(setProducts)
      getAdminOrders().then(setOrders)
      getAdminCustomers().then(setCustomers)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        if (isOpen) onClose()
        else onClose() // toggled externally
      }
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const cleanQuery = query.toLowerCase().trim()

  const matchedProducts = cleanQuery
    ? products.filter(p => p.name.toLowerCase().includes(cleanQuery) || p.sku.toLowerCase().includes(cleanQuery) || p.category.toLowerCase().includes(cleanQuery)).slice(0, 4)
    : products.slice(0, 3)

  const matchedOrders = cleanQuery
    ? orders.filter(o => o.orderNumber.toLowerCase().includes(cleanQuery) || o.customer.name.toLowerCase().includes(cleanQuery)).slice(0, 3)
    : orders.slice(0, 2)

  const matchedCustomers = cleanQuery
    ? customers.filter(c => c.name.toLowerCase().includes(cleanQuery) || c.email.toLowerCase().includes(cleanQuery) || c.phone.includes(cleanQuery)).slice(0, 3)
    : []

  const quickNav = [
    { name: "Inventory Management", href: "/admin/inventory", icon: Boxes },
    { name: "Order Processing", href: "/admin/orders", icon: ShoppingCart },
    { name: "Coupons & Discounts", href: "/admin/coupons", icon: TicketPercent },
    { name: "Store Configuration", href: "/admin/settings", icon: Settings },
  ]

  const handleSelect = (href: string) => {
    router.push(href)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20 flex items-start justify-center">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
      />

      {/* Dialog */}
      <div className="relative w-full max-w-2xl bg-card border border-border/80 rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left">
        
        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-border/50 bg-background/50">
          <Search className="w-5 h-5 text-accent shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, SKU, orders, customers, settings..."
            className="w-full bg-transparent py-4 px-3 text-sm focus:outline-none text-foreground placeholder:text-foreground/40"
          />
          {query && (
            <button onClick={() => setQuery("")} className="p-1 hover:text-foreground text-foreground/40">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex text-[10px] bg-secondary px-2 py-0.5 rounded border border-border text-foreground/50">
            ESC to close
          </kbd>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-5 custom-scrollbar">
          
          {/* Quick Links (if no query) */}
          {!query && (
            <div>
              <p className="text-[10px] font-semibold text-foreground/40 uppercase tracking-widest px-2 mb-2">
                Quick Navigation
              </p>
              <div className="grid grid-cols-2 gap-2">
                {quickNav.map(nav => {
                  const Icon = nav.icon
                  return (
                    <button
                      key={nav.name}
                      onClick={() => handleSelect(nav.href)}
                      className="flex items-center space-x-2.5 p-2.5 rounded-sm bg-secondary/20 hover:bg-secondary border border-border/40 hover:border-accent text-xs text-foreground transition-all"
                    >
                      <Icon className="w-4 h-4 text-accent" />
                      <span>{nav.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Products */}
          {matchedProducts.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-foreground/40 uppercase tracking-widest px-2 mb-2 flex items-center justify-between">
                <span>Products ({matchedProducts.length})</span>
                <span className="text-accent text-[9px] cursor-pointer" onClick={() => handleSelect("/admin/products")}>View all</span>
              </p>
              <div className="space-y-1">
                {matchedProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => handleSelect(`/admin/products?search=${encodeURIComponent(product.name)}`)}
                    className="w-full flex items-center justify-between p-2 rounded-sm hover:bg-secondary/60 text-xs transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <img src={product.imageUrl} alt={product.name} className="w-8 h-8 rounded-sm object-cover border border-border/50" />
                      <div className="text-left">
                        <p className="font-semibold text-foreground group-hover:text-accent transition-colors">{product.name}</p>
                        <p className="text-[10px] text-foreground/50">{product.category} • SKU: {product.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">₹{product.price.toLocaleString('en-IN')}</p>
                      <span className="text-[10px] text-foreground/50">{product.stock} in stock</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Orders */}
          {matchedOrders.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-foreground/40 uppercase tracking-widest px-2 mb-2 flex items-center justify-between">
                <span>Orders ({matchedOrders.length})</span>
                <span className="text-accent text-[9px] cursor-pointer" onClick={() => handleSelect("/admin/orders")}>View all</span>
              </p>
              <div className="space-y-1">
                {matchedOrders.map(order => (
                  <button
                    key={order.id}
                    onClick={() => handleSelect(`/admin/orders?order=${order.orderNumber}`)}
                    className="w-full flex items-center justify-between p-2 rounded-sm hover:bg-secondary/60 text-xs transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <ShoppingCart className="w-4 h-4 text-accent" />
                      <div className="text-left">
                        <p className="font-semibold text-foreground group-hover:text-accent transition-colors">{order.orderNumber} • {order.customer.name}</p>
                        <p className="text-[10px] text-foreground/50">{order.items.length} items • {order.orderStatus}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">₹{order.total.toLocaleString('en-IN')}</p>
                      <span className="text-[10px] text-emerald-500 font-medium">{order.paymentStatus}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customers */}
          {matchedCustomers.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-foreground/40 uppercase tracking-widest px-2 mb-2">
                Customers ({matchedCustomers.length})
              </p>
              <div className="space-y-1">
                {matchedCustomers.map(customer => (
                  <button
                    key={customer.id}
                    onClick={() => handleSelect(`/admin/customers?search=${encodeURIComponent(customer.name)}`)}
                    className="w-full flex items-center justify-between p-2 rounded-sm hover:bg-secondary/60 text-xs transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <Users className="w-4 h-4 text-accent" />
                      <div className="text-left">
                        <p className="font-semibold text-foreground group-hover:text-accent transition-colors">{customer.name}</p>
                        <p className="text-[10px] text-foreground/50">{customer.email} • {customer.city}</p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent font-semibold">
                      {customer.segment}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-background border-t border-border/50 flex items-center justify-between text-[11px] text-foreground/50">
          <div className="flex items-center space-x-1.5 text-accent">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-medium">ATTARWALA Global Search</span>
          </div>
          <span>Press Enter to select</span>
        </div>

      </div>
    </div>
  )
}
