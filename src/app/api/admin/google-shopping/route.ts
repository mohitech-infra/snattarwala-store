import { NextResponse } from "next/server"
import { getGoogleShoppingAuditSummary, getGoogleShoppingItems, formatGoogleFeedItemXml, getBaseSiteUrl } from "@/lib/google-shopping-service"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const summary = await getGoogleShoppingAuditSummary()
    const items = await getGoogleShoppingItems()
    const baseUrl = getBaseSiteUrl()

    return NextResponse.json({
      success: true,
      summary,
      items,
      feedUrl: `${baseUrl}/feeds/google-shopping.xml`,
      generatedAt: new Date().toISOString()
    })
  } catch (error: any) {
    console.error("Error generating Google Shopping audit:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load Google Shopping data" },
      { status: 500 }
    )
  }
}
