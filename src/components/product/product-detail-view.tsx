"use client"

import { Container } from "@/components/layout/container"
import { Heart, MessageCircle, Minus, Plus, Star, Truck, ShieldCheck, RefreshCw } from "lucide-react"
import { useState, useEffect } from "react"
import { useCart } from "@/hooks/use-cart"
import { FragranceNoteBadge } from "@/components/product/fragrance-note-badge"
import { ProductCard } from "@/components/product/product-card"
import { PublicProduct, ProductVariant } from "@/lib/public-service"
import { StorePolicies, DEFAULT_STORE_POLICIES } from "@/lib/policies-service"
import { getAvailableBottleTypes, getDefaultBottleType } from "@/lib/bottle-types"
import { useRouter } from "next/navigation"

interface ProductDetailViewProps {
  product: PublicProduct
  relatedProducts: PublicProduct[]
  initialVariantSku?: string
  policies?: StorePolicies
}

export function ProductDetailView({
  product,
  relatedProducts,
  initialVariantSku,
  policies = DEFAULT_STORE_POLICIES
}: ProductDetailViewProps) {
  const router = useRouter()

  // Find initial variant from URL query param (?variant=SKU or ?variant=size) or default
  const variants = product.variants && product.variants.length > 0
    ? product.variants
    : [
        {
          size: product.sizes?.[0] || "12ml",
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          stock: product.stockQuantity || 20,
          sku: product.sku || `${product.id}-12ML`,
          isDefault: true
        }
      ]

  const matchedInitial = variants.find(
    v => (v.sku && v.sku.toLowerCase() === initialVariantSku?.toLowerCase()) ||
         (v.size && v.size.toLowerCase() === initialVariantSku?.toLowerCase())
  ) || variants.find(v => v.isDefault) || variants[0]

  const availableBottleTypes = getAvailableBottleTypes(product.category)
  const [selectedSize, setSelectedSize] = useState<string>(matchedInitial?.size || product.sizes[0] || "")
  const [selectedBottleType, setSelectedBottleType] = useState<string>(
    matchedInitial?.bottleType || getDefaultBottleType(product.category, matchedInitial?.size)
  )
  const [selectedImage, setSelectedImage] = useState<string>(product.imageUrl || "")
  const [quantity, setQuantity] = useState<number>(1)
  const [activeTab, setActiveTab] = useState<string>("description")
  const { addItem, setIsCartOpen } = useCart()

  // Sync state if initialVariantSku changes
  useEffect(() => {
    if (initialVariantSku) {
      const match = variants.find(
        v => (v.sku && v.sku.toLowerCase() === initialVariantSku.toLowerCase()) ||
             (v.size && v.size.toLowerCase() === initialVariantSku.toLowerCase())
      )
      if (match) {
        setSelectedSize(match.size)
        if (match.bottleType) {
          setSelectedBottleType(match.bottleType)
        }
      }
    }
  }, [initialVariantSku, variants])

  // Active variant resolution for dynamic price, compare-at, and stock per size
  const activeVariant = variants.find(v => v.size === selectedSize && (!v.bottleType || v.bottleType === selectedBottleType)) 
    || variants.find(v => v.size === selectedSize) 
    || matchedInitial

  const currentPrice = activeVariant ? activeVariant.price : product.price
  const currentCompareAtPrice = activeVariant?.compareAtPrice !== undefined && activeVariant.compareAtPrice !== null
    ? activeVariant.compareAtPrice
    : product.compareAtPrice

  const discount = currentCompareAtPrice && currentCompareAtPrice > currentPrice
    ? Math.round(((currentCompareAtPrice - currentPrice) / currentCompareAtPrice) * 100)
    : 0

  const inStock = activeVariant?.stock !== undefined ? activeVariant.stock > 0 : (product.inStock ?? true)

  // Automatically switch displayed main image when customer selects a bottle type/size with a specific photo
  useEffect(() => {
    if (activeVariant?.imageUrl) {
      setSelectedImage(activeVariant.imageUrl)
    }
  }, [activeVariant?.imageUrl, selectedSize, selectedBottleType])

  const handleSelectSize = (size: string) => {
    setSelectedSize(size)
    const v = variants.find(item => item.size === size)
    if (v?.bottleType) {
      setSelectedBottleType(v.bottleType)
    }
    if (v && typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.set("variant", v.sku || v.size)
      window.history.replaceState(null, "", url.toString())
    }
  }

  const handleBuyNow = () => {
    if (inStock) {
      addItem({
        productId: product.id,
        name: product.name,
        price: currentPrice,
        imageUrl: activeVariant?.imageUrl || selectedImage || product.imageUrl || "/placeholder.jpg",
        quantity,
        size: selectedSize || product.sizes[0] || "Standard",
        bottleType: selectedBottleType
      })
      setIsCartOpen(false)
      router.push("/checkout")
    }
  }

  const allImages = [
    ...(product.imageGallery || []),
    ...variants.map(v => v.imageUrl).filter(Boolean) as string[]
  ]
  const uniqueGallery = Array.from(new Set(allImages.filter(Boolean)))
  const gallery = uniqueGallery.length > 0 ? uniqueGallery : [product.imageUrl || "/products/white-oudh-attar.jpg"]

  return (
    <div className="py-12 bg-background min-h-screen">
      <Container>
        {/* Breadcrumb */}
        <nav className="text-xs uppercase tracking-widest text-foreground/50 mb-10 flex items-center space-x-2">
          <a href="/" className="hover:text-accent transition-colors">Home</a>
          <span>/</span>
          <a href={`/shop?category=${encodeURIComponent(product.category.toLowerCase())}`} className="hover:text-accent transition-colors">
            {product.category}
          </a>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Visuals: Product Image */}
          <div className="space-y-6">
            <div className="aspect-[4/5] bg-secondary/30 rounded-xl overflow-hidden relative group border border-border/50">
              {selectedImage || product.imageUrl ? (
                <img 
                  src={selectedImage || product.imageUrl} 
                  alt={`${product.name} - ${selectedSize} by SN AttarWala`}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-foreground/20 font-medium tracking-widest uppercase">Product Image</span>
                </div>
              )}
              
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                {product.isNewArrival && (
                  <span className="bg-primary text-primary-foreground text-[10px] font-semibold px-3 py-1.5 rounded-sm tracking-wider uppercase shadow-sm">NEW</span>
                )}
                {product.series && (
                  <span className="bg-accent/20 border border-accent/40 text-accent text-[10px] font-bold px-3 py-1.5 rounded-sm tracking-wider uppercase shadow-sm">
                    {product.series}
                  </span>
                )}
                {discount > 0 && (
                  <span className="bg-destructive text-destructive-foreground text-[10px] font-semibold px-3 py-1.5 rounded-sm tracking-wider uppercase shadow-sm">-{discount}%</span>
                )}
              </div>
            </div>
            
            {/* Gallery Thumbnails */}
            {gallery.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {gallery.map((img, i) => (
                  <button 
                    key={i} 
                    onClick={() => setSelectedImage(img)}
                    className={`aspect-square bg-secondary/30 rounded-md overflow-hidden cursor-pointer border transition-all relative ${selectedImage === img ? 'border-accent ring-2 ring-accent/30' : 'border-border/50 hover:border-accent'}`}
                  >
                    <img src={img} alt={`${product.name} bottle view ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-medium text-accent uppercase tracking-wider">{product.category}</span>
                {product.gender && (
                  <>
                    <span className="text-foreground/30">•</span>
                    <span className="text-[10px] font-medium text-foreground/60 uppercase tracking-wider">{product.gender}</span>
                  </>
                )}
                {activeVariant?.sku && (
                  <>
                    <span className="text-foreground/30">•</span>
                    <span className="text-[10px] font-mono text-foreground/50 uppercase tracking-wider">SKU: {activeVariant.sku}</span>
                  </>
                )}
              </div>
            </div>

            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4 tracking-tight">{product.name}</h1>
            
            {product.isReplica && (
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4 inline-block border border-border px-2 py-1 rounded-sm">
                Inspired Fragrance
              </p>
            )}

            <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center text-accent">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current opacity-50" />
              </div>
              <span className="text-sm text-foreground/60 tracking-wide">{product.rating} ({product.reviews} reviews)</span>
            </div>

            <div className="flex items-baseline space-x-4 mb-6">
              <span className="text-3xl font-semibold tracking-tight">₹{currentPrice.toLocaleString('en-IN')}</span>
              {currentCompareAtPrice && currentCompareAtPrice > currentPrice && (
                <>
                  <span className="text-xl text-foreground/40 line-through tracking-tight">₹{currentCompareAtPrice.toLocaleString('en-IN')}</span>
                  <span className="text-sm font-bold text-red-500 tracking-wider">({discount}% OFF)</span>
                </>
              )}
            </div>

            {/* Fragrance Notes Badges */}
            {product.fragranceNotes && product.fragranceNotes.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {product.fragranceNotes.map((note, index) => (
                  <FragranceNoteBadge key={index} note={note} className="px-3 py-1" />
                ))}
              </div>
            )}

            <div className="space-y-8 mb-10 flex-grow border-t border-b border-border/50 py-8">
              {/* Size Selection with Dynamic Price Badges */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-semibold uppercase tracking-widest text-foreground/80">Select Fragrance Size</span>
                    <span className="text-[11px] text-accent font-semibold">
                      {activeVariant ? `Active: ${activeVariant.size} (₹${activeVariant.price.toLocaleString("en-IN")})` : `Selected: ${selectedSize}`}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map((size) => {
                      const v = variants.find((varItem) => varItem.size === size)
                      const isSelected = selectedSize === size

                      return (
                        <button 
                          key={size}
                          onClick={() => handleSelectSize(size)}
                          className={`px-6 py-2.5 border rounded-sm transition-all flex flex-col items-center justify-center min-w-[100px] ${
                            isSelected 
                              ? 'border-accent bg-accent/15 text-foreground ring-1 ring-accent font-bold shadow-sm' 
                              : 'border-border text-foreground/80 hover:border-accent/60 bg-secondary/20'
                          }`}
                        >
                          <span className="text-xs font-bold tracking-widest uppercase">{size}</span>
                          {v?.price ? (
                            <span className={`text-[11px] mt-0.5 ${isSelected ? 'text-accent font-extrabold' : 'text-foreground/60'}`}>
                              ₹{v.price.toLocaleString('en-IN')}
                            </span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Bottle Type Selection */}
              {availableBottleTypes && availableBottleTypes.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-semibold uppercase tracking-widest text-foreground/80">Select Bottle Type / Applicator</span>
                    <span className="text-[11px] text-accent font-semibold">{selectedBottleType}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {availableBottleTypes.map((bt) => {
                      const isSelected = selectedBottleType === bt.name
                      return (
                        <button
                          key={bt.id}
                          type="button"
                          onClick={() => setSelectedBottleType(bt.name)}
                          className={`p-3 border rounded-sm transition-all text-left flex flex-col justify-between ${
                            isSelected
                              ? 'border-accent bg-accent/15 text-foreground ring-1 ring-accent font-bold shadow-sm'
                              : 'border-border text-foreground/80 hover:border-accent/60 bg-secondary/20'
                          }`}
                        >
                          <span className="text-xs font-bold tracking-wide uppercase flex items-center justify-between">
                            <span>{bt.name}</span>
                            {isSelected && <span className="text-[10px] text-accent">✓ Selected</span>}
                          </span>
                          {bt.description && (
                            <span className="text-[11px] text-foreground/60 mt-1 line-clamp-2 font-normal leading-relaxed">
                              {bt.description}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center space-x-2 text-sm">
                <span className="uppercase tracking-widest text-[10px] font-semibold text-foreground/60">Availability:</span>
                <span className={`uppercase tracking-widest text-[10px] font-semibold ${inStock ? 'text-green-500' : 'text-destructive'}`}>
                  {inStock ? 'In Stock' : 'Out of Stock'}
                </span>
                {activeVariant?.stock !== undefined && (
                  <span className="text-[10px] text-foreground/40 font-mono">
                    ({activeVariant.stock} available)
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-4">
                <div className="flex space-x-4 h-14">
                  {/* Quantity */}
                  <div className="flex items-center border border-border px-4 py-2 space-x-4 w-32 shrink-0 justify-between rounded-sm">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-foreground/50 hover:text-foreground transition-colors">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-medium">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="text-foreground/50 hover:text-foreground transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Add to Cart */}
                  <button 
                    onClick={() => {
                      if (inStock) {
                        addItem({
                          productId: product.id,
                          name: product.name,
                          price: currentPrice,
                          imageUrl: activeVariant?.imageUrl || selectedImage || product.imageUrl || "/placeholder.jpg",
                          quantity,
                          size: selectedSize || product.sizes[0] || "Standard",
                          bottleType: selectedBottleType
                        })
                      }
                    }}
                    disabled={!inStock}
                    className="flex-1 bg-primary text-primary-foreground font-semibold uppercase tracking-widest text-xs hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed rounded-sm"
                  >
                    Add to Cart
                  </button>
                  
                  {/* Wishlist */}
                  <button className="w-14 shrink-0 flex items-center justify-center border border-border text-foreground hover:text-destructive hover:border-destructive transition-colors rounded-sm">
                    <Heart className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Buy Now & WhatsApp */}
                <div className="grid grid-cols-2 gap-4 h-12">
                  <button 
                    onClick={handleBuyNow}
                    disabled={!inStock}
                    className="bg-accent text-primary font-semibold uppercase tracking-widest text-xs hover:bg-accent/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed rounded-sm"
                  >
                    Buy Now
                  </button>
                  <a 
                    href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919082377314'}?text=${encodeURIComponent(`Hello, I'm interested in ordering ${product.name} (${selectedSize || product.sizes[0]})`)}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center justify-center space-x-2 border border-border text-foreground font-semibold uppercase tracking-widest text-xs hover:bg-secondary transition-colors rounded-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Guarantees */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col space-y-3 items-start sm:items-center sm:text-center text-foreground/70">
                <Truck className="w-5 h-5" />
                <span className="text-[10px] uppercase tracking-widest font-medium leading-relaxed">Free Shipping<br/>Above ₹999</span>
              </div>
              <div className="flex flex-col space-y-3 items-start sm:items-center sm:text-center text-foreground/70">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-[10px] uppercase tracking-widest font-medium leading-relaxed">100% Authentic<br/>Guaranteed</span>
              </div>
              <div className="flex flex-col space-y-3 items-start sm:items-center sm:text-center text-foreground/70">
                <RefreshCw className="w-5 h-5" />
                <span className="text-[10px] uppercase tracking-widest font-medium leading-relaxed">7-Day Return<br/>Policy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="mt-32 pt-16 border-t border-border/50">
          <div className="flex flex-wrap gap-8 mb-12 border-b border-border/30">
            {['description', 'fragrance pyramid', 'shipping & returns'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-xs font-semibold uppercase tracking-widest transition-colors relative ${activeTab === tab ? 'text-foreground' : 'text-foreground/40 hover:text-foreground/80'}`}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-accent" />
                )}
              </button>
            ))}
          </div>

          <div className="max-w-4xl min-h-[200px]">
            {activeTab === 'description' && (
              <div className="text-foreground/80 leading-loose space-y-6 text-sm font-light">
                <p className="whitespace-pre-line">{product.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 pt-6 mt-6 border-t border-border/30">
                  {product.fragranceFamily && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold uppercase tracking-widest text-foreground/50">Family:</span>
                      <span className="text-sm">{product.fragranceFamily}</span>
                    </div>
                  )}
                  {product.longevity && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold uppercase tracking-widest text-foreground/50">Longevity:</span>
                      <span className="text-sm">{product.longevity}</span>
                    </div>
                  )}
                  {product.series && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold uppercase tracking-widest text-foreground/50">Series:</span>
                      <span className="text-sm">{product.series}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-foreground/50">Brand:</span>
                    <span className="text-sm">SN AttarWala</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-foreground/50">SKU:</span>
                    <span className="text-sm">{activeVariant?.sku || product.sku}</span>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'fragrance pyramid' && (
              <div className="space-y-12">
                {product.topNotes || product.middleNotes || product.baseNotes ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-sm font-light">
                    {product.topNotes && product.topNotes.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-heading font-semibold text-lg text-foreground tracking-tight border-b border-border/30 pb-2">Top Notes</h4>
                        <ul className="space-y-3 text-foreground/70">
                          {product.topNotes.map(note => <li key={note} className="flex items-center space-x-2"><span className="w-1.5 h-1.5 rounded-full bg-accent/50" /><span>{note}</span></li>)}
                        </ul>
                      </div>
                    )}
                    {product.middleNotes && product.middleNotes.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-heading font-semibold text-lg text-foreground tracking-tight border-b border-border/30 pb-2">Heart Notes</h4>
                        <ul className="space-y-3 text-foreground/70">
                          {product.middleNotes.map(note => <li key={note} className="flex items-center space-x-2"><span className="w-1.5 h-1.5 rounded-full bg-accent/50" /><span>{note}</span></li>)}
                        </ul>
                      </div>
                    )}
                    {product.baseNotes && product.baseNotes.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-heading font-semibold text-lg text-foreground tracking-tight border-b border-border/30 pb-2">Base Notes</h4>
                        <ul className="space-y-3 text-foreground/70">
                          {product.baseNotes.map(note => <li key={note} className="flex items-center space-x-2"><span className="w-1.5 h-1.5 rounded-full bg-accent/50" /><span>{note}</span></li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-foreground/70 text-sm font-light">
                    Detailed fragrance pyramid is not available for this product. See main description for scent profile.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'shipping & returns' && (
              <div className="text-foreground/80 leading-loose space-y-6 text-sm font-light">
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground uppercase tracking-widest text-xs flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 text-accent" /> Shipping Policy
                  </h4>
                  <p className="whitespace-pre-line leading-relaxed">{policies.shippingPolicy}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="p-3 bg-secondary/30 rounded-sm border border-border/40">
                      <span className="font-semibold text-foreground block mb-0.5">Mumbai Metro:</span>
                      <span className="text-foreground/70">{policies.expressDeliveryMumbai}</span>
                    </div>
                    <div className="p-3 bg-secondary/30 rounded-sm border border-border/40">
                      <span className="font-semibold text-foreground block mb-0.5">Rest of India:</span>
                      <span className="text-foreground/70">{policies.panIndiaDelivery}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 pt-4 border-t border-border/30">
                  <h4 className="font-semibold text-foreground uppercase tracking-widest text-xs flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-accent" /> Return & Exchange Policy
                  </h4>
                  <p className="whitespace-pre-line leading-relaxed">{policies.returnPolicy}</p>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <input type="text" placeholder="Enter 6-Digit Pincode" className="border border-border bg-transparent px-4 py-3 w-full sm:w-64 focus:border-accent outline-none text-sm rounded-sm font-mono" />
                  <button className="px-6 py-3 border border-border text-xs font-semibold uppercase tracking-widest hover:border-accent hover:text-accent transition-colors rounded-sm shrink-0">
                    Check Availability
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-32">
            <div className="flex items-center justify-between mb-12">
              <h2 className="font-heading text-3xl font-bold tracking-tight">You May Also Like</h2>
              <a href={`/shop?category=${encodeURIComponent(product.category.toLowerCase())}`} className="text-xs font-semibold uppercase tracking-widest text-accent hover:text-accent/80 transition-colors">
                View All {product.category}
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  )
}

