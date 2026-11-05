"use client"

import { Hero } from "@/components/home/hero"
import { Container } from "@/components/layout/container"
import { motion } from "framer-motion"
import Link from "next/link"
import { MapPin, MessageCircle, Star, ArrowRight } from "lucide-react"
import { ProductCard } from "@/components/product/product-card"
import { useEffect, useState } from "react"
import { getPublicProducts, PublicProduct } from "@/lib/public-service"
import { getAdminCategories, AdminCategory } from "@/lib/admin-service"
import { getPublicTestimonials } from "@/lib/store-settings-service"
import { AttarSeriesSection } from "@/components/home/wholesale"

export default function Home() {
  const [products, setProducts] = useState<PublicProduct[]>([])
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [testimonials, setTestimonials] = useState<any[]>([])

  useEffect(() => {
    getPublicProducts().then(setProducts)
    getAdminCategories().then(cats => {
      // Show categories that have products, or all if none have counts yet
      setCategories(cats.length > 0 ? cats : [])
    })
    getPublicTestimonials().then(setTestimonials)
  }, [])

  const featuredProducts = products.filter(p => p.isFeatured).slice(0, 4)
  const bestsellers = products.filter(p => p.isBestseller).slice(0, 4)
  const newArrivals = products.filter(p => p.isNewArrival).slice(0, 4)

  // Active categories from DB
  const activeCategories = categories.filter(c => c.isActive !== false)
  const displayCategories = activeCategories.length > 0 ? activeCategories : [
    { id: '1', name: 'Attars', slug: 'attars', imageUrl: '/categories/attars.jpg', description: '', productsCount: 0, isActive: true },
    { id: '2', name: 'Perfumes', slug: 'perfumes', imageUrl: '/categories/perfumes.jpg', description: '', productsCount: 0, isActive: true },
    { id: '3', name: 'Bakhoor', slug: 'bakhoor', imageUrl: '/categories/bakhoor.jpg', description: '', productsCount: 0, isActive: true },
  ]

  const families = ['Oud', 'Musk', 'Woody', 'Floral', 'Amber', 'Citrus']

  return (
    <>
      <Hero />
      <AttarSeriesSection />

      {/* Shop by Category */}
      <section className="py-24 bg-background">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4 tracking-tight">Shop by Category</h2>
            <div className="w-16 h-px bg-accent mx-auto"></div>
          </div>
          
          <div className={`grid grid-cols-1 ${
            displayCategories.length === 2 
              ? 'sm:grid-cols-2 max-w-4xl mx-auto' 
              : displayCategories.length === 4 
              ? 'sm:grid-cols-2 lg:grid-cols-4' 
              : 'sm:grid-cols-2 md:grid-cols-3'
          } gap-8`}>
            {displayCategories.map((category) => (
              <div 
                key={category.id || category.name}
                className="group cursor-pointer"
              >
                <Link href={`/shop?category=${category.slug}`} className="block">
                  <div className="relative h-[480px] overflow-hidden rounded-sm mb-6 bg-secondary/20 border border-border/50">
                    <img 
                      src={category.imageUrl || `/categories/${category.slug}.jpg`} 
                      alt={category.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-colors z-10" />
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                       <span className="text-white font-bold tracking-widest uppercase text-3xl drop-shadow-md text-center px-4">{category.name}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-heading font-semibold text-center uppercase tracking-widest">{category.name}</h3>
                  <p className="text-center text-xs font-semibold text-foreground/50 mt-3 group-hover:text-accent transition-colors uppercase tracking-widest flex items-center justify-center gap-2">
                    Explore <ArrowRight className="w-3 h-3" />
                  </p>
                </Link>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Featured Fragrances */}
      {featuredProducts.length > 0 && (
        <section className="py-24 bg-secondary/10 border-t border-b border-border/50">
          <Container>
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4 tracking-tight">Featured Fragrances</h2>
                <div className="w-16 h-px bg-accent"></div>
              </div>
              <Link href="/shop" className="hidden sm:flex items-center space-x-2 text-xs font-semibold uppercase tracking-widest hover:text-accent transition-colors">
                <span>View All</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            
            <div className="mt-10 sm:hidden flex justify-center">
              <Link href="/shop" className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-widest hover:text-accent transition-colors border border-border px-6 py-3 rounded-sm">
                <span>View All Collection</span>
              </Link>
            </div>
          </Container>
        </section>
      )}

      {/* Explore Fragrance Families */}
      <section className="py-24 bg-background">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4 tracking-tight">Fragrance Families</h2>
            <p className="text-foreground/60 text-sm max-w-2xl mx-auto leading-relaxed">
              Discover your perfect scent profile by exploring our curated fragrance families, from deep woody ouds to refreshing citrus blends.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            {families.map((family) => (
              <Link 
                key={family} 
                href="/shop" 
                className="px-8 py-4 border border-border/50 bg-secondary/5 hover:border-accent hover:bg-accent/5 text-foreground hover:text-accent transition-all duration-300 rounded-sm font-heading text-lg tracking-wide shadow-sm"
              >
                {family}
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="py-24 bg-secondary/10 border-t border-border/50">
          <Container>
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4 tracking-tight">New Arrivals</h2>
                <div className="w-16 h-px bg-accent"></div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Bestsellers */}
      {bestsellers.length > 0 && (
        <section className="py-24 bg-background">
          <Container>
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4 tracking-tight">Bestsellers</h2>
                <div className="w-16 h-px bg-accent"></div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bestsellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Testimonials */}
      <section className="py-24 bg-secondary/30">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">What Our Clients Say</h2>
            <div className="flex justify-center items-center gap-2 text-yellow-500 mb-4">
              <Star className="w-5 h-5 fill-current" />
              <Star className="w-5 h-5 fill-current" />
              <Star className="w-5 h-5 fill-current" />
              <Star className="w-5 h-5 fill-current" />
              <Star className="w-5 h-5 fill-current" />
            </div>
            <p className="text-foreground/60 text-sm uppercase tracking-widest font-semibold">Based on 500+ Google Reviews</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(testimonials.length > 0 ? testimonials : [
              { id: '1', customerName: "Rahul S.", rating: 5, text: "Absolutely phenomenal quality. The Oud Wood Intense lasted on my skin for over 12 hours. Best perfume store in Mumbai!" },
              { id: '2', customerName: "Priya M.", rating: 5, text: "Beautiful presentation and the fragrance is divine. The customer service via WhatsApp was incredibly helpful in choosing my signature scent." },
              { id: '3', customerName: "Amit K.", rating: 5, text: "I bought 'For Her' as a gift and my wife loves it. Premium experience from ordering to unboxing. Highly recommended." }
            ]).slice(0, 3).map((review: any, i: number) => (
              <div 
                key={review.id || i}
                className="bg-background p-8 rounded-lg shadow-sm border border-border/50"
              >
                <div className="flex gap-1 text-yellow-500 mb-4">
                  {[1,2,3,4,5].map(star => <Star key={star} className={`w-4 h-4 ${star <= review.rating ? 'fill-current' : 'text-border'}`} />)}
                </div>
                <p className="text-foreground/80 italic mb-6 leading-relaxed">"{review.text || review.review_text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                    {(review.customerName || review.customer_name || 'C').charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{review.customerName || review.customer_name}</h4>
                    <p className="text-[10px] text-foreground/50 uppercase tracking-widest">Verified Buyer</p>
                  </div>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-4 h-4 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Mumbai Store */}
      <section className="py-24 bg-slate-900 text-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full fill-current">
            <polygon points="0,100 100,0 100,100" />
          </svg>
        </div>
        
        <Container className="relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="flex flex-col space-y-4">
              <div className="h-[250px] rounded-sm overflow-hidden bg-slate-100/10 relative">
                <iframe 
                  src="https://maps.google.com/maps?q=137,+Janjiker+street+opp+Central+restaurant,+Near+crowford+Market,+Masjid+west+MUMBAI+400003&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={false} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-sm shadow-[0_0_15px_rgba(212,175,55,0.4)] border border-accent/30 hover:shadow-[0_0_25px_rgba(212,175,55,0.7)] transition-all duration-500"
                ></iframe>
              </div>
              <div className="h-[250px] rounded-sm overflow-hidden bg-slate-100/10 relative">
                <iframe 
                  src="https://maps.google.com/maps?q=41,+Mohd+Ali+Road,+Minara+Masjid,+Near+Zam+Zam+Sweet,+Mumbai+-+400003&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={false} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-sm shadow-[0_0_15px_rgba(212,175,55,0.4)] border border-accent/30 hover:shadow-[0_0_25px_rgba(212,175,55,0.7)] transition-all duration-500"
                ></iframe>
              </div>
            </div>
            <div className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-heading font-bold tracking-tight">Visit Our Boutiques</h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <MapPin className="w-6 h-6 text-accent shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-lg tracking-wide">Store 1 (Janjiker Street)</h4>
                    <p className="text-slate-300 leading-relaxed mt-2 text-sm">
                      137, Janjiker street opp Central restaurant,<br />
                      Near crowford Market, Masjid west<br />
                      MUMBAI 400003
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <MapPin className="w-6 h-6 text-accent shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-lg tracking-wide">Store 2 (Minara Masjid)</h4>
                    <p className="text-slate-300 leading-relaxed mt-2 text-sm">
                      41, Mohd Ali Road, Minara Masjid,<br />
                      Near Zam Zam Sweet,<br />
                      Mumbai - 400003
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="px-6 py-3 bg-accent text-slate-900 font-semibold tracking-widest text-xs text-center hover:bg-accent/90 transition-colors uppercase rounded-sm">
                  Get Directions
                </a>
                <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919082377314'}`} target="_blank" rel="noreferrer" className="px-6 py-3 border border-slate-300 text-slate-300 font-semibold tracking-widest text-xs text-center hover:bg-slate-100/10 transition-colors uppercase flex items-center justify-center space-x-2 rounded-sm">
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Us</span>
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>

    </>
  )
}
