import { createClient } from "./supabase/client"
import { DUMMY_PRODUCTS } from "./products"

export interface ProductVariant {
  id?: string
  size: string
  price: number
  compareAtPrice?: number | null
  stock?: number
  sku?: string
  isDefault?: boolean
}

export interface PublicProduct {
  id: string
  name: string
  slug: string
  description: string
  shortDescription?: string
  price: number
  compareAtPrice?: number | null
  sku: string
  category: string
  brand?: string
  gender?: string
  fragranceFamily?: string | null
  fragranceNotes?: string[]
  topNotes?: string[]
  middleNotes?: string[]
  baseNotes?: string[]
  longevity?: string
  sillage?: string
  season?: string[]
  sizes: string[]
  variants?: ProductVariant[]
  rating: number
  reviews: number
  isFeatured: boolean
  isBestseller: boolean
  isNewArrival: boolean
  isReplica?: boolean
  inStock?: boolean
  stockQuantity?: number
  imageUrl: string
  imageGallery: string[]
  series?: "Golden Series" | "Diamond Series" | "Luxury Series" | string | null
}

function mapDummyProducts(): PublicProduct[] {
  return DUMMY_PRODUCTS.map((p) => {
    const defaultSizes = p.sizes || (p.category === "Perfumes" ? ["50ml", "100ml"] : ["6ml", "12ml"])
    const variants: ProductVariant[] = defaultSizes.map((size, idx) => ({
      size,
      price: idx === 0 ? p.price : Math.round(p.price * (idx === 1 ? 1.8 : 2.5)),
      compareAtPrice: p.compareAtPrice ? (idx === 0 ? p.compareAtPrice : Math.round(p.compareAtPrice * (idx === 1 ? 1.8 : 2.5))) : null,
      stock: 20,
      sku: `${p.sku || 'SKU'}-${size.toUpperCase()}`,
      isDefault: idx === 0
    }))

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      shortDescription: p.shortDescription || p.description,
      price: p.price,
      compareAtPrice: p.compareAtPrice ?? null,
      sku: p.sku || "",
      category: p.category,
      brand: p.brand,
      gender: p.gender || "Unisex",
      fragranceFamily: p.fragranceFamily || null,
      fragranceNotes: p.fragranceNotes || [],
      topNotes: p.topNotes || [],
      middleNotes: p.middleNotes || [],
      baseNotes: p.baseNotes || [],
      longevity: p.longevity || "8-12 Hours",
      sillage: "Moderate to Heavy",
      season: ["All Seasons"],
      sizes: defaultSizes,
      variants,
      rating: p.rating || 4.8,
      reviews: p.reviews || 50,
      isFeatured: Boolean(p.isFeatured),
      isBestseller: Boolean(p.isBestseller),
      isNewArrival: Boolean(p.isNewArrival),
      isReplica: Boolean(p.isReplica),
      inStock: p.inStock ?? true,
      stockQuantity: 25,
      imageUrl: p.imageUrl || "/products/white-oudh-attar.jpg",
      imageGallery: p.galleryImages?.length ? p.galleryImages : [p.imageUrl || "/products/white-oudh-attar.jpg"],
      series: p.series || null,
    }
  })
}

export async function getPublicProducts(): Promise<PublicProduct[]> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        category:categories(name),
        images:product_images(image_url, is_primary)
      `)
      .eq("is_active", true)

    if (error) {
      console.warn("Error fetching public products from Supabase:", error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    return data.map((p: any) => {
      const allImages = p.images?.map((img: any) => img.image_url) || []
      const primaryImg = p.images?.find((img: any) => img.is_primary)?.image_url || allImages[0] || p.image_url || "/products/white-oudh-attar.jpg"
      const seriesTag = Array.isArray(p.tags) ? p.tags.find((t: string) => typeof t === "string" && t.includes("Series")) : null

      // Parse and normalize variants
      let variants: ProductVariant[] = []
      if (Array.isArray(p.variants) && p.variants.length > 0) {
        variants = p.variants.map((v: any, idx: number) => ({
          id: v.id,
          size: v.size || "Standard",
          price: Number(v.price) || Number(p.price),
          compareAtPrice: v.compareAtPrice !== undefined ? Number(v.compareAtPrice) : (v.compare_at_price !== undefined ? Number(v.compare_at_price) : (p.compare_at_price ? Number(p.compare_at_price) : null)),
          stock: v.stock !== undefined ? Number(v.stock) : (v.stock_quantity !== undefined ? Number(v.stock_quantity) : Number(p.stock_quantity) || 0),
          sku: v.sku || `${p.sku || 'SKU'}-${v.size || idx}`,
          isDefault: Boolean(v.isDefault ?? (idx === 0))
        }))
      } else if (p.size) {
        variants = p.size.split(",").map((s: string, idx: number) => ({
          size: s.trim(),
          price: Number(p.price),
          compareAtPrice: p.compare_at_price ? Number(p.compare_at_price) : null,
          stock: Number(p.stock_quantity) || 0,
          sku: `${p.sku || 'SKU'}-${s.trim()}`,
          isDefault: idx === 0
        }))
      }

      const sizes = variants.length > 0 
        ? variants.map(v => v.size) 
        : (p.size ? p.size.split(",").map((s: string) => s.trim()) : ["Standard"])

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        shortDescription: p.short_description || p.description,
        price: Number(p.price),
        compareAtPrice: p.compare_at_price ? Number(p.compare_at_price) : null,
        sku: p.sku || "",
        category: p.category?.name || p.category || "Uncategorized",
        gender: p.gender || "Unisex",
        fragranceFamily: p.fragrance_family || null,
        fragranceNotes: [p.top_notes, p.middle_notes, p.base_notes].filter(Boolean),
        topNotes: p.top_notes ? p.top_notes.split(",") : [],
        middleNotes: p.middle_notes ? p.middle_notes.split(",") : [],
        baseNotes: p.base_notes ? p.base_notes.split(",") : [],
        longevity: "8-12 Hours",
        sillage: "Moderate to Heavy",
        sizes,
        variants,
        rating: Number(p.rating) || 0,
        reviews: Number(p.review_count) || 0,
        isFeatured: p.featured || false,
        isBestseller: p.best_seller || false,
        isNewArrival: p.new_arrival || false,
        isReplica: false,
        inStock: (p.stock_quantity ?? 10) > 0,
        stockQuantity: p.stock_quantity ?? 10,
        imageUrl: primaryImg,
        imageGallery: allImages.length > 0 ? allImages : [primaryImg],
        series: p.series || seriesTag || null,
      }
    })
  } catch (err) {
    console.error("Exception fetching public products:", err)
    return []
  }
}
