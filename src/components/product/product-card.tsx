"use client"

import { useState } from "react"
import { Heart, ShoppingBag, Star, Eye } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Product } from "@/lib/products"
import { PublicProduct, ProductVariant } from "@/lib/public-service"
import { FragranceNoteBadge } from "./fragrance-note-badge"
import { useCart } from "@/hooks/use-cart"
import { getAvailableBottleTypes, getDefaultBottleType } from "@/lib/bottle-types"

interface ProductCardProps {
  product: Product | PublicProduct
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()

  // Normalize variants for size and bottle-type mapping
  const rawVariants = (product as PublicProduct).variants
  const rawSizes = product.sizes && product.sizes.length > 0
    ? product.sizes
    : (product.category === "Perfumes" ? ["50ml", "100ml"] : ["6ml", "12ml"])

  const variants: ProductVariant[] = rawVariants && rawVariants.length > 0
    ? rawVariants
    : rawSizes.map((s, idx) => ({
        size: s,
        bottleType: getDefaultBottleType(product.category, s),
        price: idx === 0 ? product.price : Math.round(product.price * (idx === 1 ? 1.8 : 2.5)),
        compareAtPrice: product.compareAtPrice ? (idx === 0 ? product.compareAtPrice : Math.round(product.compareAtPrice * (idx === 1 ? 1.8 : 2.5))) : null,
        stock: (product as any).stockQuantity || 20,
        sku: `${product.sku || 'SKU'}-${s}`,
        isDefault: idx === 0
      }))

  const defaultVariant = variants.find(v => v.isDefault) || variants[0]

  // Available bottle sizes
  const availableSizes = Array.from(new Set(variants.map(v => v.size)))

  // Available bottle types for this product category
  const availableBottleTypes = getAvailableBottleTypes(product.category)

  // Selection states
  const [selectedSize, setSelectedSize] = useState<string>(defaultVariant?.size || availableSizes[0] || "Standard")
  const [selectedBottleType, setSelectedBottleType] = useState<string>(
    defaultVariant?.bottleType || getDefaultBottleType(product.category, defaultVariant?.size)
  )

  // Resolve active variant for pricing and stock calculation
  const activeVariant = variants.find(v => v.size === selectedSize && (!v.bottleType || v.bottleType === selectedBottleType))
    || variants.find(v => v.size === selectedSize)
    || defaultVariant

  const currentPrice = activeVariant ? activeVariant.price : product.price
  const currentCompareAtPrice = activeVariant?.compareAtPrice !== undefined && activeVariant.compareAtPrice !== null
    ? activeVariant.compareAtPrice
    : product.compareAtPrice

  const discount = currentCompareAtPrice && currentCompareAtPrice > currentPrice 
    ? Math.round(((currentCompareAtPrice - currentPrice) / currentCompareAtPrice) * 100) 
    : 0

  const inStock = activeVariant?.stock !== undefined ? activeVariant.stock > 0 : ((product as any).inStock ?? true)

  const handleSelectSize = (size: string) => {
    setSelectedSize(size)
    const matchingVar = variants.find(v => v.size === size)
    if (matchingVar?.bottleType) {
      setSelectedBottleType(matchingVar.bottleType)
    }
  }

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="group relative flex flex-col bg-card rounded-lg overflow-hidden border border-border/50 hover:shadow-[0_10px_30px_rgba(212,175,55,0.1)] transition-all duration-300"
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        {product.isNewArrival && (
          <span className="bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-1 rounded-sm tracking-wider uppercase">NEW</span>
        )}
        {discount > 0 && (
          <span className="bg-destructive text-destructive-foreground text-[10px] font-semibold px-2 py-1 rounded-sm tracking-wider uppercase">-{discount}%</span>
        )}
        {product.isReplica && (
          <span className="bg-muted text-muted-foreground text-[10px] font-semibold px-2 py-1 rounded-sm tracking-wider uppercase border border-border">Inspired</span>
        )}
      </div>

      {/* Wishlist Button */}
      <button className="absolute top-3 right-3 z-10 p-2 rounded-full bg-background/50 hover:bg-background text-foreground/70 hover:text-destructive transition-colors backdrop-blur-sm" aria-label="Add to wishlist">
        <Heart className="w-4 h-4" />
      </button>

