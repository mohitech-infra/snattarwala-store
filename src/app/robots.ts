import { MetadataRoute } from "next"
import { getBaseSiteUrl } from "@/lib/google-shopping-service"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseSiteUrl()

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/product/", "/shop", "/about", "/contact", "/shipping", "/privacy", "/terms", "/faq", "/products/"],
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/auth/",
          "/checkout",
          "/order-success",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/product/", "/products/", "/shop", "/feeds/google-shopping.xml"],
        disallow: ["/admin/", "/api/"],
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/products/", "/*.jpg$", "/*.jpeg$", "/*.png$", "/*.webp$"],
      },
      {
        userAgent: "AdsBot-Google",
        allow: ["/", "/product/", "/products/"],
      },
      {
        userAgent: "Mediapartners-Google",
        allow: ["/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
