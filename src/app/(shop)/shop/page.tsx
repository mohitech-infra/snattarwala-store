"use client"

import { Container } from "@/components/layout/container"
import { ProductCard } from "@/components/product/product-card"
import { Filter, SlidersHorizontal, ChevronDown, Check } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { getPublicProducts, PublicProduct } from "@/lib/public-service"

type SortOption = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'bestselling'

function ShopContent() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get("category")
  
  const [mounted, setMounted] = useState(false)
  const [allProducts, setAllProducts] = useState<PublicProduct[]>([])
  const [products, setProducts] = useState<PublicProduct[]>([])
  const [sortBy, setSortBy] = useState<SortOption>('featured')
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [isFilterOpenMobile, setIsFilterOpenMobile] = useState(false)

  // Filters State
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategory ? [initialCategory.charAt(0).toUpperCase() + initialCategory.slice(1)] : []
  )
  const [selectedGenders, setSelectedGenders] = useState<string[]>([])
  const [selectedFamilies, setSelectedFamilies] = useState<string[]>([])
  const [selectedNotes, setSelectedNotes] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedBottleTypes, setSelectedBottleTypes] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<number>(10000)
  const [inStockOnly, setInStockOnly] = useState(false)

  useEffect(() => {
    setMounted(true)
    getPublicProducts().then(data => {
      setAllProducts(data)
    })
  }, [])

  useEffect(() => {
    // Apply Filters
    let filtered = [...allProducts]

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(p => selectedCategories.includes(p.category))
    }
    if (selectedGenders.length > 0) {
      filtered = filtered.filter(p => p.gender && selectedGenders.includes(p.gender))
    }
    if (selectedFamilies.length > 0) {
      filtered = filtered.filter(p => p.fragranceFamily && selectedFamilies.includes(p.fragranceFamily))
    }
    if (selectedNotes.length > 0) {
      filtered = filtered.filter(p => p.fragranceNotes?.some(note => selectedNotes.includes(note)))
    }
    if (selectedSizes.length > 0) {
      filtered = filtered.filter(p => 
        p.sizes?.some(s => selectedSizes.includes(s)) ||
        p.variants?.some(v => selectedSizes.includes(v.size))
      )
    }
    if (selectedBottleTypes.length > 0) {
      filtered = filtered.filter(p => {
        const types = p.variants?.map(v => v.bottleType).filter(Boolean) as string[] || []
        return types.some(t => selectedBottleTypes.some(selected => t.toLowerCase().includes(selected.toLowerCase())))
      })
    }
    filtered = filtered.filter(p => p.price <= priceRange)
    // Removed inStock filter because PublicProduct does not have inStock right now. 
    // In future, you can implement stock logic.

    // Apply Sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0))
        break
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'bestselling':
        filtered.sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0))
        break
      case 'featured':
      default:
        filtered.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0))
        break
    }

    setProducts(filtered)
  }, [allProducts, selectedCategories, selectedGenders, selectedFamilies, selectedNotes, priceRange, inStockOnly, sortBy])

  const toggleFilter = (setState: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setState(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value])
  }

  const sortOptions: { value: SortOption, label: string }[] = [
    { value: 'featured', label: 'Featured' },
    { value: 'newest', label: 'Newest Arrivals' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'bestselling', label: 'Best Selling' },
  ]

  // Extract unique notes and families for dynamic filters
  const allNotes = Array.from(new Set(allProducts.flatMap(p => p.fragranceNotes || []))).sort()
  const allFamilies = Array.from(new Set(allProducts.map(p => p.fragranceFamily).filter(Boolean))) as string[]

  return (
    <div className="py-12 bg-background min-h-screen">
      <Container>
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 border-b border-border/50 pb-8">
          <div className="text-center md:text-left">
            <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight">
              {selectedCategories.length === 1 ? selectedCategories[0] : 'All Fragrances'}
            </h1>
            <p className="text-foreground/50 mt-3 text-sm uppercase tracking-widest font-medium">
              Showing {products.length} products
            </p>
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-4 mt-8 md:mt-0 w-full md:w-auto justify-between md:justify-end">
            <button 
              className="md:hidden flex items-center space-x-2 text-xs font-semibold uppercase tracking-widest border border-border px-4 py-3 rounded-sm hover:bg-secondary transition-colors"
              onClick={() => setIsFilterOpenMobile(!isFilterOpenMobile)}
            >
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
            
            <div className="relative">
              <button 
                className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-widest border border-border px-6 py-3 rounded-sm hover:bg-secondary transition-colors"
                onClick={() => setIsSortOpen(!isSortOpen)}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Sort by: {sortOptions.find(o => o.value === sortBy)?.label}</span>
                <ChevronDown className="w-4 h-4 ml-2" />
              </button>
              
              {isSortOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border/50 shadow-lg rounded-sm z-50 overflow-hidden">
                  {sortOptions.map(option => (
                    <button
                      key={option.value}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-secondary transition-colors flex items-center justify-between"
                      onClick={() => {
                        setSortBy(option.value)
                        setIsSortOpen(false)
                      }}
                    >
                      <span className={sortBy === option.value ? 'font-semibold text-accent' : ''}>{option.label}</span>
                      {sortBy === option.value && <Check className="w-4 h-4 text-accent" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row gap-12">
          {/* Sidebar Filters */}
          <aside className={`${isFilterOpenMobile ? 'block' : 'hidden'} md:block w-full md:w-64 shrink-0 space-y-10`}>
            
            {/* Category Filter */}
            <div>
              <h3 className="font-heading font-semibold text-lg mb-5 tracking-tight border-b border-border/30 pb-2">Category</h3>
              <ul className="space-y-3 text-sm text-foreground/80">
                {['Attars', 'Perfumes', 'Bakhoor'].map(cat => (
                  <li key={cat} className="flex items-center justify-between hover:text-accent cursor-pointer group">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedCategories.includes(cat)}
                        onChange={() => toggleFilter(setSelectedCategories, cat)}
                        className="w-4 h-4 rounded-sm border-border text-accent focus:ring-accent accent-accent" 
                      /> 
                      <span className="group-hover:text-accent transition-colors">{cat}</span>
                    </label> 
                    <span className="text-xs text-foreground/40">{allProducts.filter(p => p.category === cat).length}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Gender Filter */}
            <div>
              <h3 className="font-heading font-semibold text-lg mb-5 tracking-tight border-b border-border/30 pb-2">Gender</h3>
              <ul className="space-y-3 text-sm text-foreground/80">
                {['Men', 'Women', 'Unisex'].map(gender => (
                  <li key={gender} className="flex items-center space-x-3 hover:text-accent cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={selectedGenders.includes(gender)}
                      onChange={() => toggleFilter(setSelectedGenders, gender)}
                      className="w-4 h-4 rounded-sm border-border text-accent focus:ring-accent accent-accent cursor-pointer" 
                    /> 
                    <span className="group-hover:text-accent transition-colors">{gender}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Fragrance Family */}
            {allFamilies.length > 0 && (
              <div>
                <h3 className="font-heading font-semibold text-lg mb-5 tracking-tight border-b border-border/30 pb-2">Fragrance Family</h3>
                <ul className="space-y-3 text-sm text-foreground/80">
                  {allFamilies.map(family => (
                    <li key={family} className="flex items-center space-x-3 hover:text-accent cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={selectedFamilies.includes(family)}
                        onChange={() => toggleFilter(setSelectedFamilies, family)}
                        className="w-4 h-4 rounded-sm border-border text-accent focus:ring-accent accent-accent cursor-pointer" 
                      /> 
                      <span className="group-hover:text-accent transition-colors">{family}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Fragrance Notes */}
            {allNotes.length > 0 && (
              <div>
                <h3 className="font-heading font-semibold text-lg mb-5 tracking-tight border-b border-border/30 pb-2">Fragrance Notes</h3>
                <div className="flex flex-wrap gap-2">
                  {allNotes.slice(0, 15).map(note => (
                    <button
                      key={note}
                      onClick={() => toggleFilter(setSelectedNotes, note)}
                      className={`px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider rounded-full border transition-all ${
                        selectedNotes.includes(note) 
                          ? 'border-accent bg-accent/10 text-accent' 
                          : 'border-border/60 text-foreground/60 hover:border-accent hover:text-accent'
                      }`}
                    >
                      {note}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Bottle Sizes */}
            <div>
              <h3 className="font-heading font-semibold text-lg mb-4 tracking-tight border-b border-border/30 pb-2">Bottle Size</h3>
              <div className="flex flex-wrap gap-1.5">
                {["3ml", "6ml", "12ml", "25ml", "30ml", "50ml", "100ml"].map(size => {
                  const isSelected = selectedSizes.includes(size)
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleFilter(setSelectedSizes, size)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-sm border transition-all ${
                        isSelected
                          ? "border-accent bg-accent/20 text-foreground font-bold shadow-xs ring-1 ring-accent"
                          : "border-border/60 text-foreground/70 hover:border-accent hover:text-accent"
                      }`}
                    >
                      {size}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Bottle Types */}
            <div>
              <h3 className="font-heading font-semibold text-lg mb-4 tracking-tight border-b border-border/30 pb-2">Bottle Type</h3>
              <div className="flex flex-wrap gap-1.5">
                {["Spray", "Roll-On", "Glass Dipstick", "Pocket Atomizer", "Crystal Decanter"].map(bType => {
                  const isSelected = selectedBottleTypes.includes(bType)
                  return (
                    <button
                      key={bType}
                      type="button"
                      onClick={() => toggleFilter(setSelectedBottleTypes, bType)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-sm border transition-all ${
                        isSelected
                          ? "border-accent bg-accent/20 text-accent font-bold shadow-xs ring-1 ring-accent"
                          : "border-border/60 text-foreground/70 hover:border-accent hover:text-accent"
                      }`}
                    >
                      {bType}
                    </button>
                  )
                })}
              </div>
            </div>
            
            {/* Price Range */}
            <div>
              <h3 className="font-heading font-semibold text-lg mb-5 tracking-tight border-b border-border/30 pb-2">Max Price</h3>
              <div className="space-y-4">
                <input 
                  type="range" 
                  min="500" 
                  max="10000" 
                  step="500"
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full accent-accent" 
                />
                <div className="flex justify-between text-xs font-medium uppercase tracking-widest text-foreground/60">
                  <span>₹500</span>
                  <span className="text-foreground">Up to ₹{priceRange.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Availability */}
            <div>
              <h3 className="font-heading font-semibold text-lg mb-5 tracking-tight border-b border-border/30 pb-2">Availability</h3>
              <label className="flex items-center space-x-3 cursor-pointer group text-sm text-foreground/80">
                <input 
                  type="checkbox" 
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 rounded-sm border-border text-accent focus:ring-accent accent-accent cursor-pointer" 
                /> 
                <span className="group-hover:text-accent transition-colors">In Stock Only</span>
              </label>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border/50 rounded-lg bg-secondary/10">
                <p className="text-xl font-heading font-medium mb-4">No products found</p>
                <p className="text-foreground/60 text-sm mb-8">Try adjusting your filters to see more results.</p>
                <button 
                  onClick={() => {
                    setSelectedCategories([])
                    setSelectedGenders([])
                    setSelectedFamilies([])
                    setSelectedNotes([])
                    setSelectedSizes([])
                    setSelectedBottleTypes([])
                    setPriceRange(10000)
                    setInStockOnly(false)
                  }}
                  className="px-6 py-3 border border-accent text-accent text-xs font-semibold uppercase tracking-widest hover:bg-accent hover:text-primary-foreground transition-colors rounded-sm"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                
                {/* Pagination Placeholder */}
                {products.length >= 10 && (
                  <div className="mt-20 flex justify-center border-t border-border/30 pt-12">
                    <button className="px-10 py-4 bg-transparent border border-border text-xs font-semibold uppercase tracking-widest hover:border-accent hover:text-accent transition-colors rounded-sm">
                      Load More Products
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Container>
    </div>
  )
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="py-32 text-center text-xs uppercase tracking-widest font-medium">Loading Catalogue...</div>}>
      <ShopContent />
    </Suspense>
  )
}
