import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getPublicProducts } from "@/lib/public-service"
import { getStorePolicies } from "@/lib/policies-service"
import { generateProductStructuredData, getBaseSiteUrl } from "@/lib/google-shopping-service"
import { ProductDetailView } from "@/components/product/product-detail-view"

interface ProductPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ params, searchParams }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const search = await searchParams
  const variantParam = typeof search.variant === "string" 
    ? search.variant 
    : Array.isArray(search.variant) 
      ? search.variant[0] 
      : undefined

  const products = await getPublicProducts()
  const product = products.find((p) => p.slug === slug)

  if (!product) {
    return {
      title: "Product Not Found | SN AttarWala",
      description: "The requested fragrance was not found.",
    }
  }

  const baseUrl = getBaseSiteUrl()
  const canonicalUrl = `${baseUrl}/product/${product.slug}`

  // If a specific variant is selected, customize title
  const activeVariant = product.variants?.find(
    (v) => (v.sku && v.sku.toLowerCase() === variantParam?.toLowerCase()) ||
           (v.size && v.size.toLowerCase() === variantParam?.toLowerCase())
  )

  const pageTitle = activeVariant
    ? `${product.name} - ${activeVariant.size} | SN AttarWala`
    : `${product.name} | Authentic Artisanal Attar & Luxury Perfume | SN AttarWala`

  const rawDesc = product.shortDescription || product.description || `Shop ${product.name} by SN AttarWala.`
  const metaDesc = rawDesc.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 155)

  const imageUrl = product.imageUrl?.startsWith("http")
    ? product.imageUrl
    : `${baseUrl}${product.imageUrl?.startsWith("/") ? "" : "/"}${product.imageUrl || "/products/white-oudh-attar.jpg"}`

  return {
    title: pageTitle,
    description: metaDesc,
    alternates: {
      canonical: canonicalUrl, // Google canonical rule: always point to parent URL
    },
    openGraph: {
      title: pageTitle,
      description: metaDesc,
      url: variantParam ? `${canonicalUrl}?variant=${encodeURIComponent(variantParam)}` : canonicalUrl,
      siteName: "SN AttarWala",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 1200,
          alt: `${product.name} - Luxury Fragrance bottle`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: metaDesc,
      images: [imageUrl],
    },
  }
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { slug } = await params
  const search = await searchParams
  const variantParam = typeof search.variant === "string" 
    ? search.variant 
    : Array.isArray(search.variant) 
      ? search.variant[0] 
      : undefined

  const allProducts = await getPublicProducts()
  const product = allProducts.find((p) => p.slug === slug)

  if (!product) {
    notFound()
  }

  const relatedProducts = allProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4)

  const policies = await getStorePolicies()
  const baseUrl = getBaseSiteUrl()
  const structuredData = generateProductStructuredData(product, variantParam, baseUrl)

  return (
    <>
      {/* Google Shopping & Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ProductDetailView
        product={product}
        relatedProducts={relatedProducts}
        initialVariantSku={variantParam}
        policies={policies}
      />
    </>
  )
}
