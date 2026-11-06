import { PublicProduct, ProductVariant, getPublicProducts } from "@/lib/public-service"

export interface GoogleFeedItem {
  id: string
  itemGroupId: string
  title: string
  description: string
  link: string
  imageLink: string
  additionalImageLinks: string[]
  availability: "in_stock" | "out_of_stock"
  price: number
  salePrice?: number | null
  currency: string
  condition: "new"
  brand: string
  googleProductCategory: string
  productType: string
  size: string
  gender: string
  ageGroup: "adult"
  identifierExists: "no"
  shippingCountry: string
  shippingService: string
  shippingPrice: number
  parentName: string
  parentSlug: string
  category: string
  series?: string | null
  status: "Ready for Google" | "Missing SKU" | "Missing Image" | "Invalid Price" | "Out of Stock"
  validationErrors: string[]
}

export interface GoogleShoppingAuditSummary {
  totalActiveProducts: number
  totalActiveVariants: number
  readyCount: number
  readyPercent: number
  missingSkuCount: number
  missingImageCount: number
  invalidPriceCount: number
  missingBrandCount: number
  missingDataCount: number
  outOfStockCount: number
  lastGenerated: string
  feedUrl: string
}

const DEFAULT_SITE_URL = "https://snattarwala.in"
const DEFAULT_BRAND = "SN AttarWala"
const GOOGLE_PERFUME_CATEGORY = "Health & Beauty > Personal Care > Cosmetics > Perfume & Cologne"

export function getBaseSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || DEFAULT_SITE_URL
  return envUrl.replace(/\/+$/, "")
}

function ensureHttpsUrl(url: string, baseUrl: string): string {
  if (!url) return `${baseUrl}/products/white-oudh-attar.jpg`
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url.replace(/^http:\/\//i, "https://")
  }
  const cleanPath = url.startsWith("/") ? url : `/${url}`
  return `${baseUrl}${cleanPath}`
}