      {/* Image Container */}
      <Link href={`/product/${product.slug}?variant=${encodeURIComponent(activeVariant?.sku || selectedSize)}`} className="relative aspect-[4/5] bg-secondary/30 overflow-hidden block">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-secondary/20">
            <span className="text-foreground/20 font-medium tracking-widest uppercase text-sm">Product Image</span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        {/* Category & Gender */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-medium text-accent uppercase tracking-wider">{product.category}</span>
            {product.gender && (
              <>
                <span className="text-foreground/30">•</span>
                <span className="text-[10px] font-medium text-foreground/60 uppercase tracking-wider">{product.gender}</span>
              </>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <Star className="w-3 h-3 fill-accent text-accent" />
            <span className="text-xs font-medium text-foreground/80">{product.rating}</span>
          </div>
        </div>
        
        {/* Title */}
        <Link href={`/product/${product.slug}?variant=${encodeURIComponent(activeVariant?.sku || selectedSize)}`} className="mb-2 hover:text-accent transition-colors">
          <h3 className="font-heading font-semibold text-xl line-clamp-1">{product.name}</h3>
        </Link>

        {/* Notes Badges */}
        {product.fragranceNotes && product.fragranceNotes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {product.fragranceNotes.slice(0, 3).map((note: string, index: number) => (
              <FragranceNoteBadge key={index} note={note} />
            ))}
            {product.fragranceNotes.length > 3 && (
              <span className="text-[10px] text-foreground/50 flex items-center">+{product.fragranceNotes.length - 3} more</span>
            )}
          </div>
        )}

        {/* Short Description */}
        <p className="text-sm text-foreground/70 line-clamp-2 mb-4 leading-relaxed">
          {product.shortDescription}
        </p>

        {/* Bottle Size Selector */}
        {availableSizes.length > 0 && (
          <div className="mb-3 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-foreground/60 font-semibold uppercase tracking-wider text-[10px]">Bottle Size:</span>
              <span className="font-bold text-accent text-xs">{selectedSize}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availableSizes.map((size) => {
                const isSelected = selectedSize === size
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      handleSelectSize(size)
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-sm border transition-all ${
                      isSelected
                        ? "border-accent bg-accent/20 text-foreground font-bold shadow-xs ring-1 ring-accent"
                        : "border-border/70 text-foreground/70 hover:border-accent/50 hover:bg-secondary/30"
                    }`}
                  >
                    {size}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Bottle Type Selector */}
        {availableBottleTypes.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-foreground/60 font-semibold uppercase tracking-wider text-[10px]">Bottle Type:</span>
              <span className="font-medium text-foreground/80 text-[10px]">{selectedBottleType}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {availableBottleTypes.map((bt) => {
                const isSelected = selectedBottleType === bt.name
                return (
                  <button
                    key={bt.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      setSelectedBottleType(bt.name)
                    }}
                    className={`px-2 py-0.5 text-[10px] font-medium rounded-sm border transition-all ${
                      isSelected
                        ? "border-accent/90 bg-accent/15 text-accent font-semibold"
                        : "border-border/50 text-foreground/60 hover:text-foreground hover:bg-secondary/40"
                    }`}
                    title={bt.description}
                  >
                    {bt.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}
        
        {/* Price & Availability */}
        <div className="mt-auto pt-3 border-t border-border/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-baseline space-x-2">
              <span className="font-semibold text-lg">₹{currentPrice.toLocaleString('en-IN')}</span>
              {currentCompareAtPrice && currentCompareAtPrice > currentPrice && (
                <>
                  <span className="text-xs text-foreground/40 line-through">₹{currentCompareAtPrice.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] font-bold text-red-500">({discount}% OFF)</span>
                </>
              )}
            </div>
            <span className={`text-[10px] uppercase tracking-wider font-semibold ${inStock ? 'text-green-500' : 'text-destructive'}`}>
              {inStock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
          
          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Link 
              href={`/product/${product.slug}?variant=${encodeURIComponent(activeVariant?.sku || selectedSize)}`}
              className="flex items-center justify-center space-x-2 py-2.5 border border-border text-xs font-medium uppercase tracking-wider hover:border-accent hover:text-accent transition-colors rounded-sm"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Details</span>
            </Link>
            <button 
              onClick={() => {
                if (inStock) {
                  addItem({
                    productId: product.id,
                    name: product.name,
                    price: currentPrice,
                    imageUrl: product.imageUrl || "/placeholder.jpg",
                    quantity: 1,
                    size: selectedSize,
                    bottleType: selectedBottleType
                  })
                }
              }}
              disabled={!inStock}
              className="flex items-center justify-center space-x-2 py-2.5 bg-primary text-primary-foreground text-xs font-medium uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-sm"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
