import { createClient } from "./supabase/client"
import { DUMMY_PRODUCTS } from "./products"

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
  return DUMMY_PRODUCTS.map((p) => ({
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
    sizes: p.sizes || ["100ml"],
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
  }))
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
      return mapDummyProducts()
    }

    if (!data || data.length === 0) {
      return []
    }

    return data.map((p: any) => {
      const allImages = p.images?.map((img: any) => img.image_url) || []
      const primaryImg = p.images?.find((img: any) => img.is_primary)?.image_url || allImages[0] || p.image_url || "/products/white-oudh-attar.jpg"
      const seriesTag = Array.isArray(p.tags) ? p.tags.find((t: string) => typeof t === "string" && t.includes("Series")) : null

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
        sizes: p.size ? [p.size] : ["100ml"],
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
    return mapDummyProducts()
  }
}