function cleanTextForGoogle(text?: string | null): string {
  if (!text) return ""
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Builds Google Shopping feed items for all active products and their sellable variants
 */
export async function getGoogleShoppingItems(): Promise<GoogleFeedItem[]> {
  const products = await getPublicProducts()
  const siteUrl = getBaseSiteUrl()
  const items: GoogleFeedItem[] = []

  for (const product of products) {
    if (!product.inStock && (!product.variants || product.variants.length === 0)) {
      continue
    }

    const cleanDesc = cleanTextForGoogle(product.description || product.shortDescription) ||
      `Luxury artisanal ${product.name} handcrafted by ${DEFAULT_BRAND}, Mumbai. Features rich olfactory notes and exceptional longevity.`

    const variants: ProductVariant[] = (product.variants && product.variants.length > 0)
      ? product.variants
      : [
          {
            size: product.sizes?.[0] || "12ml",
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            stock: product.stockQuantity || 20,
            sku: product.sku || `SNA-${product.name.slice(0, 3).toUpperCase()}-12ML`,
            isDefault: true
          }
        ]

    for (const v of variants) {
      const validationErrors: string[] = []
      
      const variantSku = v.sku?.trim() || `${product.sku || 'SNA'}-${v.size.replace(/[^a-zA-Z0-9]/g, '')}`
      if (!v.sku || !v.sku.trim()) {
        validationErrors.push("Missing variant SKU")
      }

      if (!product.imageUrl) {
        validationErrors.push("Missing primary product image")
      }

      const sellPrice = Number(v.price)
      if (isNaN(sellPrice) || sellPrice <= 0) {
        validationErrors.push("Price must be a valid positive number")
      }

      const isVariantInStock = v.stock !== undefined ? v.stock > 0 : (product.inStock ?? true)
      if (!isVariantInStock) {
        validationErrors.push("Variant inventory is out of stock")
      }

      let status: GoogleFeedItem["status"] = "Ready for Google"
      if (validationErrors.includes("Missing variant SKU")) {
        status = "Missing SKU"
      } else if (validationErrors.includes("Missing primary product image")) {
        status = "Missing Image"
      } else if (validationErrors.includes("Price must be a valid positive number")) {
        status = "Invalid Price"
      } else if (!isVariantInStock) {
        status = "Out of Stock"
      }

      // Title Generation
      let sizeSuffix = v.size
      if (product.category === "Perfumes" && !sizeSuffix.toLowerCase().includes("spray")) {
        sizeSuffix = `${v.size} Spray`
      } else if (product.category === "Attars" && !sizeSuffix.toLowerCase().includes("roll-on") && !sizeSuffix.toLowerCase().includes("attar")) {
        sizeSuffix = `${v.size} Roll-On`
      } else if (product.category === "Bakhoor" && !sizeSuffix.toLowerCase().includes("incense")) {
        sizeSuffix = `${v.size} Incense`
      }

      const title = `${product.name} - ${sizeSuffix}`
      const link = `${siteUrl}/product/${product.slug}?variant=${encodeURIComponent(variantSku)}`
      const imageLink = ensureHttpsUrl(product.imageUrl, siteUrl)
      
      const additionalImageLinks = (product.imageGallery || [])
        .filter(img => img && img !== product.imageUrl)
        .map(img => ensureHttpsUrl(img, siteUrl))

      // Price mapping:
      // If compareAtPrice > price, price is the standard regular price and salePrice is the selling price
      const hasDiscount = v.compareAtPrice !== undefined && v.compareAtPrice !== null && Number(v.compareAtPrice) > sellPrice
      const regularPrice = hasDiscount ? Number(v.compareAtPrice) : sellPrice
      const salePrice = hasDiscount ? sellPrice : null

      // Shipping rule: Free pan-India above Rs 999, else Rs 99
      const shippingPrice = sellPrice >= 999 ? 0 : 99

      const productType = `Fragrances > ${product.category}${product.series ? ' > ' + product.series : ''}`

      items.push({
        id: variantSku,
        itemGroupId: product.id,
        title,
        description: cleanDesc,
        link,
        imageLink,
        additionalImageLinks,
        availability: isVariantInStock ? "in_stock" : "out_of_stock",
        price: regularPrice,
        salePrice,
        currency: "INR",
        condition: "new",
        brand: DEFAULT_BRAND,
        googleProductCategory: GOOGLE_PERFUME_CATEGORY,
        productType,
        size: v.size,
        gender: (product.gender || "Unisex").toLowerCase(),
        ageGroup: "adult",
        identifierExists: "no",
        shippingCountry: "IN",
        shippingService: "Standard Express Delivery",
        shippingPrice,
        parentName: product.name,
        parentSlug: product.slug,
        category: product.category,
        series: product.series,
        status,
        validationErrors
      })
    }
  }

  return items
}

/**
 * Formats a single Google feed item XML snippet
 */
export function formatGoogleFeedItemXml(item: GoogleFeedItem): string {
  const safeTitle = item.title.replace(/]]>/g, "]]&gt;")
  const safeDescription = item.description.replace(/]]>/g, "]]&gt;")

  let xml = `    <item>\n`
  xml += `      <g:id>${item.id}</g:id>\n`
  xml += `      <g:item_group_id>${item.itemGroupId}</g:item_group_id>\n`
  xml += `      <g:title><![CDATA[${safeTitle}]]></g:title>\n`
  xml += `      <g:description><![CDATA[${safeDescription}]]></g:description>\n`
  xml += `      <g:link>${item.link}</g:link>\n`
  xml += `      <g:image_link>${item.imageLink}</g:image_link>\n`

  for (const addImg of item.additionalImageLinks.slice(0, 5)) {
    xml += `      <g:additional_image_link>${addImg}</g:additional_image_link>\n`
  }

  xml += `      <g:availability>${item.availability}</g:availability>\n`
  xml += `      <g:price>${item.price.toFixed(2)} ${item.currency}</g:price>\n`

  if (item.salePrice !== undefined && item.salePrice !== null && item.salePrice > 0) {
    xml += `      <g:sale_price>${item.salePrice.toFixed(2)} ${item.currency}</g:sale_price>\n`
  }

  xml += `      <g:condition>${item.condition}</g:condition>\n`
  xml += `      <g:brand><![CDATA[${item.brand}]]></g:brand>\n`
  xml += `      <g:google_product_category><![CDATA[${item.googleProductCategory}]]></g:google_product_category>\n`
  xml += `      <g:product_type><![CDATA[${item.productType}]]></g:product_type>\n`
  xml += `      <g:size><![CDATA[${item.size}]]></g:size>\n`
  xml += `      <g:gender>${item.gender}</g:gender>\n`
  xml += `      <g:age_group>${item.ageGroup}</g:age_group>\n`
  xml += `      <g:identifier_exists>${item.identifierExists}</g:identifier_exists>\n`

  xml += `      <g:shipping>\n`
  xml += `        <g:country>${item.shippingCountry}</g:country>\n`
  xml += `        <g:service>${item.shippingService}</g:service>\n`
  xml += `        <g:price>${item.shippingPrice.toFixed(2)} ${item.currency}</g:price>\n`
  xml += `      </g:shipping>\n`

  xml += `    </item>`
  return xml
}

