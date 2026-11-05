"use client"

import Link from "next/link"
import { Search, User, Heart, ShoppingBag, Menu, X } from "lucide-react"
import { useState } from "react"
import { Container } from "./container"
import { motion, AnimatePresence } from "framer-motion"
import { useCart } from "@/hooks/use-cart"

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { cartCount, setIsCartOpen } = useCart()

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <Container>
        <div className="flex h-20 items-center justify-between">
          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 -ml-2 text-foreground/80 hover:text-foreground"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Logo */}
          <div className="flex-1 md:flex-none flex justify-center md:justify-start">
            <Link href="/" className="flex items-center md:space-x-3">
              {/* Logo Image: Instant high-priority paint without hydration pop-in */}
              <img 
                src="/logo.png" 
                alt="SN AttarWala" 
                width={160} 
                height={80} 
                fetchPriority="high"
                decoding="sync"
                loading="eager"
                className="h-14 w-auto md:h-10 object-contain dark:invert"
              />
              {/* Brand Name Text: Hidden on mobile, visible on desktop */}
              <span className="font-heading text-2xl font-bold tracking-wider uppercase hidden md:inline-block">
                SN AttarWala
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium tracking-wide">
            <Link href="/" className="text-foreground/80 hover:text-foreground transition-colors">HOME</Link>
            <Link href="/shop" className="text-foreground/80 hover:text-foreground transition-colors">SHOP</Link>
            <Link href="/collections" className="text-foreground/80 hover:text-foreground transition-colors">COLLECTIONS</Link>
            <Link href="/wholesale" className="text-foreground/80 hover:text-foreground transition-colors">WHOLESALE</Link>
            <Link href="/about" className="text-foreground/80 hover:text-foreground transition-colors">ABOUT</Link>
            <Link href="/contact" className="text-foreground/80 hover:text-foreground transition-colors">CONTACT</Link>
          </nav>

          {/* Icons */}
          <div className="flex items-center space-x-4">
            <button className="text-foreground/80 hover:text-foreground p-2 transition-colors" aria-label="Search">
              <Search className="h-5 w-5" />
            </button>
            <Link href="/account" className="hidden md:block text-foreground/80 hover:text-foreground p-2 transition-colors" aria-label="Account">
              <User className="h-5 w-5" />
            </Link>
            <Link href="/account/wishlist" className="hidden md:block text-foreground/80 hover:text-foreground p-2 transition-colors" aria-label="Wishlist">
              <Heart className="h-5 w-5" />
            </Link>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="text-foreground/80 hover:text-foreground p-2 transition-colors relative" 
              aria-label="Cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent"></span>
              )}
            </button>
          </div>
        </div>
      </Container>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-b border-border/40 overflow-hidden"
          >
            <div className="max-h-[calc(100vh-5rem)] overflow-y-auto custom-scrollbar">
              <nav className="flex flex-col px-4 py-6 space-y-4 font-heading text-lg">
                <Link href="/" onClick={toggleMobileMenu} className="hover:text-accent transition-colors">HOME</Link>
                <Link href="/shop" onClick={toggleMobileMenu} className="hover:text-accent transition-colors">SHOP</Link>
                <Link href="/collections" onClick={toggleMobileMenu} className="hover:text-accent transition-colors">COLLECTIONS</Link>
                <Link href="/wholesale" onClick={toggleMobileMenu} className="hover:text-accent transition-colors">WHOLESALE</Link>
                <Link href="/about" onClick={toggleMobileMenu} className="hover:text-accent transition-colors">ABOUT</Link>
                <Link href="/contact" onClick={toggleMobileMenu} className="hover:text-accent transition-colors">CONTACT</Link>
                
                <div className="h-px w-full bg-border/50 my-4" />
                
                <Link href="/account" onClick={toggleMobileMenu} className="flex items-center hover:text-accent transition-colors">
                  <User className="h-5 w-5 mr-3" /> ACCOUNT
                </Link>
                <Link href="/account/wishlist" onClick={toggleMobileMenu} className="flex items-center hover:text-accent transition-colors">
                  <Heart className="h-5 w-5 mr-3" /> WISHLIST
                </Link>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
