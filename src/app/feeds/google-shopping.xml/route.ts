import { NextResponse } from "next/server"
import { getGoogleShoppingItems, generateGoogleShoppingXml, getBaseSiteUrl } from "@/lib/google-shopping-service"

export const dynamic = "force-dynamic"
export const revalidate = 3600 // 1 hour revalidation cache

export async function GET() {
  try {
    const siteUrl = getBaseSiteUrl()
    const items = await getGoogleShoppingItems()
    const xml = generateGoogleShoppingXml(items, siteUrl)

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
        "X-Robots-Tag": "noindex, follow", // Feeds are ingested by GMC, not indexed in web search SERP
      },
    })
  } catch (err: any) {
    console.error("[Google Shopping Feed Error]", err)
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><error><message>Failed to generate Google Shopping feed</message><details>${err?.message || "Unknown error"}</details></error>`,
      {
        status: 500,
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
        },
      }
    )
  }
}

