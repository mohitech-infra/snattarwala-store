"use client"

import { useCart } from "@/hooks/use-cart"
import { motion, AnimatePresence } from "framer-motion"
import { X, Minus, Plus, ShoppingBag } from "lucide-react"
import Link from "next/link"

export function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, removeItem, updateQuantity, cartTotal } = useCart()

  if (!isCartOpen) return null

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setIsCartOpen(false)}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
      />

      {/* Drawer */}
      <motion.div
        key="drawer"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background shadow-2xl flex flex-col border-l border-border/50"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <h2 className="font-heading text-xl font-bold flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5" />
            <span>Your Bag</span>
            <span className="text-sm font-sans font-normal text-foreground/50 bg-secondary px-2 py-0.5 rounded-full ml-2">
              {items.length}
            </span>
          </h2>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 hover:bg-secondary rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <ShoppingBag className="w-12 h-12 text-muted-foreground" />
              <p className="text-lg font-medium">Your bag is empty</p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-accent hover:text-accent/80 font-medium"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <ul className="space-y-6">
              {items.map((item) => (
                <li key={item.id} className="flex space-x-4">
                  {/* Item Image */}
                  <div className="w-24 h-24 bg-secondary rounded-md overflow-hidden shrink-0">
                    <img
                      src={item.imageUrl || "/placeholder.jpg"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start">
                      <Link
                        href={`/product/${item.productId}`}
                        onClick={() => setIsCartOpen(false)}
                        className="font-medium hover:text-accent transition-colors line-clamp-1"
                      >
                        {item.name}
                      </Link>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-foreground/40 hover:text-destructive transition-colors p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {(item.size || item.bottleType) && (
                      <p className="text-xs text-foreground/60 font-medium">
                        {[item.size, item.bottleType].filter(Boolean).join(" • ")}
                      </p>
                    )}
                    
                    <div className="mt-auto flex items-center justify-between">
                      {/* Quantity Control */}
                      <div className="flex items-center border border-border rounded-sm">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1 text-foreground/60 hover:text-foreground"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 text-foreground/60 hover:text-foreground"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-semibold">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border/50 p-6 bg-secondary/20">
            <div className="flex justify-between text-lg font-semibold mb-6">
              <span>Subtotal</span>
              <span>₹{cartTotal.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-sm text-foreground/60 mb-6">
              Shipping and taxes calculated at checkout.
            </p>
            <Link
              href="/checkout"
              onClick={() => setIsCartOpen(false)}
              className="w-full block text-center bg-primary text-primary-foreground py-4 font-medium uppercase tracking-widest text-sm hover:bg-primary/90 transition-colors"
            >
              Checkout
            </Link>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