/**
 * Generates Google Merchant Center RSS 2.0 / XML feed string
 */
export function generateGoogleShoppingXml(items: GoogleFeedItem[], siteUrl: string): string {
  const now = new Date().toUTCString()
  const itemsXml = items.map(formatGoogleFeedItemXml).join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>SN AttarWala - Official Google Shopping Product Feed</title>
    <link>${siteUrl}</link>
    <description>Authentic handcrafted attars, pure oudh, and French artisanal perfumes from SN AttarWala Mumbai, India.</description>
    <lastBuildDate>${now}</lastBuildDate>
${itemsXml}
  </channel>
</rss>`
}

/**
 * Produces audit summary metrics for admin dashboard
 */
export async function getGoogleShoppingAuditSummary(): Promise<GoogleShoppingAuditSummary> {
  const items = await getGoogleShoppingItems()
  const siteUrl = getBaseSiteUrl()

  const parentIds = new Set(items.map(i => i.itemGroupId))
  const readyCount = items.filter(i => i.status === "Ready for Google").length
  const missingSkuCount = items.filter(i => i.status === "Missing SKU").length
  const missingImageCount = items.filter(i => i.status === "Missing Image").length
  const invalidPriceCount = items.filter(i => i.status === "Invalid Price").length
  const outOfStockCount = items.filter(i => i.status === "Out of Stock").length
  const missingBrandCount = items.filter(i => !i.brand || i.brand.trim() === "").length
  const missingDataCount = items.filter(i => i.validationErrors.length > 0).length

  const total = items.length
  const readyPercent = total > 0 ? Math.round((readyCount / total) * 100) : 0

  return {
    totalActiveProducts: parentIds.size,
    totalActiveVariants: total,
    readyCount,
    readyPercent,
    missingSkuCount,
    missingImageCount,
    invalidPriceCount,
    missingBrandCount,
    missingDataCount,
    outOfStockCount,
    lastGenerated: new Date().toISOString(),
    feedUrl: `${siteUrl}/feeds/google-shopping.xml`
  }
}

/**
 * Builds Google ProductGroup and Product Schema.org JSON-LD
 */
export function generateProductStructuredData(
  product: PublicProduct,
  selectedVariantSkuOrSize?: string,
  siteUrl = DEFAULT_SITE_URL
): object {
  const baseUrl = siteUrl.replace(/\/+$/, "")
  const productUrl = `${baseUrl}/product/${product.slug}`
  const primaryImg = ensureHttpsUrl(product.imageUrl, baseUrl)

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

  // Find active variant matching search param or default
  const activeVariant = variants.find(
    v => (v.sku && v.sku.toLowerCase() === selectedVariantSkuOrSize?.toLowerCase()) ||
         (v.size && v.size.toLowerCase() === selectedVariantSkuOrSize?.toLowerCase())
  ) || variants.find(v => v.isDefault) || variants[0]

  const activePrice = activeVariant.price
  const inStock = activeVariant.stock !== undefined ? activeVariant.stock > 0 : (product.inStock ?? true)
  const activeSku = activeVariant.sku || `${product.sku || 'SNA'}-${activeVariant.size}`
  const activeVariantUrl = `${productUrl}?variant=${encodeURIComponent(activeSku)}`

  // Return policy details
  const merchantReturnPolicy = {
    "@type": "MerchantReturnPolicy",
    "applicableCountry": "IN",
    "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
    "merchantReturnDays": 7,
    "returnMethod": "https://schema.org/ReturnByMail",
    "returnFees": "https://schema.org/FreeReturn"
  }

  // Shipping details
  const shippingDetails = {
    "@type": "OfferShippingDetails",
    "shippingRate": {
      "@type": "MonetaryAmount",
      "value": activePrice >= 999 ? 0 : 99,
      "currency": "INR"
    },
    "shippingDestination": {
      "@type": "DefinedRegion",
      "addressCountry": "IN"
    },
    "deliveryTime": {
      "@type": "ShippingDeliveryTime",
      "handlingTime": {
        "@type": "QuantitativeValue",
        "minValue": 0,
        "maxValue": 1,
        "unitCode": "DAY"
      },
      "transitTime": {
        "@type": "QuantitativeValue",
        "minValue": 2,
        "maxValue": 5,
        "unitCode": "DAY"
      }
    }
  }

  // Individual variant Product elements for hasVariant
  const variantProducts = variants.map(v => {
    const vSku = v.sku || `${product.sku || 'SNA'}-${v.size}`
    const vInStock = v.stock !== undefined ? v.stock > 0 : (product.inStock ?? true)
    return {
      "@type": "Product",
      "name": `${product.name} - ${v.size}`,
      "sku": vSku,
      "size": v.size,
      "image": primaryImg,
      "offers": {
        "@type": "Offer",
        "price": v.price,
        "priceCurrency": "INR",
        "availability": vInStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "itemCondition": "https://schema.org/NewCondition",
        "url": `${productUrl}?variant=${encodeURIComponent(vSku)}`,
        "priceValidUntil": "2027-12-31",
        "seller": {
          "@type": "Organization",
          "name": DEFAULT_BRAND
        },
        "shippingDetails": {
          "@type": "OfferShippingDetails",
          "shippingRate": {
            "@type": "MonetaryAmount",
            "value": v.price >= 999 ? 0 : 99,
            "currency": "INR"
          },
          "shippingDestination": {
            "@type": "DefinedRegion",
            "addressCountry": "IN"
          }
        },
        "hasMerchantReturnPolicy": merchantReturnPolicy
      }
    }
  })

  // Full graph including ProductGroup (parent) and active variant Product
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProductGroup",
        "@id": `${productUrl}#productgroup`,
        "name": product.name,
        "description": cleanTextForGoogle(product.description || product.shortDescription),
        "url": productUrl,
        "productGroupID": product.id,
        "brand": {
          "@type": "Brand",
          "name": DEFAULT_BRAND
        },
        "variesBy": ["https://schema.org/size"],
        "hasVariant": variantProducts
      },
      {
        "@type": "Product",
        "@id": `${activeVariantUrl}#product`,
        "name": `${product.name} - ${activeVariant.size}`,
        "description": cleanTextForGoogle(product.description || product.shortDescription),
        "image": primaryImg,
        "sku": activeSku,
        "size": activeVariant.size,
        "brand": {
          "@type": "Brand",
          "name": DEFAULT_BRAND
        },
        "isVariantOf": {
          "@type": "ProductGroup",
          "@id": `${productUrl}#productgroup`
        },
        ...(product.rating && product.reviews ? {
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": product.rating,
            "reviewCount": product.reviews
          }
        } : {}),
        "offers": {
          "@type": "Offer",
          "price": activePrice,
          "priceCurrency": "INR",
          "availability": inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "itemCondition": "https://schema.org/NewCondition",
          "url": activeVariantUrl,
          "priceValidUntil": "2027-12-31",
          "seller": {
            "@type": "Organization",
            "name": DEFAULT_BRAND
          },
          "shippingDetails": shippingDetails,
          "hasMerchantReturnPolicy": merchantReturnPolicy
        }
      }
    ]
  }
}
